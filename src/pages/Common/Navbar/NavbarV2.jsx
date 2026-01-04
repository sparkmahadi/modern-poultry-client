import React, { useState, useEffect } from 'react';
import {
  Menu, X, User, LayoutDashboard, List, LogOut, Package, Users, 
  ShoppingCart, Boxes, CreditCard, UserCircle, Truck, ShoppingBag, 
  Receipt, Wallet, Layers, FileText, ClipboardList, ChevronDown, Globe
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link, useLocation } from 'react-router';
import { useLanguage } from '../../../contexts/LanguageContext';

const NavbarV2 = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  
  const { userInfo, isAuthenticated, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();

  const toggleLanguage = () => setLanguage(language === 'en' ? 'bn' : 'en');

  const labels = {
    en: {
      brand: 'Modern Poultry',
      dashboard: "Dashboard", products: "Products", inventory: "Inventory",
      categories: "Categories", suppliers: "Suppliers", customers: "Customers",
      sales: "Sales", purchases: "Purchases", transactions: "Transactions",
      payment_accounts: "Accounts", batches: "Batches",
      expenses: "Expenses", bills: "Bills", reports: "Reports",
      modules: "Modules", hello: "Hello", logout: "Log Out",
      login: "Login", register: "Register"
    },
    bn: {
      brand: 'মডার্ন পোল্ট্রি',
      dashboard: "ড্যাশবোর্ড", products: "পণ্যসমূহ", inventory: "ইনভেন্টরি",
      categories: "বিভাগসমূহ", suppliers: "সরবরাহকারী", customers: "গ্রাহক",
      sales: "বিক্রয়", purchases: "ক্রয়", transactions: "লেনদেন",
      payment_accounts: "অ্যাকাউন্ট", batches: "ব্যাচ",
      expenses: "খরচ", bills: "বিল", reports: "রিপোর্ট",
      modules: "মডিউল", hello: "হ্যালো", logout: "লগ আউট",
      login: "লগইন", register: "রেজিস্টার"
    }
  };

  const t = labels[language];

  // Primary links visible on desktop
  const primaryNav = [
    { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard" },
    { name: t.sales, icon: ShoppingBag, href: "/sales" },
    { name: t.purchases, icon: Receipt, href: "/purchases" },
    { name: t.inventory, icon: Boxes, href: "/inventory" },
  ];

  // All other links tucked into the "Modules" dropdown
  const allModules = [
    { name: t.products, icon: Package, href: "/products" },
    { name: t.categories, icon: List, href: "/categories" },
    { name: t.suppliers, icon: Truck, href: "/suppliers" },
    { name: t.customers, icon: UserCircle, href: "/customers" },
    { name: t.transactions, icon: CreditCard, href: "/transactions" },
    { name: t.payment_accounts, icon: Wallet, href: "/payment_accounts" },
    { name: t.batches, icon: Layers, href: "/farm-batches" },
    { name: t.expenses, icon: Receipt, href: "/expense-threads" },
    { name: t.bills, icon: FileText, href: "/bills" },
    { name: t.reports, icon: ClipboardList, href: "/reports" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-xl sticky top-0 z-[100] font-inter">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Left: Brand & Desktop Nav */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition">
              {t.brand}
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.href ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Modules Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsModulesOpen(!isModulesOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition"
                >
                  <Layers size={18} />
                  <span>{t.modules}</span>
                  <ChevronDown size={14} className={`transition-transform ${isModulesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModulesOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsModulesOpen(false)}></div>
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-20 border border-gray-100 text-gray-800 grid grid-cols-1">
                      {allModules.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsModulesOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition"
                        >
                          <item.icon size={18} className="text-blue-600" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Lang, User & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-xs font-bold transition"
            >
              <Globe size={14} />
              <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-blue-900/50 hover:bg-blue-900 p-1.5 pr-3 rounded-full border border-white/10 transition"
                >
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-medium hidden md:inline">
                    {userInfo?.name?.split(' ')[0]}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-20 border border-gray-100 text-gray-800">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-bold truncate">{userInfo?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{userInfo?.email}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition"
                      >
                        <LogOut size={18} />
                        <span className="font-semibold">{t.logout}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-blue-200 transition">{t.login}</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-bold bg-white text-blue-700 rounded-lg shadow-md hover:bg-blue-50 transition">{t.register}</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 z-[90] transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="absolute inset-0 bg-blue-900/95 backdrop-blur-md pt-20 px-4 overflow-y-auto pb-10">
          <div className="flex flex-col space-y-1">
            {[...primaryNav, ...allModules].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/10 transition"
              >
                <item.icon size={24} className="text-blue-300" />
                <span className="text-lg font-medium">{item.name}</span>
              </Link>
            ))}
            <div className="h-px bg-white/10 my-4" />
            <button onClick={toggleLanguage} className="flex items-center space-x-4 p-4 text-blue-200">
              <Globe size={24} />
              <span className="text-lg">Change Language to {language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
            {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                     <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center p-4 bg-white/10 rounded-xl font-bold">{t.login}</Link>
                     <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center p-4 bg-white rounded-xl text-blue-900 font-bold">{t.register}</Link>
                </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarV2;