const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', {
      endpoint,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// User API
export const userAPI = {
  // Cart operations
  addToCart: (cartItem) =>
    apiRequest('/user/cart', {
      method: 'POST',
      body: JSON.stringify(cartItem),
    }),
  
  getCart: (userId) =>
    apiRequest(`/user/cart/${userId}`),
  
  removeFromCart: (userId, productId) =>
    apiRequest(`/user/cart/${userId}/${productId}`, {
      method: 'DELETE',
    }),
  
  updateCartQuantity: (userId, productId, quantity) =>
    apiRequest(`/user/cart/${userId}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  
  getCartTotal: (userId) =>
    apiRequest(`/user/cart/total/${userId}`),

  clearCart: (userId) =>
    apiRequest(`/user/cart/clear/${userId}`, {
      method: 'DELETE',
    }),

  // Product operations
  getAllProducts: () =>
    apiRequest('/user/products'),
  
  getProductById: (productId) =>
    apiRequest(`/user/product/${productId}`),
  
  getProductsByCategory: (category) =>
    apiRequest(`/user/products/category/${category}`),
  
  getProductsOnOffer: () =>
    apiRequest('/user/products/on-offer'),

  // Categories and offers
  getAllCategories: () =>
    apiRequest('/user/categories'),
  
  getAllOffers: () =>
    apiRequest('/user/offers'),

  // Profile operations
  getProfile: (userId) =>
    apiRequest(`/user/profile/${userId}`),
  
  updateProfile: (userId, profileData) =>
    apiRequest(`/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Order operations
  placeOrder: (userId, orderData) =>
    apiRequest(`/user/order/${userId}`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getOrders: (userId) =>
    apiRequest(`/user/orders/${userId}`, {
      method: 'GET',
    }),
};

// Admin API
export const adminAPI = {
  // Product management
  createProduct: (productData) =>
    apiRequest('/admin/product', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  
  updateProduct: (productId, productData) =>
    apiRequest(`/admin/product/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  
  deleteProduct: (productId) =>
    apiRequest(`/admin/product/${productId}`, {
      method: 'DELETE',
    }),

  // Category management
  createCategory: (categoryData) =>
    apiRequest('/admin/category', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }),
  
  updateCategory: (categoryId, categoryData) =>
    apiRequest(`/admin/category/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    }),
  
  deleteCategory: (categoryId) =>
    apiRequest(`/admin/category/${categoryId}`, {
      method: 'DELETE',
    }),

  // Offer management
  createOffer: (offerData) =>
    apiRequest('/admin/offer', {
      method: 'POST',
      body: JSON.stringify(offerData),
    }),
  
  updateOffer: (offerId, offerData) =>
    apiRequest(`/admin/offer/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(offerData),
    }),
  
  deleteOffer: (offerId) =>
    apiRequest(`/admin/offer/${offerId}`, {
      method: 'DELETE',
    }),
};

// Upload API
export const uploadAPI = {
  uploadFile: (formData) =>
    fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    }).then(res => res.json()),
};
