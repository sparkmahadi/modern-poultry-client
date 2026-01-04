import React from 'react';
import { Outlet } from "react-router";
import Footer from './../pages/Common/Footer/Footer';
import NavbarV3 from '../pages/Common/Navbar/NavbarV3';

export default function MainLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* The new "Powerful" Navbar */}
            <NavbarV3 />

            {/* Main Content Area */}
            <main className="flex-1 w-full">
                <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                    {/* Page Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[80vh] p-4 md:p-6">
                        <Outlet />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}








// import React, { useState } from 'react';
// import { Link, Outlet, useLocation } from "react-router";
// import {
//     LayoutDashboard, Package, List, ClipboardList, Menu, X,
//     User, Truck, ShoppingBag, Receipt, Users, Boxes,
//     Wallet, Layers, FileText, CreditCard, Pin, PinOff,
//     ChevronRight // 💡 Added for the hint
// } from "lucide-react";
// import Navbar from './../pages/Common/Navbar/Navbar';
// import Footer from './../pages/Common/Footer/Footer';
// import { useLanguage } from '../contexts/LanguageContext';

// const translations = {
//     en: {
//         dashboard: "Dashboard", products: "Products", inventory: "Inventory",
//         categories: "Categories", suppliers: "Suppliers", customers: "Customers",
//         sales: "Sales", purchases: "Purchases", transactions: "Transactions",
//         payment_accounts: "Payment Accounts", batches: "Farm Batches",
//         expenses: "Expenses", bills: "Bills", reports: "Reports",
//         appTitle: "M.P."
//     },
//     bn: {
//         dashboard: "ড্যাশবোর্ড", products: "পণ্যসমূহ", inventory: "ইনভেন্টরি",
//         categories: "বিভাগসমূহ", suppliers: "সরবরাহকারী", customers: "গ্রাহক",
//         sales: "বিক্রয়", purchases: "ক্রয়", transactions: "লেনদেন",
//         payment_accounts: "পেমেন্ট অ্যাকাউন্ট", batches: "ফার্ম ব্যাচ",
//         expenses: "খরচ", bills: "বিল", reports: "রিপোর্ট",
//         appTitle: "M.P."
//     }
// };

// export default function MainLayout() {
//     const [isLocked, setIsLocked] = useState(false);
//     const [isHovered, setIsHovered] = useState(false);
//     const [isMobileOpen, setIsMobileOpen] = useState(false);
//     const { language } = useLanguage();
//     const location = useLocation();
//     const t = translations[language] || translations.en;

//     const navigation = [
//         { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard" },
//         { name: t.products, icon: Package, href: "/products" },
//         { name: t.inventory, icon: Boxes, href: "/inventory" },
//         { name: t.categories, icon: List, href: "/categories" },
//         { name: t.suppliers, icon: Truck, href: "/suppliers" },
//         { name: t.customers, icon: User, href: "/customers" },
//         { name: t.sales, icon: ShoppingBag, href: "/sales" },
//         { name: t.purchases, icon: Receipt, href: "/purchases" },
//         { name: t.transactions, icon: CreditCard, href: "/transactions" },
//         { name: t.payment_accounts, icon: Wallet, href: "/payment_accounts" },
//         { name: t.batches, icon: Layers, href: "/farm-batches" },
//         { name: t.expenses, icon: Receipt, href: "/expense-threads" },
//         { name: t.bills, icon: FileText, href: "/bills" },
//         { name: t.reports, icon: ClipboardList, href: "/reports" },
//     ];

//     const isExpanded = isLocked || isHovered;

//     const toggleLock = () => {
//         if (window.innerWidth < 1024) {
//             setIsMobileOpen(!isMobileOpen);
//         } else {
//             setIsLocked(!isLocked);
//             setIsHovered(false);
//         }
//     };

//     return (
//         <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
//             {/* --- SIDEBAR --- */}
//             <aside
//                 onMouseEnter={() => !isLocked && setIsHovered(true)}
//                 onMouseLeave={() => setIsHovered(false)}
//                 className={`z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
//                 ${isExpanded ? "w-64" : "w-20"} 
//                 ${!isLocked && isHovered ? "shadow-2xl" : "shadow-sm"} 
//                 fixed inset-y-0 left-0 lg:h-screen
//                 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
//             >
//                 <div className="flex flex-col h-full relative">
                    
//                     {/* 💡 THE HINT ARROW: Only visible when collapsed and not interacting */}
//                     {!isExpanded && (
//                         <div className="absolute -right-3 top-20 bg-blue-600 text-white rounded-full p-0.5 shadow-lg animate-pulse lg:block hidden">
//                             <ChevronRight size={14} />
//                         </div>
//                     )}

//                     {/* Sidebar Header */}
//                     <div className={`flex items-center h-16 border-b border-gray-100 px-4 ${!isExpanded ? "justify-center" : "justify-between"}`}>
//                         {isExpanded && (
//                             <span className="text-xl font-black text-blue-700 truncate px-2 animate-in fade-in duration-500">
//                                 {t.appTitle}
//                             </span>
                            
//                         )}
//                         <button 
//                             onClick={toggleLock} 
//                             className={`p-2 rounded-lg transition-all duration-200 ${isLocked ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
//                         >
//                             {isLocked ? <Pin size={18} /> : <PinOff size={18} />}
//                             <X size={20} className="lg:hidden" />
//                         </button>
//                     </div>

//                     {/* Navigation Links */}
//                     <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
//                         {navigation.map((item) => {
//                             const Icon = item.icon;
//                             const isActive = location.pathname === item.href;
//                             return (
//                                 <Link
//                                     key={item.href}
//                                     to={item.href}
//                                     onClick={() => setIsMobileOpen(false)}
//                                     className={`flex items-center rounded-xl transition-all duration-200 group
//                                     ${!isExpanded ? "justify-center p-3" : "px-4 py-3"}
//                                     ${isActive 
//                                         ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
//                                         : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}
//                                 >
//                                     <Icon size={22} className={`shrink-0 ${!isExpanded ? "mr-0" : "mr-3"} transition-transform group-hover:scale-110 duration-200`} />
//                                     {isExpanded && (
//                                         <span className="text-sm font-semibold truncate animate-in slide-in-from-left-2 duration-300">
//                                             {item.name}
//                                         </span>
//                                     )}
//                                 </Link>
//                             );
//                         })}
//                     </nav>
//                 </div>
//             </aside>

//             {/* --- MAIN CONTENT AREA --- */}
//             <div className="flex-1 flex flex-col min-w-0 relative">
                
//                 {((!isLocked && isHovered) || isMobileOpen) && (
//                     <div
//                         onClick={() => isMobileOpen ? setIsMobileOpen(false) : setIsHovered(false)}
//                         className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-opacity duration-300"
//                     />
//                 )}

//                 <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isLocked ? "lg:pl-64" : "lg:pl-20"}`}>
//                     <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
//                         <div className="flex items-center">
//                             <button onClick={() => setIsMobileOpen(true)} className="p-4 text-gray-500 hover:bg-gray-50 lg:hidden">
//                                 <Menu size={24} />
//                             </button>
//                             <div className="flex-1">
//                                 <Navbar />
//                             </div>
//                         </div>
//                     </header>

//                     <main className="flex-1 p-4 lg:p-8">
//                         <div className="max-w-[1600px] mx-auto">
//                             <Outlet />
//                         </div>
//                     </main>
//                     <Footer />
//                 </div>
//             </div>
//         </div>
//     );
// }