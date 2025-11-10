import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { ShoppingCart, User, Package, LogOut } from 'lucide-react';
import logo from "../assets/logo.jpg";

const Nav = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load cart count
  useEffect(() => {
    if (isAuthenticated() && user) {
      loadCartCount();
    }
  }, [isAuthenticated, user]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isAuthenticated() && user) loadCartCount();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isAuthenticated, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCartCount = async () => {
    try {
      const response = await userAPI.getCart(user._id);
      const cartItems = response.cart?.items || [];
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(totalItems);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartCount(0);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const handleLogin = () => navigate('/auth');
  const handleCart = () => navigate(isAuthenticated() ? '/cart' : '/auth');
  const handleProfile = () => { setIsDropdownOpen(false); navigate('/profile'); };
  const handleMyOrders = () => { setIsDropdownOpen(false); navigate('/my-orders'); };
  const handleLogout = () => { setIsDropdownOpen(false); logout(); };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-50 shadow-sm z-50 h-16 sm:h-18 md:h-20 flex items-center">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">

          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 cursor-pointer" onClick={() => navigate('/')}>
             <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-cyan-500 rounded-xl flex items-center justify-center overflow-hidden">
        <img
          src={logo}
          alt="Desoft Logo"
          className="w-full h-full object-cover rounded-xl"
        />
        </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-600">Desoft</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Premium baby care products</p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-base font-semibold text-cyan-600">DeSoft</h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {isAuthenticated() ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={toggleDropdown} className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">{user.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.name || 'Account'}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={handleProfile} className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 text-left text-gray-700 hover:bg-gray-50">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Profile</span>
                    </button>
                    <button onClick={handleMyOrders} className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 text-left text-gray-700 hover:bg-gray-50">
                      <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">My Orders</span>
                    </button>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 text-left text-red-600 hover:bg-red-50">
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleLogin} className="text-cyan-500 hover:text-cyan-600 font-medium text-xs sm:text-sm border border-cyan-400 px-2 sm:px-3 md:px-4 py-1 rounded-lg transition-colors">
                Login
              </button>
            )}

            <button onClick={handleCart} className="relative flex items-center justify-center w-12 sm:w-14 md:w-16 h-7 sm:h-8 border border-cyan-400 rounded-lg hover:bg-cyan-50 transition-colors">
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500 hover:text-gray-800" />
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
