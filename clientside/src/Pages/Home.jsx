import React, { useState, useEffect } from "react";
import Nav from "../components/Nav";
import {ChevronLeft, ChevronRight } from "lucide-react";
import diaperIcon from "../assets/icons/baby_5613334.png";
import wipesIcon from "../assets/icons/tissues_1660452.png";
import care from "../assets/icons/baby-products_5613032.png";
import offer from "../assets/icons/price-tag_8541032.png";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const categories = [
  { name: "Special Offers", products: 2, color: "pink", icon: offer },
  { name: "Diapers", products: 4, color: "blue", icon: diaperIcon },
  { name: "Baby Wipes", products: 0, color: "green", icon: wipesIcon },
  // { name: "Baby Formula", products: 0, color: "purple", icon: "🥛" },
  // { name: "Baby Clothing", products: 1, color: "orange", icon: "👕" },
  // { name: "Baby Toys", products: 1, color: "yellow", icon: "🧸" },
  { name: "Baby Care", products: 1, color: "violet", icon: care },
  // { name: "Feeding", products: 0, color: "pink", icon: "🍼" },
  // { name: "Others", products: 0, color: "gray", icon: "📦" },
];

// Default banner data as fallback
const defaultBanners = [
  {
    id: 1,
    title: "PREMIUM BABY CARE",
    subtitle: "COMFORT & QUALITY FOR YOUR LITTLE ONE",
    buttonText: "SHOP NOW",
    image: "/api/placeholder/1200/400",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }
];

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("Special Offers");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerImages, setBannerImages] = useState(defaultBanners);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categoriesWithCounts, setCategoriesWithCounts] = useState(categories);
  const [addingToCart, setAddingToCart] = useState({});

  // API Base URL
  const API_BASE = 'http://localhost:5000/api';
  
  // Auth and navigation
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    fetchProductsByCategory(categoryName);
  };

  // Fetch all products from backend
  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/products`);
      const data = await response.json();
      
      if (response.ok && data.products) {
        setAllProducts(data.products);
        updateCategoryCounts(data.products);
        // Set initial products for Special Offers (products on offer)
        const offerProducts = data.products.filter(product => product.onOffer);
        setProducts(offerProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryName) => {
    try {
      if (categoryName === "Special Offers") {
        // For special offers, get products on offer
        const response = await fetch(`${API_BASE}/admin/products/offers`);
        const data = await response.json();
        
        if (response.ok && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } else {
        // For other categories, get products by category
        const response = await fetch(`${API_BASE}/admin/products/category/${encodeURIComponent(categoryName)}`);
        const data = await response.json();
        
        if (response.ok && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setProducts([]);
    }
  };

  // Update category counts based on actual products
  const updateCategoryCounts = (allProducts) => {
    const updatedCategories = categories.map(category => {
      if (category.name === "Special Offers") {
        const offerCount = allProducts.filter(product => product.onOffer).length;
        return { ...category, products: offerCount };
      } else {
        const categoryCount = allProducts.filter(product => product.category === category.name).length;
        return { ...category, products: categoryCount };
      }
    });
    setCategoriesWithCounts(updatedCategories);
  };

  // Toast notification function
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${type === 'success' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    // Initial state - slide up from bottom
    toast.style.transform = 'translate(-50%, 100%)';
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translate(-50%, 0)';
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translate(-50%, 100%)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  // Add to cart functionality
  const handleAddToCart = async (product) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    // Set loading state for this specific product
    setAddingToCart(prev => ({ ...prev, [product._id]: true }));

    try {
      const cartItem = {
        userId: user._id,
        productId: product._id,
        quantity: 1,
        price: product.price
      };

      await userAPI.addToCart(cartItem);
      
      // Show success toast notification
      showToast('Added to cart success');
      
      // Trigger cart count refresh in Nav component by dispatching a custom event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Show error toast notification
      showToast('Failed to add to cart', 'error');
    } finally {
      // Remove loading state
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  // Fetch offers from backend
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/offers`);
      const data = await response.json();
      
      if (response.ok && data.offers && data.offers.length > 0) {
        // Transform all active offers to banner format (carousel through all)
        const transformedBanners = data.offers
          .filter(offer => offer.isActive) // Only show active offers
          .map((offer, index) => ({
            id: offer._id,
            image: `${API_BASE.replace('/api', '')}${offer.image}`
          }));
        
        setBannerImages(transformedBanners.length > 0 ? transformedBanners : defaultBanners);
      } else {
        // Use default banners if no offers
        setBannerImages(defaultBanners);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setBannerImages(defaultBanners);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchOffers();
    fetchAllProducts();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (bannerImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [bannerImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const getCurrentProducts = () => {
    return products;
  };

  const getSectionDescription = () => {
    switch (selectedCategory) {
      case "Special Offers":
        return "Don't miss out on these amazing deals and special offers on premium baby products.";
      case "Diapers":
        return "Browse our collection of diapers for your little ones.";
      case "Baby Wipes":
          return "Browse our collection of Baby Wipes for your little ones.";
      // case "Baby Formula":
      //     return "Browse our collection of Baby Formula for your little ones.";
      // case "Baby Clothing":
      //     return "Browse our collection of Baby Clothing for your little ones.";
      // case "Baby Toys":
      //     return "Browse our collection of Baby Toys for your little ones.";
      case "Baby Care":
          return "Browse our collection of Baby Care for your little ones.";
      // case "Feeding":
      //     return "Browse our collection of Feeding for your little ones.";
      // case "Other":
      //     return "Browse our collection of Other for your little ones.";
      default:
        return "Browse our collection of diapers for your little ones.";
    }
  };

  return (
    <>
      <Nav />
      
      {/* Hero Carousel Banner */}
      <section 
  className="relative w-full 
    h-52 sm:h-64 md:h-80 lg:h-96 
    overflow-hidden mt-20" 
  style={{backgroundColor: '#edf8f9'}}
>
  <div className="relative w-full h-full">
    <div 
      className="flex transition-transform duration-500 ease-in-out h-full" 
      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
    >
      {bannerImages.map((banner, index) => (
        <div 
          key={banner.id} 
          className="w-full h-full flex-shrink-0"
        >
          <img 
            src={banner.image} 
            alt="Offer" 
            className="w-full h-full object-cover" 
            style={{minWidth: 0, minHeight: 0}} // Ensures full flexibility
          />
        </div>
      ))}
    </div>
          
          {/* Navigation Controls */}
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200" 
            onClick={prevSlide}
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200" 
            onClick={nextSlide}
          >
            <ChevronRight size={24} className="text-gray-700" />
          </button>
          
          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4" style={{backgroundColor: '#edf8f9'}}>
        {/* Heading */}
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Premium Baby Diapers</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our collection of ultra-soft, super-absorbent diapers
            designed to keep your baby comfortable and dry all day long.
          </p>
        </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="group bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 text-center shadow-md border border-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <img src="/reviews/non-toxic.jpeg" alt="Non-toxic materials" className="w-12 h-12 object-cover rounded-full" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">Non-toxic raw materials</h3>
          <p className="text-sm text-gray-600 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block">Certified by SGS</p>
        </div>

        <div className="group bg-gradient-to-br from-white to-pink-50 rounded-2xl p-8 text-center shadow-md border border-pink-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="relative w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <img src="/reviews/fragrance-free.jpeg" alt="Fragrance free" className="w-12 h-12 object-cover rounded-full" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">Perfumes & lotion free</h3>
          <p className="text-sm text-gray-600 font-medium bg-pink-50 px-3 py-1 rounded-full inline-block">Gentle formula</p>
        </div>

        <div className="group bg-gradient-to-br from-white to-green-50 rounded-2xl p-8 text-center shadow-md border border-green-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <img src="/reviews/paraben-free.jpeg" alt="Paraben free" className="w-12 h-12 object-cover rounded-full" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">Free from harmful chemicals</h3>
          <p className="text-sm text-gray-600 font-medium bg-green-50 px-3 py-1 rounded-full inline-block">No chlorine, latex, parabens</p>
        </div>

        <div className="group bg-gradient-to-br from-white to-orange-50 rounded-2xl p-8 text-center shadow-md border border-orange-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <img src="/reviews/certified.jpeg" alt="Dermatologist certified" className="w-12 h-12 object-cover rounded-full" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">Dermatologist certified</h3>
          <p className="text-sm text-gray-600 font-medium bg-orange-50 px-3 py-1 rounded-full inline-block">Clinically tested</p>
        </div>
      </div>
    </section>

   {/* Categories Section */}
<section className="py-16 px-4" style={{ backgroundColor: '#edf8f9' }}>
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
      Shop by Category
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {categoriesWithCounts.map((cat, i) => (
        <div
          key={i}
          onClick={() => handleCategoryClick(cat.name)}
          className={`bg-white rounded-xl p-6 text-center cursor-pointer transition-all duration-300 shadow-lg border-2 hover:shadow-xl ${
            selectedCategory === cat.name
              ? 'border-blue-500 shadow-xl transform scale-105'
              : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          {/* Replace emoji with PNG image */}
          <div className="flex justify-center mb-3">
            <img
              src={cat.icon}          // <-- imported PNG or dynamic path
              alt={cat.name}
              className="w-12 h-12 object-contain"
            />
          </div>

          <h3 className="font-semibold text-gray-800 mb-2">{cat.name}</h3>
          <p className="text-sm text-gray-500">{cat.products} products</p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Dynamic Products Section */}
      <section className="py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16" style={{backgroundColor: '#edf8f9'}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{selectedCategory}</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">{getSectionDescription()}</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 md:gap-4 py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {getCurrentProducts().length > 0 ? (
              getCurrentProducts().map((product) => (
                <div key={product._id} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="relative">
                    <img 
                      src={product.image ? `http://localhost:5000${product.image}` : "/api/placeholder/120/150"} 
                      alt={product.name} 
                      className="w-full h-32 sm:h-36 object-cover" 
                    />
                    {product.onOffer && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                        OFFER
                      </span>
                    )}
                    {product.outOfStock && (
                      <span className="absolute top-1 right-1 bg-gray-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                        OUT
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm leading-tight line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{product.size || 'Standard'}</p>
                    <p className="text-xs text-green-600 mb-2">Stock: {product.stock || 0}</p>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold text-gray-800">{product.price} QR</span>
                        {product.originalPrice && product.onOffer && (
                          <span className="text-xs text-gray-400 line-through">{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <button 
                      className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold transition-colors duration-200 flex items-center justify-center space-x-1 ${
                        product.outOfStock 
                          ? 'bg-gray-400 cursor-not-allowed text-white' 
                          : addingToCart[product._id]
                          ? 'bg-teal-500 cursor-wait text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                      disabled={product.outOfStock || addingToCart[product._id]}
                      onClick={() => handleAddToCart(product)}
                    >
                      <span>+</span>
                      <span>
                        {product.outOfStock 
                          ? 'Out of Stock' 
                          : addingToCart[product._id] 
                          ? 'Adding...' 
                          : 'Add'
                        }
                      </span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-base">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer/>
    </>
  );
};

export default Home;
