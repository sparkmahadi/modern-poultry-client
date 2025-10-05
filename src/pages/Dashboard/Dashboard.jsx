import React, { useState } from 'react';
// NOTE: You MUST import the 'Link' component from 'react-router-dom'
// import { Link } from 'react-router-dom'; 

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
} from 'lucide-react'; 
import { Link } from 'react-router';

// === 1. Navigation Links ===
const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', description: 'System key performance indicators.' },
    { name: 'Products', icon: Package, href: '/products', description: 'Manage inventory and product details.' },
    { name: 'Categories', icon: List, href: '/categories', description: 'Organize products into groups.' },
    { name: 'Suppliers', icon: Truck, href: '/suppliers', description: 'View and manage all suppliers and payables.' },
    { name: 'Customers', icon: User, href: '/customers', description: 'View and manage customer details and dues.' },
    { name: 'Sales', icon: ShoppingBag, href: '/sales', description: 'Process orders and view sales history.' },
    { name: 'Purchases', icon: Receipt, href: '/purchases', description: 'Record stock acquisitions and spending.' },
    { name: 'Transactions', icon: ClipboardList, href: '/transactions', description: 'Generate business insights and data reports.' },
    { name: 'Cash', icon: ClipboardList, href: '/cash', description: 'Generate business insights and data reports.' },
    { name: 'Reports', icon: ClipboardList, href: '/reports', description: 'Generate business insights and data reports.' },
];

// === 2. Sidebar Nav Item Component (Now using <Link>) ===
const NavItem = ({ item, currentPath }) => {
    const Icon = item.icon;
    const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href));
    
    // 💡 CHANGE: Replaced <a> with the structure for <Link>
    return (
        <Link 
            to={item.href} // Use 'to' instead of 'href'
            className={`
                flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out group
                ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                }
            `}
            // Note: onClick handler for setting currentPath is removed/moved to the main component's state logic
        >
            <Icon className={`w-6 h-6 mr-3 ${isActive ? 'text-white' : 'group-hover:text-blue-600'}`} />
            <span className="text-base font-semibold">{item.name}</span>
        </Link>
    );
};

// === 2.5. Nav Card Component (Now using <Link>) ===
const NavCard = ({ item }) => {
    const Icon = item.icon;
    
    // 💡 CHANGE: Replaced <a> with the structure for <Link>
    return (
        <Link 
            to={item.href} // Use 'to' instead of 'href'
            className="flex flex-col items-start p-5 bg-white border border-gray-200 rounded-xl shadow-md 
                       hover:shadow-xl hover:border-blue-500 transition duration-200 group"
        >
            <div className="p-3 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        </Link>
    );
};

// === 3. Sidebar Component ===
const Sidebar = ({ currentPath }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header/Menu Button */}
            <div className="lg:hidden p-4 bg-white border-b sticky top-0 z-40 flex items-center justify-between">
                <span className="text-xl font-bold text-gray-800">App Dashboard</span>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Content */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-30 transform bg-white w-64 p-5 shadow-2xl
                    lg:relative lg:translate-x-0 lg:shadow-none lg:h-full lg:flex-shrink-0
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="hidden lg:flex items-center h-16 border-b pb-4 mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-700">
                        📊 App CRM
                    </h1>
                </div>
                <nav className="space-y-2 pt-4 lg:pt-0">
                    {navigation.map((item) => (
                        <NavItem 
                            key={item.name} 
                            item={item} 
                            currentPath={currentPath}
                        />
                    ))}
                </nav>
            </aside>
            
            {/* Backdrop for Mobile */}
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-20 bg-black opacity-40 lg:hidden"
                />
            )}
        </>
    );
};

// === 4. Dashboard Metrics/Card Component and data (Unchanged) ===
const MetricCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
            <div className={`p-2 rounded-full ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
            <p className="text-4xl font-extrabold text-gray-900">{value}</p>
            <span className={`text-sm font-semibold ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {change} this month
            </span>
        </div>
    </div>
);

const metrics = [
    { title: "Total Sales", value: "$125,000", change: "+12.5%", icon: DollarSign, color: "bg-blue-500" },
    { title: "New Customers", value: "348", change: "+8.1%", icon: Users, color: "bg-green-500" },
    { title: "Active Suppliers", value: "45", change: "+2.2%", icon: Truck, color: "bg-yellow-500" },
    { title: "Stock Value", value: "$45,210", change: "-0.5%", icon: Warehouse, color: "bg-red-500" },
];

// === 5. The Full Dashboard Component ===
const Dashboard = () => {
    const [currentPath, setCurrentPath] = useState('/dashboard'); 

    const renderContent = () => {
        const primaryNavLinks = navigation.filter(item => item.href !== '/dashboard');

        switch(currentPath) {
            case '/dashboard':
                return (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Key Performance Metrics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {metrics.map((metric) => (
                                <MetricCard key={metric.title} {...metric} />
                            ))}
                        </div>
                        
                        {/* THE NAVIGATION CARD GRID */}
                        <h2 className="text-3xl font-bold text-gray-800 mt-12 mb-6">Quick Navigation</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {primaryNavLinks.map((item) => (
                                <NavCard key={item.name} item={item} />
                            ))}
                        </div>
                    </>
                );
            case '/suppliers':
                return <h2 className="text-3xl font-bold text-gray-800">Supplier Management View 📦</h2>;
            case '/customers':
                return <h2 className="text-3xl font-bold text-gray-800">Customer Management View 👥</h2>;
            default:
                return <h2 className="text-3xl font-bold text-gray-800">{navigation.find(n => n.href === currentPath)?.name || "Page"} View</h2>;
        }
    };

    // 💡 REMOVAL: The manual handleSimulatedNavigation and useEffect for <a> tags are REMOVED 
    // because React Router's <Link> component handles navigation automatically.

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            {/* 💡 NOTE: In a real app, you'd use useLocation() to pass the currentPath */}
            <Sidebar currentPath={currentPath} /> 

            {/* Main Content Area */}
            <main className="flex-1 p-4 lg:p-8">
                <header className="mb-8 hidden lg:block">
                    <h1 className="text-4xl font-extrabold text-gray-900 capitalize">
                        {currentPath === '/dashboard' ? 'Dashboard' : navigation.find(n => n.href === currentPath)?.name || 'Page'}
                    </h1>
                    <p className="text-gray-500 mt-1">Welcome to your management control center.</p>
                </header>

                <div className="pb-10">
                    {/* The content rendering logic remains tied to currentPath for this example */}
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;