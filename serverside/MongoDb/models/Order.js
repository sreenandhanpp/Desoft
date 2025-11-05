const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    size: { type: String },
    count: { type: String }
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    customerInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
       
    },
    delivery: {
        date: { type: String, required: true },
         comment: {type: String, required: false}
    },
    paymentMethod: { type: String, required: true, default: 'cash' },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'pending' }, // Pending, Confirmed, Shipped, Delivered, Cancelled
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
