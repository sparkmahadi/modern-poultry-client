import React, { useState } from 'react';
import {
    Home, PiggyBank, ReceiptText, BarChart2, Menu, X, User,
    Package, LayoutDashboard, Wallet, TrendingUp, NotebookPen, List, ClipboardList, // More descriptive icons
    LogOut
} from 'lucide-react'; // Import more appropriate icons
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router'; // Assuming react-router-dom for Link

// A simple Navbar component
const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // For user dropdown on desktop
    const { userInfo, isAuthenticated, logout } = useAuth();

    // Adjusted navItems with more descriptive icons
    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Products', icon: Package, href: '/products' },
        { name: 'Categories', icon: List, href: '/categories' }, // Changed to List
        { name: 'Budgets', icon: PiggyBank, href: '/budgets' },
        { name: 'Expenses', icon: ReceiptText, href: '/expenses' },
        { name: 'Expense Notes', icon: ReceiptText, href: '/expense-notes' },
        { name: 'Consumptions', icon: NotebookPen, href: '/consumptions' }, // Changed to NotebookPen
        { name: 'Reports', icon: ClipboardList, href: '/reports' }, // Changed to ClipboardList
    ];

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg font-inter text-white">
            <div className="container mx-auto flex justify-between items-center flex-wrap">
                {/* App Title/Logo */}
                <Link
                    to={'/'}
                    className="flex items-center text-xl font-bold rounded-md px-3 py-1 cursor-pointer hover:bg-blue-700 transition duration-300 whitespace-nowrap"
                >
                    Family Budget
                </Link>

                {/* Mobile menu button */}
                <div className="md:hidden flex items-center space-x-2">
                    {isAuthenticated && userInfo?.name && ( // Show username on mobile if authenticated
                        <span className="text-sm font-light mr-2">Hello, {userInfo.name.split(' ')[0]}!</span>
                    )}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white p-2 rounded-md transition duration-300 hover:bg-blue-700"
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center space-x-4 lg:space-x-6"> {/* Adjusted space-x here */}
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className="flex items-center space-x-2 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105 whitespace-nowrap text-sm lg:text-base" /* Smaller padding, smaller text on smaller desktop */
                            >
                                <IconComponent size={18} /> {/* Smaller icons */}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Authentication/User Info Section for Desktop */}
                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center space-x-2 text-white px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                aria-haspopup="true"
                                aria-expanded={isUserMenuOpen}
                            >
                                <User size={18} />
                                <span className="text-sm font-light hidden lg:inline">Hello, {userInfo?.name?.split(' ')[0] || 'User'}!</span> {/* Show first name if available */}
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
                                        <LogOut size={16} /> {/* Assuming you've imported LogOut from lucide-react */}
                                        <span>Log Out</span>
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
                                <span className="font-medium">Login</span>
                            </Link>
                            <Link
                                to={'/register'}
                                className="flex items-center text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105 text-sm lg:text-base"
                            >
                                <span className="font-medium">Register</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Links */}
            <div
                className={`md:hidden mt-4 bg-blue-800 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100 p-4' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="flex flex-col space-y-3">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={closeMobileMenu} // Close menu on link click
                                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
                            >
                                <IconComponent size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Auth/User Info for Mobile */}
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-md shadow-inner mt-4">
                                <User size={20} />
                                <span className="text-sm font-light">
                                    {userInfo?.name ? `Hello, ${userInfo.name}!` : `User ID: ${userInfo?.username}`}
                                </span>
                            </div>
                            <button
                                onClick={() => { logout(); closeMobileMenu(); }}
                                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
                            >
                                <LogOut size={20} />
                                <span className="font-medium">Log Out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to={'/login'}
                                onClick={closeMobileMenu}
                                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
                            >
                                <span className="font-medium">Login</span>
                            </Link>
                            <Link
                                to={'/register'}
                                onClick={closeMobileMenu}
                                className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
                            >
                                <span className="font-medium">Register</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;