import React, { useState } from "react";
import {
    LayoutDashboard,
    Package,
    List,
    ClipboardList,
    Menu,
    X,
    User,
    Truck,
    ShoppingBag,
    Receipt,
    DollarSign,
    Users,
    Warehouse,
    Wallet,
    Layers,
    Boxes,
    FileText,
    CreditCard
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
        keyMetrics: "Key Performance Metrics",
        quickNav: "Quick Navigation",
        welcome: "Welcome to your management control center.",
        appName: "App Dashboard",
        appTitle: "📊 App CRM",
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
        keyMetrics: "মূল কর্মক্ষমতা সূচক",
        quickNav: "দ্রুত নেভিগেশন",
        welcome: "আপনার ম্যানেজমেন্ট কন্ট্রোল সেন্টারে স্বাগতম।",
        appName: "অ্যাপ ড্যাশবোর্ড",
        appTitle: "📊 অ্যাপ সিআরএম",
    },
};

const Dashboard = () => {
    const { language, setLanguage } = useLanguage();
    const t = translations[language];
    const location = useLocation();

    // Use actual location path or fallback to dashboard
    const currentPath = location.pathname === "/" ? "/dashboard" : location.pathname;
    const [isOpen, setIsOpen] = useState(false);

    const navigation = [
        { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard", description: "System key performance indicators." },
        { name: t.products, icon: Package, href: "/products", description: "Manage inventory and product details." },
        { name: t.inventory, icon: Boxes, href: "/inventory", description: "Real-time stock tracking." },
        { name: t.categories, icon: List, href: "/categories", description: "Organize products into groups." },
        { name: t.suppliers, icon: Truck, href: "/suppliers", description: "Manage all suppliers and payables." },
        { name: t.customers, icon: User, href: "/customers", description: "Manage customer details and dues." },
        { name: t.sales, icon: ShoppingBag, href: "/sales", description: "Process orders and sales history." },
        { name: t.purchases, icon: Receipt, href: "/purchases", description: "Record stock acquisitions." },
        { name: t.transactions, icon: CreditCard, href: "/transactions", description: "Full financial transaction logs." },
        { name: t.payment_accounts, icon: Wallet, href: "/payment_accounts", description: "Manage cash flow and bank balances." },
        { name: t.batches, icon: Layers, href: "/farm-batches", description: "Track specific farm production batches." },
        { name: t.expenses, icon: DollarSign, href: "/expense-threads", description: "Track operational overheads." },
        { name: t.bills, icon: FileText, href: "/bills", description: "Manage utility and vendor bills." },
        { name: t.reports, icon: ClipboardList, href: "/reports", description: "Generate business insights." },
    ];

    const metrics = [
        { title: t.sales, value: "৳ 125,000", change: "+12.5%", icon: DollarSign, color: "bg-blue-500", link: "/sales" },
        { title: t.customers, value: "348", change: "+8.1%", icon: Users, color: "bg-green-500", link: "/customers" },
        { title: t.suppliers, value: "45", change: "+2.2%", icon: Truck, color: "bg-yellow-500", link: "/suppliers" },
        { title: "Due Sales", value: "৳ 45,210", change: "-0.5%", icon: Warehouse, color: "bg-red-500", link: "/sales/daily-due-sales" },
    ];

    const NavItem = ({ item }) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;
        return (
            <Link
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
            >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"}`} />
                <span className="text-sm font-semibold">{item.name}</span>
            </Link>
        );
    };

    const NavCard = ({ item }) => {
        const Icon = item.icon;
        return (
            <Link
                to={item.href}
                className="flex flex-col items-start p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 group"
            >
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Top Bar */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-40">
                    <span className="font-bold text-blue-700">{t.appName}</span>
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-gray-50 rounded-lg">
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </header>

                <main className="p-4 lg:p-10 max-w-7xl mx-auto w-full">
                    <header className="mb-10 hidden lg:block">
                        <h1 className="text-4xl font-black text-gray-900">
                            {navigation.find(n => n.href === currentPath)?.name || t.dashboard}
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">{t.welcome}</p>
                    </header>

                    {currentPath === "/dashboard" ? (
                        <div className="space-y-12">
                            <section>
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full mr-3"></span>
                                    {t.keyMetrics}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {metrics.map((m, idx) => (
                                        <Link key={idx} to={m.link} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                            <div className="flex justify-between items-start">
                                                <div className={`p-2 rounded-lg ${m.color} text-white`}>
                                                    <m.icon size={20} />
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${m.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {m.change}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-sm mt-4 font-medium uppercase">{m.title}</p>
                                            <p className="text-2xl font-black text-gray-900 mt-1">{m.value}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                    <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                                    {t.quickNav}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {navigation.filter(n => n.href !== "/dashboard").map((item) => (
                                        <NavCard key={item.href} item={item} />
                                    ))}
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
                           <p className="text-gray-400 font-medium">Content for {navigation.find(n => n.href === currentPath)?.name} will appear here.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden" />}
        </div>
    );
};

export default Dashboard;