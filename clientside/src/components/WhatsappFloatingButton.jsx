import React from "react";
import WhatsAppIcon from "../assets/icons/whatsapp.png"; // update path if needed

const WhatsAppFloatingButton = () => {
  return (
    <a
      href="https://wa.me/918547865694" // ✅ Update with your WhatsApp number
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Chat on WhatsApp"
    >
      <img
        src={WhatsAppIcon}
        alt="WhatsApp"
        className="w-14 h-14 sm:w-16 sm:h-16 object-contain 
                   drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]
                   transition-transform duration-300 group-hover:scale-110"
      />
    </a>
  );
};

export default WhatsAppFloatingButton;
