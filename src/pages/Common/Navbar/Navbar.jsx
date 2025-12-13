import React, { useState } from 'react';
import {
  Home, PiggyBank, ReceiptText, BarChart2, Menu, X, User,
  Package, LayoutDashboard, Wallet, TrendingUp, NotebookPen, List, ClipboardList, LogOut
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router';
import { useLanguage } from '../../../contexts/LanguageContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { userInfo, isAuthenticated, logout } = useAuth();
  const { language, setLanguage } = useLanguage(); // ✅ Get from context

  // Toggle between English and Bangla
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  // Localized text for nav items
  const labels = {
    en: {
      dashboard: 'Dashboard',
      products: 'Products',
      suppliers: 'Suppliers',
      customers: 'Customers',
      sales: 'Sales',
      purchases: 'Purchases',
      login: 'Login',
      register: 'Register',
      logout: 'Log Out',
      hello: 'Hello',
      brand: 'Modern Poultry'
    },
    bn: {
      dashboard: 'ড্যাশবোর্ড',
      products: 'পণ্য',
      suppliers: 'সরবরাহকারী',
      customers: 'গ্রাহক',
      sales: 'বিক্রয়',
      purchases: 'ক্রয়',
      login: 'লগইন',
      register: 'রেজিস্টার',
      logout: 'লগ আউট',
      hello: 'হ্যালো',
      brand: 'মডার্ন পোল্ট্রি'
    }
  };

  const t = labels[language];

  const navItems = [
    { name: t.dashboard, icon: LayoutDashboard, href: '/dashboard' },
    // { name: t.products, icon: Package, href: '/products' },
    { name: t.suppliers, icon: List, href: '/suppliers' },
    { name: t.customers, icon: List, href: '/customers' },
    { name: t.sales, icon: List, href: '/sales' },
    { name: t.purchases, icon: List, href: '/purchases' },
    { name: "Trans", icon: List, href: '/transactions' },
    { name: "payment_accounts", icon: List, href: '/payment_accounts' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg font-inter text-white">
      <div className="container mx-auto flex justify-between items-center flex-wrap">
        {/* Logo / Brand */}
        <Link
          to={'/'}
          className="flex items-center text-xl font-bold rounded-md px-3 py-1 cursor-pointer hover:bg-blue-700 transition duration-300 whitespace-nowrap"
        >
          {t.brand}
        </Link>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          {/* ✅ Language toggle on mobile */}
          <button
            onClick={toggleLanguage}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-sm"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          {isAuthenticated && userInfo?.name && (
            <span className="text-sm font-light mr-2">
              {t.hello}, {userInfo.name.split(' ')[0]}!
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white p-2 rounded-md transition duration-300 hover:bg-blue-700"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-2 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105 whitespace-nowrap text-sm lg:text-base"
              >
                <Icon size={18} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* ✅ Language toggle button */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-white px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
              >
                <User size={18} />
                <span className="text-sm font-light hidden lg:inline">
                  {t.hello}, {userInfo?.name?.split(' ')[0] || 'User'}!
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100 mb-1">
                    <span className="font-semibold">{userInfo?.name}</span>
                    <p className="text-xs text-gray-500">{userInfo?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to={'/login'}
                className="flex items-center text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105 text-sm lg:text-base"
              >
                <span className="font-medium">{t.login}</span>
              </Link>
              <Link
                to={'/register'}
                className="flex items-center text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105 text-sm lg:text-base"
              >
                <span className="font-medium">{t.register}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden mt-4 bg-blue-800 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-screen opacity-100 p-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-md shadow-inner mt-4">
                <User size={20} />
                <span className="text-sm font-light">
                  {userInfo?.name ? `${t.hello}, ${userInfo.name}!` : `User`}
                </span>
              </div>
              <button
                onClick={() => { logout(); closeMobileMenu(); }}
                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
              >
                <LogOut size={20} />
                <span className="font-medium">{t.logout}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to={'/login'}
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
              >
                <span className="font-medium">{t.login}</span>
              </Link>
              <Link
                to={'/register'}
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
              >
                <span className="font-medium">{t.register}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
