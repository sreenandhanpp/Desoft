const Order = require('../MongoDb/models/Order');
const Product = require('../MongoDb/models/Product');
const Cart = require('../MongoDb/models/Cart');
const sendOrderNotification = require('../utils/whatsapp');

// Generate unique order ID
const generateOrderId = () => {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};


// Place Order
exports.placeOrder = async (req, res) => {
    const { userId } = req.params;
    const { customerInfo, delivery, paymentMethod, cartItems, totalAmount } = req.body;

    try {
        // Validate required fields
        if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address) {
            return res.status(400).json({ error: "Customer information is required" });
        }
        if (!delivery || !delivery.date) {
            return res.status(400).json({ error: "Delivery date required" });
        }
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }
        if (!paymentMethod) {
            return res.status(400).json({ error: "Payment method is required" });
        }
        if (!totalAmount || totalAmount <= 0) {
            return res.status(400).json({ error: "Valid total amount is required" });
        }

        // Generate unique order ID
        const orderId = generateOrderId();

        // Prepare order items and check stock
        const orderItems = [];
        for (const item of cartItems) {
            // Handle both populated and non-populated productId
            const productId = item.productId._id || item.productId;
            const productName = item.productId.name || 'Unknown Product';
            const productPrice = item.productId.price || 0;
            
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ error: `Product ${productName} not found` });
            }
            
            // Check stock availability
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
                });
            }

            orderItems.push({
                productId: productId,
                quantity: item.quantity,
                price: productPrice,
                size: item.size || product.size || 'NB',
                count: item.count || product.count || 1
            });
        }

        // Create order
        const newOrder = new Order({
            userId,
            orderId,
            items: orderItems,
            customerInfo,
            delivery,
            paymentMethod,
            totalAmount
        });

        await newOrder.save();

        // send notification to the admin through whatsapp
        // await sendOrderNotification(orderId, customerInfo.name, totalAmount);


        // Decrease product quantities
        for (const item of cartItems) {
            const productId = item.productId._id || item.productId;
            await Product.findByIdAndUpdate(
                productId,
                { $inc: { stock: -item.quantity } }
            );
        }

        // Clear all cart items from Cart model after successful order
        try {
            await Cart.deleteMany({ userId });
            console.log('Cart cleared for user:', userId);
        } catch (cartError) {
            console.error('Error clearing cart:', cartError);
            // Don't fail the order if cart clearing fails
        }

        res.status(201).json({ 
            message: "Order placed successfully", 
            order: newOrder 
        });
    } catch (error) {
        console.error('Error placing order:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            orderData: { userId, customerInfo, delivery, paymentMethod, totalAmount }
        });
        res.status(500).json({ error: "Failed to place order", details: error.message });
    }
};
    
    // Get Orders
exports.getOrders = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const orders = await Order.find({ userId })
            .populate('items.productId')
            .sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: "Failed to fetch orders", details: err.message });
    }
}

// Admin: Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('items.productId')
            .sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (err) {
        console.error('Error fetching all orders:', err);
        res.status(500).json({ error: "Failed to fetch orders", details: err.message });
    }
};

// Admin: Get order statistics
exports.getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments({});
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        
        // Calculate total sales from delivered orders
        const salesResult = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
        
        res.status(200).json({
            stats: {
                totalOrders,
                deliveredOrders,
                totalSales
            }
        });
    } catch (err) {
        console.error('Error fetching order stats:', err);
        res.status(500).json({ error: "Failed to fetch order statistics", details: err.message });
    }
};

// Admin: Update order status
exports.updateOrderStatusAdmin = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    
    try {
        if (!orderId || !status) {
            return res.status(400).json({ error: "Order ID and status are required" });
        }

        const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status. Must be one of: " + validStatuses.join(', ') });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate('items.productId');

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Emit real-time update to the specific user
        const io = req.app.get('io');
        if (io && order.userId) {
            io.to(`user-${order.userId}`).emit('orderStatusUpdate', {
                orderId: order._id,
                orderNumber: order.orderId,
                newStatus: status,
                order: order
            });
            console.log(`Emitted order status update to user ${order.userId}`);
        }

        res.status(200).json({ 
            message: "Order status updated successfully", 
            order 
        });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: "Failed to update order status", details: err.message });
    }
};
// Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({ error: "Order ID and status are required" });
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, userId: req.user._id },
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.status(200).json({ message: "Order status updated successfully", order });
    } catch (err) {
        res.status(500).json({ error: "Failed to update order status", details: err.message });
    }
};

// Delete Order
exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOneAndDelete({ _id: orderId, userId: req.user._id });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete order", details: err.message });
    }
};

// Get Order by user ID
exports.getOrderByUserId = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id });
        if (!orders.length) {
            return res.status(404).json({ error: "No orders found for this user" });
        }
        res.status(200).json({ orders });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders", details: err.message });
    }
};

// get Order by Order ID
exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.find ({ orderId, userId: req.user._id });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.status(200).json({ order });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch order", details: err.message });
    }
};
