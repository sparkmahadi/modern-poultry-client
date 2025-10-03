import React from 'react';
import { Copyright } from 'lucide-react'; // Using Lucide icon for copyright

// Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8 px-4 font-inter">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-4 md:space-y-0">
        {/* Copyright and App Name */}
        <div className="flex items-center space-x-2">
          <Copyright size={18} className="text-gray-400" />
          <p className="text-sm md:text-base text-gray-300">
            {currentYear} Family Budget. All rights reserved.
          </p>
        </div>

        {/* App Description */}
        <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto md:mx-0">
          Empowering middle-class families to manage their finances effectively.
        </p>

        {/* Navigation/Legal Links */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
          <a
            href="#privacy-policy"
            className="text-gray-300 hover:text-blue-400 transition-colors duration-300"
          >
            Privacy Policy
          </a>
          <a
            href="#terms-of-service"
            className="text-gray-300 hover:text-blue-400 transition-colors duration-300"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
