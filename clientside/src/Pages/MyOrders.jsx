import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userAPI } from '../services/api';
import { Package, Clock, CheckCircle, XCircle, Calendar, MapPin, CreditCard, Phone, User, ArrowLeft, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showInfo } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated() && user) {
      fetchOrders();
      // Set up polling for real-time updates every 5 seconds
      startPolling();
      // Set up WebSocket connection for instant updates
      setupWebSocket();
    }
    
    return () => {
      stopPolling();
      disconnectWebSocket();
    };
  }, [user]);

  const fetchOrders = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');
      
      const response = await userAPI.getOrders(user._id);
      const newOrders = response.orders || [];
      
      // Check if any order status has changed
      if (orders.length > 0 && isBackgroundRefresh) {
        const statusChanged = newOrders.some(newOrder => {
          const oldOrder = orders.find(o => o._id === newOrder._id);
          return oldOrder && oldOrder.status !== newOrder.status;
        });
        
        if (statusChanged) {
          // Show a brief notification that orders have been updated
          showInfo('Order status updated!');
        }
      }
      
      setOrders(newOrders);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!isBackgroundRefresh) {
        setError('Failed to load orders');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const startPolling = () => {
    // Clear any existing interval
    stopPolling();
    
    // Set up new interval for polling every 5 seconds
    intervalRef.current = setInterval(() => {
      if (isAuthenticated() && user && document.visibilityState === 'visible') {
        fetchOrders(true); // Background refresh
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };


  const setupWebSocket = () => {
    if (!user) return;
    
    try {
      // Initialize socket connection
      socketRef.current = io(`${import.meta.env.VITE_BACKEND_URL}`, {
        transports: ['websocket', 'polling']
      });
      
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        // Join user-specific room
        socketRef.current.emit('join-user-room', user._id);
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
      });
      
      // Listen for order status updates
      socketRef.current.on('orderStatusUpdate', (data) => {
        console.log('Received order status update:', data);
        
        // Update the specific order in the orders array
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order => {
            if (order._id === data.orderId) {
              return { ...order, status: data.newStatus };
            }
            return order;
          });
          return updatedOrders;
        });
        
        // Show instant notification
        showSuccess(`Order ${data.orderNumber} is now ${data.newStatus}`, 'Instant Update!');
        setLastUpdated(new Date());
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      });
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };
  
  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };
  

  const handleManualRefresh = () => {
    fetchOrders(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
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

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: '#edf8f9'}}>
        <div className="text-center bg-white rounded-xl shadow-lg p-6 sm:p-8 mx-4 max-w-sm sm:max-w-md">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Please Login</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">You need to be logged in to view your orders</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: '#edf8f9'}}>
        <div className="text-center bg-white rounded-xl shadow-lg p-6 sm:p-8 mx-4 max-w-sm sm:max-w-md">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: '#edf8f9'}}>
        <div className="text-center bg-white rounded-xl shadow-lg p-6 sm:p-8 mx-4 max-w-sm sm:max-w-md">
          <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchOrders}
            className="bg-teal-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8" style={{backgroundColor: '#edf8f9'}}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {lastUpdated && (
                <span className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleManualRefresh}
                disabled={loading || isRefreshing}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm order-1 sm:order-2"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Refresh'}</span>
                <span className="sm:hidden">↻</span>
              </button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage your orders • {isConnected ? 'Instant live updates' : 'Auto-updates every 5 seconds'}</p>
          {/* Cancellation Reminder */}
<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-3 mt-3">
  <Phone className="w-4 h-4 flex-shrink-0" />
  <p className="text-sm">
    To cancel an order, contact us on :{" "}
    <a
      href="https://wa.me/97450253513"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline hover:text-yellow-900"
    >
      +974 5025 3513
    </a>
  </p>
</div>

        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-md mx-4 sm:mx-0">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Orders Yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <a 
              href="/"
              className="bg-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center text-sm sm:text-base"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 mx-2 sm:mx-0">
                {/* Order Header */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b">
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          Order #{order.orderId}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        QR {order.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {item.productId?.image ? (
                                <img 
                                  src={`${import.meta.env.VITE_BACKEND_URL}${item.productId.image}`} 
                                  alt={item.productId.name || 'Product'} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                {item.productId?.name || 'Product Not Found'}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Qty: {item.quantity} | Size: {item.productId?.size || 'NB'} | QR {item.price}
                              </p>
                              {item.productId?.description && (
                                <p className="text-xs text-gray-500 mt-1 truncate hidden sm:block">
                                  {item.productId.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer & Delivery Info */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Customer Information</h4>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{order.customerInfo.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{order.customerInfo.phone}</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{order.customerInfo.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Delivery Information</h4>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">Date: {order.delivery.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">Comment: {order.delivery.comment}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">Payment: {order.paymentMethod}</span>
                          </div>
                        </div>
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
  );
};

export default MyOrders;
