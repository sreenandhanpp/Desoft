import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, MapPin, Phone, User, Calendar, Clock, AlertTriangle } from 'lucide-react';
import cashIcon from "../assets/icons/payment_7017698.png";
import cardIcon from "../assets/icons/credit-card_1077869.png";
import ordericon from "../assets/icons/package.png";
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "cash",
    deliveryDate: "",
    comment: "",
  });

  useEffect(() => {
    if (isAuthenticated()) {
      loadCart();
      loadCartTotal();
      loadUserProfile();
    }
  }, [isAuthenticated]);

  // Calculate total whenever cart items change
  useEffect(() => {
    calculateTotalFromItems();
  }, [cartItems]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const response = await userAPI.getProfile(user._id);
      setUserProfile(response.user);

      // Pre-populate checkout form with profile data
      setCheckoutForm((prev) => ({
        ...prev,
        name: response.user.name || "",
        phone: response.user.phoneNumber || "",
        address: response.user.address || "",
      }));
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserProfile(null);
    }
  };

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await userAPI.getCart(user._id);
      setCartItems(response.cart?.items || []);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartTotal = async () => {
    if (!user) return;

    try {
      const response = await userAPI.getCartTotal(user._id);
      setCartTotal(response.total || 0);
    } catch (error) {
      console.error("Error loading cart total:", error);
      // Calculate total from cart items if API fails
      calculateTotalFromItems();
    }
  };

  const calculateTotalFromItems = () => {
    const total = cartItems.reduce((sum, item) => {
      const price = item.productId?.price || 0;
      return sum + price * item.quantity;
    }, 0);
    setCartTotal(total);
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    // Update local state immediately for instant UI response
    const updatedItems = cartItems.map((item) =>
      item.productId._id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCartItems(updatedItems);

    try {
      await userAPI.updateCartQuantity(user._id, productId, newQuantity);
      // Reload to sync with backend
      await loadCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Revert on error
      await loadCart();
    }
  };

  const removeFromCart = async (productId) => {
    // Update local state immediately for instant UI response
    const updatedItems = cartItems.filter(
      (item) => item.productId._id !== productId
    );
    setCartItems(updatedItems);

    try {
      await userAPI.removeFromCart(user._id, productId);
      // Reload to sync with backend
      await loadCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
      // Revert on error
      await loadCart();
    }
  };

  const handleFormChange = (field, value) => {
    setCheckoutForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isProfileComplete = () => {
    if (!userProfile) return false;
    return userProfile.name && userProfile.phoneNumber && userProfile.address;
  };

  const handlePlaceOrder = async () => {
    if (!user) return;

    try {
      // Prepare order data
      const orderData = {
        customerInfo: {
          name: checkoutForm.name,
          phone: checkoutForm.phone,
          address: checkoutForm.address,
          comment: checkoutForm.comment,
        },
        delivery: {
          date: checkoutForm.deliveryDate,
        },
        paymentMethod: checkoutForm.paymentMethod,
        cartItems: cartItems,
        totalAmount: cartTotal,
      };

      // Place order (cart clearing is handled in the backend)
      const response = await userAPI.placeOrder(user._id, orderData);

      // Success - clear cart state immediately
      setCartItems([]);
      setCartTotal(0);

      // Reset form
      setCheckoutForm({
        name: "",
        phone: "",
        address: "",
        paymentMethod: "cash",
        deliveryDate: "",
        comment: "",
      });

      showSuccess(
        `Order placed successfully! Order ID: ${response.order.orderId}`
      );

      // Trigger cart update event for navbar
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error placing order:", error);
      console.error("Full error details:", error);
      showError(
        `Failed to place order: ${
          error.message || "Unknown error"
        }. Please try again.`
      );
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Please Login
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your cart
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#edf8f9" }}>
      {/* Navbar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Store</span>
              <span className="sm:hidden">Back</span>
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-teal-600">
              Shopping Cart
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12 text-center max-w-sm sm:max-w-md mx-4">
              <ShoppingCart className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                Your cart is empty
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                Add some products to get started!
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-teal-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-teal-600 font-medium text-sm sm:text-base transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 mx-auto sm:mx-0">
                      {item.productId?.image ? (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}${item.productId.image}`}
                          alt={item.productId.name}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <span className="text-gray-400 text-xl sm:text-2xl">
                            📦
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2">
                        {item.productId?.name || "Product"}
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm mb-2">
                        Size: {item.productId?.size || "NB"} •{" "}
                        {item.productId?.count || "75pcs"}
                      </p>
                      <p className="text-teal-600 font-bold text-sm sm:text-base">
                        {item.productId?.price || 0} QR each
                      </p>
                    </div>

                    {/* Quantity Controls - Mobile Layout */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId._id,
                              item.quantity - 1
                            )
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>

                        <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId._id,
                              item.quantity + 1
                            )
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId._id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 text-center sm:text-right">
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      Subtotal: {(item.productId?.price || 0) * item.quantity}{" "}
                      QR
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary & Checkout */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-fit sticky top-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                Order Summary
              </h2>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">
                    Items ({cartItems.length})
                  </span>
                  <span className="font-semibold">
                    {cartTotal.toFixed(0)} QR
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <hr className="my-3 sm:my-4" />
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Total</span>
                  <span className="text-teal-600">
                    {cartTotal.toFixed(0)} QR
                  </span>
                </div>
              </div>

              {/* Profile Status */}
              {!isProfileComplete() && (
                <div className="mb-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">
                        Profile is not completed!
                      </span>
                    </div>
                    <p className="text-sm text-amber-600 mb-3">
                      Please complete your profile for faster checkout.
                    </p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                    >
                      Complete Profile
                    </Link>
                  </div>
                </div>
              )}

              {/* Checkout Form */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    <User className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={checkoutForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Your phone number"
                    value={checkoutForm.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Delivery Address *
                  </label>
                  <textarea
                    placeholder="Enter your delivery address"
                    value={checkoutForm.address}
                    onChange={(e) =>
                      handleFormChange("address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {/* You can add an icon here if you want */}
                    Additional Comments (optional)
                  </label>
                  <textarea
                    placeholder="Add any specific requests, delivery instructions, or comments (optional)"
                    value={checkoutForm.comment}
                    onChange={(e) =>
                      handleFormChange("comment", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"
                  />
                </div>

                    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
        <CreditCard className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        Payment Method *
      </label>

      <div className="space-y-2">
        {/* Cash on Delivery */}
        <label className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked={checkoutForm.paymentMethod === "cash"}
            onChange={(e) => handleFormChange("paymentMethod", e.target.value)}
            className="mr-2 text-teal-600"
          />
          <img
            src={cashIcon}
            alt="Cash on Delivery"
            className="w-5 h-5 sm:w-6 sm:h-6 mr-2 object-contain"
          />
          <span className="text-xs sm:text-sm">Cash on Delivery</span>
        </label>

        {/* Card on Delivery */}
        <label className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value="card"
            checked={checkoutForm.paymentMethod === "card"}
            onChange={(e) => handleFormChange("paymentMethod", e.target.value)}
            className="mr-2 text-teal-600"
          />
          <img
            src={cardIcon}
            alt="Card on Delivery"
            className="w-5 h-5 sm:w-6 sm:h-6 mr-2 object-contain"
          />
          <span className="text-xs sm:text-sm">Card on Delivery</span>
        </label>
      </div>
    </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Delivery Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={checkoutForm.deliveryDate}
                        onChange={(e) =>
                          handleFormChange("deliveryDate", e.target.value)
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Delivery Time *
                      </label>
                      <div className="relative">
                        <select
                          value={checkoutForm.deliveryTime}
                          onChange={(e) => handleFormChange('deliveryTime', e.target.value)}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white hover:border-gray-400 transition-all duration-200 appearance-none cursor-pointer shadow-sm"
                        >
                          <option value="" disabled className="text-gray-500">Select time slot</option>
                          <option value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</option>
                          <option value="11:00 AM - 1:00 PM">11:00 AM - 1:00 PM</option>
                          <option value="1:00 PM - 3:00 PM">1:00 PM - 3:00 PM</option>
                          <option value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</option>
                          <option value="5:00 PM - 7:00 PM">5:00 PM - 7:00 PM</option>
                          <option value="7:00 PM - 9:00 PM">7:00 PM - 9:00 PM</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div> */}
                </div>
              </div>

            {/* Minimum Order Alert */}
{cartTotal < 45 && (
  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
    <AlertTriangle className="w-5 h-5" />
    <span className="text-sm font-medium">Minimum order QR 45</span>
  </div>
)}

{/* Place Order Button */}
<button
  onClick={handlePlaceOrder}
  disabled={
    !checkoutForm.address ||
    !checkoutForm.deliveryDate ||
    cartTotal < 45
  }
  className={`w-full flex items-center justify-center py-3 sm:py-4 rounded-lg font-semibold mt-4 sm:mt-6 transition-all duration-200 text-sm sm:text-base gap-2 shadow-lg ${
    cartTotal >= 45 && checkoutForm.address && checkoutForm.deliveryDate
      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 hover:shadow-xl'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  <img
    src={ordericon}
    alt="order icon"
    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
  />
  <span>
    {cartTotal < 45
      ? 'Add more items to reach QR 45'
      : `Place Order - ${cartTotal.toFixed(0)} QR`}
  </span>
</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
