import React from 'react';
import { MapPin, Phone, Mail, Clock, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gradient-to-r from-slate-800 via-teal-900 to-slate-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-cyan-500 text-white px-2 py-1 rounded-lg mr-3">
                <span className="text-xl font-bold">D</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Desoft</h3>
                <p className="text-sm text-gray-300">Premium baby care</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner in providing premium quality diapers and baby care products for your little ones.
            </p>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-cyan-400">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start text-gray-300">
                <MapPin className="h-4 w-4 mr-3 mt-0.5 text-cyan-400" />
                <span className="text-sm">123 Baby Street, Care City, Qatar</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="h-4 w-4 mr-3 text-cyan-400" />
                <span className="text-sm">+974 1234 5678</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-3 text-cyan-400" />
                <span className="text-sm">info@desoft.qa</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-cyan-400">Business Hours</h4>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex items-start">
                <Clock className="h-4 w-4 mr-3 mt-0.5 text-cyan-400" />
                <div>
                  <div>Mon - Fri: 8:00 AM - 10:00 PM</div>
                  <div className="mt-1">Sat - Sun: 9:00 AM - 11:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-cyan-400">Quick Links</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-300 hover:text-cyan-400 text-sm transition-colors">About Us</a>
              <a href="#" className="block text-gray-300 hover:text-cyan-400 text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="block text-gray-300 hover:text-cyan-400 text-sm transition-colors">Terms of Service</a>
              <a href="#" className="block text-gray-300 hover:text-cyan-400 text-sm transition-colors">Return Policy</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            2024 Desoft. All rights reserved.
             <button 
              onClick={() => navigate('/admin-auth')}
              className="text-cyan-400 hover:text-cyan-300 ml-1 transition-colors cursor-pointer"
            >
              Admin
            </button>
          </p>
          <div className="flex items-center text-gray-400 text-sm mt-4 md:mt-0">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-red-500" />
            <span>in Qatar</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;