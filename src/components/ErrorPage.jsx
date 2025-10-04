import React, { useState } from 'react';
import { TriangleAlert, Home, LifeBuoy, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router';

// Define a simple custom message box component (reused from previous components)
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const borderColor = type === 'error' ? 'border-red-700' : 'border-green-700';

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white font-medium flex items-center justify-between z-50 ${bgColor} border-2 ${borderColor}`}>
      <span className="flex items-center">
        <Info size={20} className="mr-2" />
        {message}
      </span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

// Main Error Page Component
const ErrorPage = () => {
    const navigate = useNavigate();
  // Hardcoded error details for demonstration
  const errorCode = "404";
  const errorMessage = "Page Not Found";
  const errorDescription = "The page you're looking for doesn't exist or has been moved. Please check the URL or try navigating from the homepage.";

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const showMessage = (msg, type = 'info', duration = 3000) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), duration);
  };

  // Function to simulate navigation back to homepage
  const handleGoHome = () => {
   navigate("/")
    console.log("Navigating back to homepage...");
    showMessage("Redirecting to homepage...", "info");
    // window.location.href = '/'; // Uncomment this line in a real browser environment to redirect
  };

  // Function to simulate contacting support
  const handleContactSupport = () => {
    // In a real application, this might open a support form or email client
    console.log("Opening support contact options...");
    showMessage("Please email support@familybudget.com for assistance.", "info");
    // window.location.href = 'mailto:support@familybudget.com'; // Uncomment this line to open email client
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4 font-inter">
      <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 text-center w-full max-w-lg transform transition-all duration-300 hover:scale-[1.01]">
        <TriangleAlert size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Oops! Something Went Wrong.
        </h1>

        {errorCode && (
          <p className="text-lg font-bold text-gray-700 mb-2">
            Error Code: <span className="text-red-600">{errorCode}</span>
          </p>
        )}

        <h2 className="text-2xl md:text-3xl font-semibold text-red-600 mb-4">
          {errorMessage}
        </h2>

        <p className="text-base md:text-lg text-gray-700 mb-8 leading-relaxed">
          {errorDescription}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleGoHome}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <Home size={20} className="mr-2" />
            Go to Homepage
          </button>
          <button
            onClick={handleContactSupport}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <LifeBuoy size={20} className="mr-2" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
