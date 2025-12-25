import React, { useState } from 'react';
import {
  Menu, X, User, LayoutDashboard, List, LogOut, 
  Package, Users, ShoppingCart, Boxes, CreditCard, UserCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router';
import { useLanguage } from '../../../contexts/LanguageContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { userInfo, isAuthenticated, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const labels = {
    en: {
      dashboard: 'Dashboard',
      products: 'Products',
      suppliers: 'Suppliers',
      customers: 'Customers',
      sales: 'Sales',
      purchases: 'Purchases',
      inventory: 'Inventory',
      expenses: 'Expenses',
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
      inventory: 'ইনভেন্টরি',
      expenses: 'খরচ',
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
    { name: t.purchases, icon: ShoppingCart, href: '/purchases' },
    { name: t.sales, icon: List, href: '/sales' },
    { name: t.suppliers, icon: Users, href: '/suppliers' },
    { name: t.customers, icon: UserCircle, href: '/customers' },
    { name: t.inventory, icon: Boxes, href: '/inventory' },
    { name: t.expenses, icon: CreditCard, href: '/expense-threads' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg font-inter text-white sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo / Brand */}
        <Link
          to={'/'}
          className="flex items-center text-xl font-bold rounded-md px-3 py-1 cursor-pointer hover:bg-white/10 transition duration-300 whitespace-nowrap"
        >
          {t.brand}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-2 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition duration-300 whitespace-nowrap text-sm lg:text-base"
              >
                <Icon size={18} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition border border-white/30"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-white px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 transition duration-300 shadow-inner"
                aria-expanded={isUserMenuOpen}
              >
                <User size={18} />
                <span className="text-sm font-light hidden lg:inline">
                  {t.hello}, {userInfo?.name?.split(' ')[0] || 'User'}!
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 z-50 border border-gray-200">
                  <div className="block px-4 py-2 text-sm text-gray-800 border-b border-gray-100">
                    <p className="font-semibold truncate">{userInfo?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userInfo?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                  >
                    <LogOut size={16} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to='/login' className="px-4 py-2 text-sm font-medium hover:text-blue-200 transition">{t.login}</Link>
              <Link to='/register' className="px-4 py-2 text-sm font-medium bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition">{t.register}</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={toggleLanguage}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs border border-white/30"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-1"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col space-y-1 bg-blue-800/50 rounded-xl p-2 backdrop-blur-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition"
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          <hr className="border-blue-700 my-2" />

          {isAuthenticated ? (
            <>
              <div className="px-4 py-3">
                <p className="text-xs text-blue-200 uppercase tracking-wider">{t.hello}</p>
                <p className="font-semibold">{userInfo?.name}</p>
              </div>
              <button
                onClick={() => { logout(); closeMobileMenu(); }}
                className="flex items-center space-x-3 text-red-300 px-4 py-3 rounded-lg hover:bg-red-900/30 transition"
              >
                <LogOut size={20} />
                <span className="font-medium">{t.logout}</span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              <Link to='/login' onClick={closeMobileMenu} className="text-center py-2 rounded-lg bg-blue-700">{t.login}</Link>
              <Link to='/register' onClick={closeMobileMenu} className="text-center py-2 rounded-lg bg-white text-blue-700 font-bold">{t.register}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;