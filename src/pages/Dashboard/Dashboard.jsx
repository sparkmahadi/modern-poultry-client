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
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../../contexts/LanguageContext";

// 🗣️ Translations for English & Bangla
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
        cash: "Cash",
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
        cash: "নগদ",
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

    const [currentPath, setCurrentPath] = useState("/dashboard");
    const [isOpen, setIsOpen] = useState(false);

    const navigation = [
        { name: t.dashboard, icon: LayoutDashboard, href: "/dashboard", description: "System key performance indicators." },
        { name: t.products, icon: Package, href: "/products", description: "Manage inventory and product details." },
        { name: t.inventory, icon: Package, href: "/inventory", description: "Manage inventory and product details." },
        { name: t.categories, icon: List, href: "/categories", description: "Organize products into groups." },
        { name: t.suppliers, icon: Truck, href: "/suppliers", description: "View and manage all suppliers and payables." },
        { name: t.customers, icon: User, href: "/customers", description: "View and manage customer details and dues." },
        { name: t.sales, icon: ShoppingBag, href: "/sales", description: "Process orders and view sales history." },
        { name: t.purchases, icon: Receipt, href: "/purchases", description: "Record stock acquisitions and spending." },
        { name: t.transactions, icon: ClipboardList, href: "/transactions", description: "Generate business insights and data reports." },
        { name: t.cash, icon: ClipboardList, href: "/cash", description: "Manage your cash flow and balance." },
        { name: t.reports, icon: ClipboardList, href: "/reports", description: "Generate business insights and data reports." },
    ];

    const NavItem = ({ item }) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;

        return (
            <Link
                to={item.href}
                onClick={() => setCurrentPath(item.href)}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 ${isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                        : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                    }`}
            >
                <Icon className={`w-6 h-6 mr-3 ${isActive ? "text-white" : "group-hover:text-blue-600"}`} />
                <span className="text-base font-semibold">{item.name}</span>
            </Link>
        );
    };

    const NavCard = ({ item }) => {
        const Icon = item.icon;
        return (
            <Link
                to={item.href}
                onClick={() => setCurrentPath(item.href)}
                className="flex flex-col items-start p-5 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl hover:border-blue-500 transition duration-200 group"
            >
                <div className="p-3 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </Link>
        );
    };

    const Sidebar = () => (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden p-4 bg-white border-b sticky top-0 z-40 flex items-center justify-between">
                <span className="text-xl font-bold text-gray-800">{t.appName}</span>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 transform bg-white w-64 p-5 shadow-2xl lg:relative lg:translate-x-0 lg:shadow-none transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="hidden lg:flex items-center h-16 border-b pb-4 mb-6 justify-between">
                    <h1 className="text-2xl font-extrabold text-blue-700">{t.appTitle}</h1>
                    <button
                        onClick={() => setLanguage(language === "en" ? "bn" : "en")}
                        className="text-sm text-blue-600 border border-blue-600 px-2 py-1 rounded hover:bg-blue-600 hover:text-white"
                    >
                        {language === "en" ? "বাংলা" : "EN"}
                    </button>
                </div>
                <nav className="space-y-2">
                    {navigation.map((item) => (
                        <NavItem key={item.href} item={item} />
                    ))}
                </nav>
            </aside>

            {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black opacity-40 lg:hidden" />}
        </>
    );

    const metrics = [
        { title: "Total Sales", value: "$125,000", change: "+12.5%", icon: DollarSign, color: "bg-blue-500" , link: "/"},
        { title: "New Customers", value: "348", change: "+8.1%", icon: Users, color: "bg-green-500" , link: "/"},
        { title: "Active Suppliers", value: "45", change: "+2.2%", icon: Truck, color: "bg-yellow-500" , link: "/"},
        { title: "Due Sales", value: "$45,210", change: "-0.5%", icon: Warehouse, color: "bg-red-500" , link: "/sales/daily-due-sales"},
        { title: "Cash Sales", value: "$45,210", change: "-0.5%", icon: Warehouse, color: "bg-red-500" , link: "/sales/daily-cash-sales"},
        { title: "Daily Sales", value: "$45,210", change: "-0.5%", icon: Warehouse, color: "bg-red-500" , link: "/sales/daily-sales"},
    ];

    const MetricCard = ({ title, value, change, icon: Icon, color, link }) => (
        <Link to={link} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
                <div className={`p-2 rounded-full ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
                <p className="text-4xl font-extrabold text-gray-900">{value}</p>
                <span className={`text-sm font-semibold ${change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {change} this month
                </span>
            </div>
        </Link>
    );

    const renderContent = () => {
        const primaryNavLinks = navigation.filter((item) => item.href !== "/dashboard");

        switch (currentPath) {
            case "/dashboard":
                return (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">{t.keyMetrics}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {metrics.map((metric) => (
                                <MetricCard key={metric.title} {...metric} />
                            ))}
                        </div>

                        <h2 className="text-3xl font-bold text-gray-800 mt-12 mb-6">{t.quickNav}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {primaryNavLinks.map((item) => (
                                <NavCard key={item.href} item={item} />
                            ))}
                        </div>
                    </>
                );

            default:
                return (
                    <h2 className="text-3xl font-bold text-gray-800">
                        {navigation.find((n) => n.href === currentPath)?.name || "Page"} View
                    </h2>
                );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-8">
                <header className="mb-8 hidden lg:block">
                    <h1 className="text-4xl font-extrabold text-gray-900 capitalize">
                        {currentPath === "/dashboard"
                            ? t.dashboard
                            : navigation.find((n) => n.href === currentPath)?.name || "Page"}
                    </h1>
                    <p className="text-gray-500 mt-1">{t.welcome}</p>
                </header>
                <div className="pb-10">{renderContent()}</div>
            </main>
        </div>
    );
};

export default Dashboard;
