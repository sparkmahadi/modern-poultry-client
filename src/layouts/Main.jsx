import React, { useState } from 'react';
import { Link, Outlet, useLocation } from "react-router";
import {
    LayoutDashboard, Package, List, ClipboardList, Menu, X,
    User, Truck, ShoppingBag, Receipt, Users, Boxes,
    Wallet, Layers, FileText, CreditCard, ChevronLeft, ChevronRight
} from "lucide-react";
import Navbar from './../pages/Common/Navbar/Navbar';
import Footer from './../pages/Common/Footer/Footer';
import { useLanguage } from '../contexts/LanguageContext';

const translations = {
    en: {
        dashboard: "Dashboard", products: "Products", inventory: "Inventory",
        categories: "Categories", suppliers: "Suppliers", customers: "Customers",
        sales: "Sales", purchases: "Purchases", transactions: "Transactions",
        payment_accounts: "Payment Accounts", batches: "Farm Batches",
        expenses: "Expenses", bills: "Bills", reports: "Reports",
        appTitle: "CRM"
    },
    bn: {
        dashboard: "ড্যাশবোর্ড", products: "পণ্যসমূহ", inventory: "ইনভেন্টরি",
        categories: "বিভাগসমূহ", suppliers: "সরবরাহকারী", customers: "গ্রাহক",
        sales: "বিক্রয়", purchases: "ক্রয়", transactions: "লেনদেন",
        payment_accounts: "পেমেন্ট অ্যাকাউন্ট", batches: "ফার্ম ব্যাচ",
        expenses: "খরচ", bills: "বিল", reports: "রিপোর্ট",
        appTitle: "সিআরএম"
    }
};

export default function MainLayout() {
    // 💡 Set isCollapsed to true by default as requested
    const [isCollapsed, setIsCollapsed] = useState(true); 
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { language } = useLanguage();
    const location = useLocation();
    const t = translations[language] || translations.en;

    const navigation = [
        { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard" },
        { name: t.products, icon: Package, href: "/products" },
        { name: t.inventory, icon: Boxes, href: "/inventory" },
        { name: t.categories, icon: List, href: "/categories" },
        { name: t.suppliers, icon: Truck, href: "/suppliers" },
        { name: t.customers, icon: User, href: "/customers" },
        { name: t.sales, icon: ShoppingBag, href: "/sales" },
        { name: t.purchases, icon: Receipt, href: "/purchases" },
        { name: t.transactions, icon: CreditCard, href: "/transactions" },
        { name: t.payment_accounts, icon: Wallet, href: "/payment_accounts" },
        { name: t.batches, icon: Layers, href: "/farm-batches" },
        { name: t.expenses, icon: Receipt, href: "/expense-threads" },
        { name: t.bills, icon: FileText, href: "/bills" },
        { name: t.reports, icon: ClipboardList, href: "/reports" },
    ];

    const toggleSidebar = () => {
        if (window.innerWidth < 1024) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
            {/* --- SIDEBAR --- */}
            <aside 
                className={`z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm
                ${isCollapsed ? "w-20" : "w-64"} 
                ${/* On mobile it's fixed/absolute, on desktop it stays in the flow (sticky) */ ""}
                fixed inset-y-0 left-0 lg:h-screen
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className={`flex items-center h-16 border-b border-gray-100 px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
                        {!isCollapsed && (
                            <span className="text-xl font-black text-blue-700 truncate px-2 animate-in fade-in duration-500">
                                {t.appTitle}
                            </span>
                        )}
                        <button onClick={toggleSidebar} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} className="hidden lg:block" />}
                            <X size={20} className="lg:hidden" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    title={isCollapsed ? item.name : ""}
                                    className={`flex items-center rounded-xl transition-all duration-200 group
                                    ${isCollapsed ? "justify-center p-3" : "px-4 py-3"}
                                    ${isActive 
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}
                                >
                                    <Icon size={22} className={`shrink-0 ${isCollapsed ? "mr-0" : "mr-3"} transition-transform group-hover:scale-110 duration-200`} />
                                    {!isCollapsed && (
                                        <span className="text-sm font-semibold truncate animate-in slide-in-from-left-2 duration-300">
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* 💡 Dimming Overlay for Desktop & Mobile */}
                <div 
                    className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 z-40 pointer-events-none
                    ${(!isCollapsed || isMobileOpen) ? "opacity-80" : "opacity-0"}`}
                />

                {/* Header/Navbar */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30 transition-all duration-300">
                    <div className="flex items-center">
                        {/* Toggle Button for Desktop (Visible when collapsed) and Mobile */}
                        <button 
                            onClick={toggleSidebar}
                            className={`p-4 text-gray-500 hover:bg-gray-50 transition-colors lg:hidden`}
                        >
                            <Menu size={24} />
                        </button>
                        
                        <div className="flex-1">
                            <Navbar />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${(!isCollapsed && window.innerWidth >= 1024) ? 'opacity-80' : 'opacity-100'}`}>
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>

                <Footer />
            </div>

            {/* Mobile-only Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300" 
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </div>
    );
}