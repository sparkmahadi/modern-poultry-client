import React, { useState, useMemo } from "react";
import {
    LayoutDashboard, Package, List, ClipboardList, Menu, X, User, Truck,
    ShoppingBag, Receipt, DollarSign, Users, Warehouse, Wallet, Layers,
    Boxes, FileText, CreditCard, Search, Globe, ChevronRight
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../../contexts/LanguageContext";

const translations = {
    en: {
        dashboard: "Dashboard",
        products: "Products",
        inventory: "Inventory",
        categories: "Categories",
        suppliers: "Suppliers",
        customers: "Customers",
        sales: "Sales",
        purchases: "Purchases",
        transactions: "Transactions",
        payment_accounts: "Payment Accounts",
        batches: "Farm Batches",
        expenses: "Expenses",
        bills: "Bills",
        reports: "Reports",
        keyMetrics: "Performance Overview",
        quickNav: "Quick Access",
        welcome: "Welcome back, here is what's happening today.",
        appName: "MP Management",
        search: "Search records...",
    },
    bn: {
        dashboard: "ড্যাশবোর্ড",
        products: "পণ্যসমূহ",
        inventory: "ইনভেন্টরি",
        categories: "বিভাগসমূহ",
        suppliers: "সরবরাহকারী",
        customers: "গ্রাহক",
        sales: "বিক্রয়",
        purchases: "ক্রয়",
        transactions: "লেনদেন",
        payment_accounts: "পেমেন্ট অ্যাকাউন্ট",
        batches: "ফার্ম ব্যাচ",
        expenses: "খরচ",
        bills: "বিল",
        reports: "রিপোর্ট",
        keyMetrics: "কর্মক্ষমতা সারসংক্ষেপ",
        quickNav: "দ্রুত অ্যাক্সেস",
        welcome: "স্বাগতম, আজকের ব্যবসার অবস্থা দেখুন।",
        appName: "এমপি ম্যানেজমেন্ট",
        search: "অনুসন্ধান করুন...",
    },
};

const Dashboard = () => {
    const { language, setLanguage } = useLanguage();
    const t = translations[language];
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const currentPath = location.pathname === "/" ? "/dashboard" : location.pathname;

    // Grouping navigation for better UX
    const navigationGroups = [
        {
            group: "Main",
            items: [
                { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard", desc: "Overview" },
                { name: t.reports, icon: ClipboardList, href: "/reports", desc: "Insights" },
            ]
        },
        {
            group: "Inventory & Stock",
            items: [
                { name: t.products, icon: Package, href: "/products", desc: "Manage Items" },
                { name: t.inventory, icon: Boxes, href: "/inventory", desc: "Stock Levels" },
                { name: t.categories, icon: List, href: "/categories", desc: "Organization" },
                { name: t.batches, icon: Layers, href: "/farm-batches", desc: "Production" },
            ]
        },
        {
            group: "CRM & Vendors",
            items: [
                { name: t.customers, icon: User, href: "/customers", desc: "Client List" },
                { name: t.suppliers, icon: Truck, href: "/suppliers", desc: "Vendors" },
            ]
        },
        {
            group: "Finance",
            items: [
                { name: t.sales, icon: ShoppingBag, href: "/sales", desc: "Revenue" },
                { name: t.purchases, icon: Receipt, href: "/purchases", desc: "Acquisitions" },
                { name: t.expenses, icon: DollarSign, href: "/expense-threads", desc: "Overhead" },
                { name: t.transactions, icon: CreditCard, href: "/transactions", desc: "History" },
                { name: t.payment_accounts, icon: Wallet, href: "/payment_accounts", desc: "Banking" },
            ]
        }
    ];

    const metrics = [
        { title: t.sales, value: "৳ 125,000", change: "+12.5%", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100", link: "/sales" },
        { title: t.customers, value: "348", change: "+8.1%", icon: Users, color: "text-emerald-600", bg: "bg-emerald-100", link: "/customers" },
        { title: t.suppliers, value: "45", change: "+2.2%", icon: Truck, color: "text-amber-600", bg: "bg-amber-100", link: "/suppliers" },
        { title: "Due Sales", value: "৳ 45,210", change: "-0.5%", icon: Warehouse, color: "text-rose-600", bg: "bg-rose-100", link: "/sales/daily-due-sales" },
    ];


    return (
        <div className=" min-h-screen bg-slate-50">

            {/* Main Content Area */}
           {/* Navbar */}
                <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <div className="flex items-center flex-1">
                        
                        <div className="relative max-w-md w-full hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder={t.search} 
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8">
                    {currentPath === "/dashboard" ? (
                        <div className="max-w-7xl mx-auto space-y-10">
                            {/* Header Section */}
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.dashboard}</h1>
                                <p className="text-gray-500 mt-1">{t.welcome}</p>
                            </div>

                            {/* Metrics Grid */}
                            <section>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                    {metrics.map((m, idx) => (
                                        <Link key={idx} to={m.link} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className={`p-3 rounded-xl ${m.bg} ${m.color}`}>
                                                    <m.icon size={22} />
                                                </div>
                                                <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${m.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {m.change}
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{m.title}</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{m.value}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* Quick Access Grid */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                        <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
                                        {t.quickNav}
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {navigationGroups.flatMap(g => g.items).filter(n => n.href !== "/dashboard").map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group"
                                        >
                                            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <item.icon size={20} />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                                                <p className="text-xs text-gray-400">{item.desc}</p>
                                            </div>
                                            <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <LayoutDashboard className="text-gray-300" />
                           </div>
                           <h2 className="text-xl font-bold text-gray-800">Module Under Development</h2>
                           <p className="text-gray-500 mt-2">Content for {location.pathname} is coming soon.</p>
                        </div>
                    )}
                </main>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
                        <SidebarContent />
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-[-45px] p-2 bg-white rounded-full text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;