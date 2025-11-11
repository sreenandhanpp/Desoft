import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, ShoppingCart, TrendingUp, Upload, RefreshCw, X, Tag, ShoppingBag } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [productImage, setProductImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [offerImage, setOfferImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    originalPrice: '',
    size: '',
    stock: '',
    count: '',
    onOffer: false
  });

  // Offer form state - simplified for image only
  const [offerForm, setOfferForm] = useState({
    isActive: true
  });

  // API Base URL
  const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState({
    totalSales: 0,
    totalOrders: 0,
    deliveredOrders: 0
  });
  const [allOrders, setAllOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminSession = localStorage.getItem('adminSession');

    if (!adminAuth || adminAuth !== 'true' || !adminSession) {
      navigate('/admin-auth');
      return;
    }

    try {
      const session = JSON.parse(adminSession);
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminSession');
        navigate('/admin-auth');
        return;
      }
    } catch (error) {
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminSession');
      navigate('/admin-auth');
      return;
    }

    fetchProducts();
    fetchOffers();
    fetchOrderStats();
    fetchAllOrders();
  }, [navigate]);

  // API Functions
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/offers`);
      const data = await response.json();
      if (response.ok) {
        setBanners(data.offers || []);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/stats`);
      const data = await response.json();
      if (response.ok) {
        setOrders(data.stats || {
          totalSales: 0,
          totalOrders: 0,
          deliveredOrders: 0
        });
      }
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders`);
      const data = await response.json();
      if (response.ok) {
        setAllOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError('');
      
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        // Show success notification
        showSuccessNotification(`Order status updated to ${newStatus}`);
        
        // Refresh data
        await fetchAllOrders();
        await fetchOrderStats();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update order status');
      }
    } catch (err) {
      setError('Network error while updating order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const showSuccessNotification = (message) => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const createProduct = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!productForm.name || !productForm.category || !productForm.price || !productForm.size) {
        setError('Please fill in all required fields (Name, Category, Price, Size)');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description || productForm.name);
      formData.append('price', parseFloat(productForm.price));
      formData.append('category', productForm.category);
      formData.append('size', productForm.size);
      formData.append('stock', parseInt(productForm.stock) || 0);
      formData.append('count', productForm.count || '');
      formData.append('originalPrice', productForm.originalPrice ? parseFloat(productForm.originalPrice) : '');
      formData.append('onOffer', productForm.onOffer);
      
      // Append image file if selected
      if (productImage) {
        formData.append('image', productImage);
      }

      console.log('Sending product data with FormData');

      const response = await fetch(`${API_BASE}/admin/product`, {
        method: 'POST',
        body: formData // Don't set Content-Type header, let browser set it with boundary
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        await fetchProducts(); // Refresh products list
        // Reset form
        setProductForm({
          name: '',
          description: '',
          category: '',
          price: '',
          originalPrice: '',
          size: '',
          stock: '',
          count: '',
          onOffer: false
        });
        setProductImage(null);
        setError(''); // Clear any previous errors
      } else {
        setError(data.error || data.details || 'Failed to create product');
        console.error('Product creation failed:', data);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error while creating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!productForm.name || !productForm.category || !productForm.price || !productForm.size) {
        setError('Please fill in all required fields (Name, Category, Price, Size)');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description || productForm.name);
      formData.append('price', parseFloat(productForm.price));
      formData.append('category', productForm.category);
      formData.append('size', productForm.size);
      formData.append('stock', parseInt(productForm.stock) || 0);
      formData.append('count', productForm.count || '');
      formData.append('originalPrice', productForm.originalPrice ? parseFloat(productForm.originalPrice) : '');
      formData.append('onOffer', productForm.onOffer);
      
      // Append image file if selected
      if (productImage) {
        formData.append('image', productImage);
      }

      console.log('Sending product data with FormData');

      const response = await fetch(`${API_BASE}/admin/product/${editingProduct._id}`, {
        method: 'PUT',
        body: formData // Don't set Content-Type header, let browser set it with boundary
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        await fetchProducts(); // Refresh products list
        // Reset form
        setProductForm({
          name: '',
          description: '',
          category: '',
          price: '',
          originalPrice: '',
          size: '',
          stock: '',
          count: '',
          onOffer: false
        });
        setProductImage(null);
        setEditingProduct(null);
        setError(''); // Clear any previous errors
      } else {
        setError(data.error || data.details || 'Failed to update product');
        console.error('Product update failed:', data);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error while updating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/product/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchProducts(); // Refresh products list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete product');
      }
    } catch (err) {
      setError('Network error while deleting product');
    }
  };

  const handleProductFormChange = (field, value) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminSession');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = allOrders.filter(order => {
    const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
    const matchesSearch = orderSearch === '' || 
      order.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerInfo.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerInfo.phone.includes(orderSearch);
    return matchesFilter && matchesSearch;
  });

  const renderOrdersTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Sales</p>
              <p className="text-2xl font-bold">QR {orders.totalSales}</p>
            </div>
            <div className="text-3xl opacity-80">QR</div>
          </div>
        </div>
        
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Orders</p>
              <p className="text-2xl font-bold">{orders.totalOrders}</p>
            </div>
            <Package className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-purple-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Delivered</p>
              <p className="text-2xl font-bold">{orders.deliveredOrders}</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-orange-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Pending</p>
              <p className="text-2xl font-bold">{allOrders.filter(o => o.status === 'pending').length}</p>
            </div>
            <ShoppingCart className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Order Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Order Management ({filteredOrders.length} orders)
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search by Order ID, Name, or Phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              
              {/* Filter */}
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              {/* Refresh */}
              <button 
                onClick={() => {
                  fetchAllOrders();
                  fetchOrderStats();
                }}
                className="flex items-center text-cyan-500 hover:text-cyan-600 px-3 py-2 border border-cyan-500 rounded-md hover:bg-cyan-50"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">
                {allOrders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
              </h4>
              <p className="text-gray-500">
                {allOrders.length === 0 ? 'Orders will appear here when customers place them' : 'Try adjusting your search or filter criteria'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredOrders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div>
                        <h4 className="font-semibold text-gray-900">Order #{order.orderId}</h4>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-lg font-bold text-gray-900">QR {order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Customer Info */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Customer</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Name:</span> {order.customerInfo.name}</p>
                        <p><span className="font-medium">Phone:</span> {order.customerInfo.phone}</p>
                        <p><span className="font-medium">Address:</span> {order.customerInfo.address}</p>
                        <p><span className="font-medium">Comments:</span> {order.delivery.comment}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h5>
                      <div className="text-sm text-gray-600 space-y-1 max-h-20 overflow-y-auto">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {item.productId?.image && (
                              <img 
                                src={`${import.meta.env.VITE_BACKEND_URL}${item.productId.image}`} 
                                alt={item.productId?.name || 'Product'} 
                                className="w-6 h-6 rounded object-cover"
                              />
                            )}
                            <span>{item.productId?.name || 'Product'} x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Actions</h5>
                      <div className="flex flex-col gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          disabled={updatingOrderId === order._id}
                          className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        {updatingOrderId === order._id && (
                          <div className="flex items-center text-xs text-blue-600 mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                            Updating...
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          <p><span className="font-medium">Payment:</span> {order.paymentMethod}</p>
                          <p><span className="font-medium">Delivery:</span> {order.delivery.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add New Product */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-cyan-600 flex items-center">
            {editingProduct ? (
              <Edit className="w-5 h-5 mr-2" />
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => handleProductFormChange('name', e.target.value)}
              placeholder="e.g. Baby Diapers Size 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={productForm.category}
              onChange={(e) => handleProductFormChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option>Select category</option>
              <option>Diapers</option>
              <option>Baby Wipes</option>
              <option>Baby Care</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              {productImage ? (
                <img src={URL.createObjectURL(productImage)} alt="Product Image" className="mx-auto mb-4 rounded" />
              ) : (
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              )}
              <input
                type="file"
                onChange={(e) => setProductImage(e.target.files[0])}
                className="text-cyan-500 hover:text-cyan-600"
              />
              <span className="text-gray-500 ml-2">{productImage ? productImage.name : 'No file chosen'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (QR) *</label>
              <input
                type="number"
                value={productForm.price}
                onChange={(e) => handleProductFormChange('price', e.target.value)}
                placeholder="75.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (QR)</label>
              <input
                type="number"
                value={productForm.originalPrice}
                onChange={(e) => handleProductFormChange('originalPrice', e.target.value)}
                placeholder="85.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size *</label>
              <select
                value={productForm.size}
                onChange={(e) => handleProductFormChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option>Newborn (NB)</option>
                <option>Size 1</option>
                <option>Size 2</option>
                <option>Size 3</option>
                <option>Size 4</option>
                <option>Size 5</option>
                <option>Size 6</option>
                <option>Small (S)</option>
                <option>Medium (M)</option>
                <option>Large (L)</option>
                <option>Extra Large (XL)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Count *</label>
              <input
                type="number"
                value={productForm.count}
                onChange={(e) => handleProductFormChange('count', e.target.value)}
                placeholder="70pcs"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Qty</label>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => handleProductFormChange('stock', e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={productForm.onOffer}
              onChange={(e) => handleProductFormChange('onOffer', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Mark as Special Offer</label>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={editingProduct ? updateProduct : createProduct}
              disabled={loading}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
            >
              {loading ? (
                <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full text-white"></div>
              ) : (
                editingProduct ? (
                  <Edit className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )
              )}
              {loading ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update Product' : 'Add Product')}
            </button>
            
            {editingProduct && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    description: '',
                    category: '',
                    price: '',
                    originalPrice: '',
                    size: '',
                    stock: '',
                    count: '',
                    onOffer: false
                  });
                  setProductImage(null);
                  setError('');
                }}
                className="px-6 py-2 bg-red-100 border border-red-300 text-red-700 rounded-md hover:bg-red-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-cyan-600 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Products Management ({products.length} products)
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-[32rem] overflow-y-auto">
            {products.map((product) => (
              <div key={product._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img 
                    src={product.image ? `${API_BASE.replace('/api', '')}${product.image}` : '/api/placeholder/60/60'} 
                    alt={product.name} 
                    className="w-12 h-12 rounded-md object-cover bg-gray-200"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/60/60';
                    }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">
                      Category: {product.category} • Size: {product.size} • {product.count || '2'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-cyan-600 font-semibold">{product.price} QR</span>
                      {product.originalPrice && (
                        <span className="text-gray-400 line-through text-sm">{product.originalPrice} QR</span>
                      )}
                      <span className="text-green-600 text-sm">Stock: {product.stock}</span>
                      {product.onOffer && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">Special Offer</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setProductForm({
                        name: product.name,
                        description: product.description,
                        category: product.category,
                        price: product.price,
                        originalPrice: product.originalPrice || '',
                        size: product.size,
                        stock: product.stock,
                        count: product.count || '',
                        onOffer: product.onOffer || false
                      });
                      setEditingProduct(product);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOffersTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Edit Banner */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-cyan-600 flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Banner
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Banner Image *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
              {bannerImage ? (
                <img src={URL.createObjectURL(bannerImage)} alt="Banner Image" className="mx-auto mb-4 rounded" />
              ) : (
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              )}
              <input
                type="file"
                onChange={(e) => setBannerImage(e.target.files[0])}
                className="text-cyan-500 hover:text-cyan-600"
              />
              <span className="text-gray-500 ml-2">{bannerImage ? bannerImage.name : 'No file chosen'}</span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-md flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Update Banner
            </button>
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Banner Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-cyan-600 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Banner Management ({banners.length} banners)
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img src={banner.image} alt="Banner" className="w-20 h-12 rounded-md object-cover bg-gray-200" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${banner.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {banner.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOffersFormTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Offer Image */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-cyan-600 flex items-center">
            {editingOffer ? (
              <Edit className="w-5 h-5 mr-2" />
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            {editingOffer ? 'Edit Offer Image' : 'Upload Offer Image'}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Offer Image *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
              {offerImage ? (
                <div className="space-y-4">
                  <img 
                    src={URL.createObjectURL(offerImage)} 
                    alt="Offer Image" 
                    className="mx-auto mb-4 rounded max-w-full h-48 object-contain" 
                  />
                  <p className="text-sm text-gray-600">{offerImage.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">Upload your offer image</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setOfferImage(e.target.files[0])}
                className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={offerForm.isActive}
              onChange={(e) => setOfferForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Make this offer active</label>
          </div>
          
          <button
            onClick={editingOffer ? updateOffer : createOffer}
            disabled={loading || !offerImage}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md flex items-center justify-center"
          >
            {loading ? (
              <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full text-white"></div>
            ) : (
              editingOffer ? (
                <Edit className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )
            )}
            {loading ? (editingOffer ? 'Updating...' : 'Uploading...') : (editingOffer ? 'Update Offer' : 'Upload Offer')}
          </button>
          
          {editingOffer && (
            <button
              onClick={() => {
                setEditingOffer(null);
                setOfferForm({
                  isActive: true
                });
                setOfferImage(null);
                setError('');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center mt-2"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Offers Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-cyan-600 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Offers Management ({banners.length} offers)
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {banners.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No offers uploaded yet</p>
                <p className="text-sm text-gray-400">Upload your first offer image to get started</p>
              </div>
            ) : (
              banners.map((banner) => (
  <div
    key={banner._id || banner.id}
    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-3"
  >
    {/* Left Section (Image + Info) */}
    <div className="flex items-center space-x-4 w-full sm:w-auto">
      <img
        src={
          banner.image
            ? `${API_BASE.replace('/api', '')}${banner.image}`
            : '/api/placeholder/80/60'
        }
        alt="Offer"
        className="w-20 h-12 rounded-md object-cover bg-gray-200"
        onError={(e) => {
          e.target.src = '/api/placeholder/80/60';
        }}
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-1 text-xs rounded ${
              banner.isActive
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {banner.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(banner.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>

    {/* Right Section (Action Buttons) */}
    <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
      <button
        onClick={() => {
          setOfferForm({
            isActive: banner.isActive,
          });
          setEditingOffer(banner);
        }}
        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => deleteOffer(banner._id || banner.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
)))}
          </div>
        </div>
      </div>
    </div>
  );

  const createOffer = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!offerImage) {
        setError('Please select an image to upload');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('isActive', offerForm.isActive);
      formData.append('image', offerImage);

      console.log('Sending offer image with FormData');

      const response = await fetch(`${API_BASE}/admin/offer`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        await fetchOffers(); // Refresh offers list
        // Reset form
        setOfferForm({
          isActive: true
        });
        setOfferImage(null);
        setError(''); // Clear any previous errors
      } else {
        setError(data.error || data.details || 'Failed to upload offer');
        console.error('Offer creation failed:', data);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error while uploading offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOffer = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('isActive', offerForm.isActive);
      
      // Append image file if selected
      if (offerImage) {
        formData.append('image', offerImage);
      }

      console.log('Sending offer update with FormData');

      const response = await fetch(`${API_BASE}/admin/offer/${editingOffer._id || editingOffer.id}`, {
        method: 'PUT',
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        await fetchOffers(); // Refresh offers list
        // Reset form
        setOfferForm({
          isActive: true
        });
        setOfferImage(null);
        setEditingOffer(null);
        setError(''); // Clear any previous errors
      } else {
        setError(data.error || data.details || 'Failed to update offer');
        console.error('Offer update failed:', data);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error while updating offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (offerId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/offer/${offerId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchOffers(); // Refresh offers list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete offer');
      }
    } catch (err) {
      setError('Network error while deleting offer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                A
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">Manage your store</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[20px]">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium border-r border-gray-200 transition-colors ${
                activeTab === 'products'
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5 mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium border-r border-gray-200 transition-colors ${
                activeTab === 'offers'
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Tag className="w-5 h-5 mr-2" />
              Offers
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Orders
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'offers' && renderOffersFormTab()}
      </div>
    </div>
  );
};

export default Admin;
