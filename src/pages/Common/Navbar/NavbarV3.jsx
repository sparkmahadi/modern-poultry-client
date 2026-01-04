import React, { useState } from 'react';
import {
  Menu, X, User, LayoutDashboard, List, LogOut, Package, Users, 
  Boxes, CreditCard, UserCircle, Truck, ShoppingBag, 
  Receipt, Wallet, Layers, FileText, ClipboardList, ChevronDown, Grid, Globe
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link, useLocation } from 'react-router';
import { useLanguage } from '../../../contexts/LanguageContext';

const NavbarV3 = () => {
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      explorer: "More Modules", logout: "Log Out", login: "Login"
    },
    bn: {
      brand: 'মডার্ন পোল্ট্রি',
      dashboard: "ড্যাশবোর্ড", products: "পণ্যসমূহ", inventory: "ইনভেন্টরি",
      categories: "বিভাগসমূহ", suppliers: "সরবরাহকারী", customers: "গ্রাহক",
      sales: "বিক্রয়", purchases: "ক্রয়", transactions: "লেনদেন",
      payment_accounts: "অ্যাকাউন্ট", batches: "ব্যাচ",
      expenses: "খরচ", bills: "বিল", reports: "রিপোর্ট",
      explorer: "অন্যান্য মডিউল", logout: "লগ আউট", login: "লগইন"
    }
  };

  const t = labels[language];

  // CORE LINKS: Always visible on the Navbar (Desktop)
  const coreLinks = [
    { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard" },
    { name: t.sales, icon: ShoppingBag, href: "/sales" },
    { name: t.purchases, icon: Receipt, href: "/purchases" },
    { name: t.inventory, icon: Boxes, href: "/inventory" },
  ];

  // MODULES TRAY: Hidden inside the "Explorer" toggle
  const explorerModules = [
    { name: t.products, icon: Package, href: "/products", color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: t.categories, icon: List, href: "/categories", color: "text-purple-600", bg: "bg-purple-50" },
    { name: t.suppliers, icon: Truck, href: "/suppliers", color: "text-pink-600", bg: "bg-pink-50" },
    { name: t.customers, icon: UserCircle, href: "/customers", color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: t.transactions, icon: CreditCard, href: "/transactions", color: "text-amber-600", bg: "bg-amber-50" },
    { name: t.payment_accounts, icon: Wallet, href: "/payment_accounts", color: "text-green-600", bg: "bg-green-50" },
    { name: t.batches, icon: Layers, href: "/farm-batches", color: "text-teal-600", bg: "bg-teal-50" },
    { name: t.expenses, icon: Receipt, href: "/expense-threads", color: "text-red-600", bg: "bg-red-50" },
    { name: t.bills, icon: FileText, href: "/bills", color: "text-slate-600", bg: "bg-slate-50" },
    { name: t.reports, icon: ClipboardList, href: "/reports", color: "text-blue-800", bg: "bg-blue-50" },
  ];

  return (
    <div className="sticky top-0 z-[100] w-full font-inter">
      {/* --- MAIN NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2 lg:space-x-8">
          <Link to="/" className="text-xl font-black text-blue-700 tracking-tighter mr-2">
            {t.brand}
          </Link>

          {/* Core Desktop Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {coreLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === item.href 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-700'
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}

            <div className="w-[1px] h-6 bg-gray-200 mx-2"></div>

            {/* Explorer Toggle */}
            <button 
              onClick={() => setIsTrayOpen(!isTrayOpen)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${
                isTrayOpen ? 'bg-indigo-700 text-white shadow-lg' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Grid size={18} />
              <span>{t.explorer}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isTrayOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right Section: Lang & User */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <button onClick={toggleLanguage} className="hidden sm:flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg text-gray-500 font-bold text-xs uppercase">
             <Globe size={18} />
             <span>{language}</span>
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-1 pr-3 border border-gray-200 rounded-full hover:shadow-md transition bg-gray-50"
              >
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {userInfo?.name?.charAt(0)}
                </div>
                <span className="text-sm font-bold text-gray-700 hidden md:inline">{userInfo?.name?.split(' ')[0]}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.hello}</p>
                    <p className="text-sm font-black text-gray-800 truncate">{userInfo?.name}</p>
                  </div>
                  <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 font-bold">
                    <LogOut size={16} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">{t.login}</Link>
          )}

          <button className="lg:hidden p-2 text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* --- SECONDARY MODULES TRAY --- */}
      <div className={`absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
        isTrayOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-[1400px] mx-auto p-6 lg:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {explorerModules.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsTrayOpen(false)}
                className="flex items-center p-4 rounded-2xl hover:bg-gray-50 transition-all group border border-gray-100 hover:border-blue-200 hover:shadow-sm"
              >
                <div className={`p-3 rounded-xl transition-all mr-4 ${item.bg} ${item.color} group-hover:scale-110`}>
                  <item.icon size={24} />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-gray-50/50 p-4 border-t border-gray-100 text-center">
            <button onClick={() => setIsTrayOpen(false)} className="text-xs font-black text-gray-400 hover:text-blue-600 transition flex items-center justify-center mx-auto space-x-2 uppercase tracking-widest">
                <X size={14} /> <span>Close Explorer</span>
            </button>
        </div>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white z-[90] p-4 overflow-y-auto lg:hidden animate-in slide-in-from-bottom-2">
          <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Core Features</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {coreLinks.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-2xl">
                <item.icon size={24} className="mb-2" />
                <span className="text-xs font-bold">{item.name}</span>
              </Link>
            ))}
          </div>
          
          <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">All Modules</p>
          <div className="grid grid-cols-2 gap-3 pb-20">
            {explorerModules.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <item.icon size={20} className={item.color} />
                <span className="text-xs font-bold text-gray-700">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Dim overlay for tray */}
      {isTrayOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[-1]" onClick={() => setIsTrayOpen(false)} />
      )}
    </div>
  );
};

export default NavbarV3;