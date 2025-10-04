import React, { useState, useEffect } from "react";
import { ShoppingCart, Heart, PackageCheck, Eye, PersonStanding, UtilityPole, PenToolIcon, RecycleIcon, StoreIcon } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router";
// No longer need axios imports here for initial data fetching

const Dashboard = ({
    categories,
    users,
    products,
    //   initialTakenSamples,
    //   initialDeletedSamples,
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, userInfo } = useAuth(); // Assume isAuthenticated and userInfo are available from context
    const stats = [
        // {
        //     title: "Total Samples",
        //     icon: <PackageCheck className="h-6 w-6 text-blue-600" />,
        //     link: '/samples',
        //     value: samples?.length,
        // },
        // {
        //     title: "Samples Taken",
        //     icon: <Eye className="h-6 w-6 text-green-600" />,
        //     link: '/samples/taken-samples',
        //     value: takenSamples?.length,
        // },
        {
            title: "Favorites",
            icon: <Heart className="h-6 w-6 text-red-500" />,
            link: '/',
            value: 10, // Placeholder
        },
        {
            title: "Total Categories",
            icon: <ShoppingCart className="h-6 w-6 text-purple-500" />,
            link: '/categories',
            value: categories?.length,
        },
    ];

    const adminStats = [
        {
            title: "Total Users",
            icon: <PersonStanding className="h-6 w-6 text-purple-500" />,
            link: '/dashboard/users',
            value: users?.length,
        },
        {
            title: "Total Products",
            icon: <StoreIcon className="h-6 w-6 text-purple-500" />,
            link: '/dashboard/products-list',
            value: products?.length,
        },
        {
            title: "Utilities",
            icon: <UtilityPole className="h-6 w-6 text-purple-500" />,
            link: '/sample-utilities/',
            value: 'N/A',
        },
        {
            title: "Tools",
            icon: <PenToolIcon className="h-6 w-6 text-purple-500" />,
            link: '/tools/',
            value: 'N/A',
        },
    ];

    // No explicit loader return needed here for initial load as data comes via props.

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Link
                        to={stat?.link}
                        key={index}
                        className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition cursor-pointer"
                    >
                        <div>
                            <h2 className="text-gray-600 text-sm">{stat.title}</h2>
                            <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                        {stat.icon}
                    </Link>
                ))}
                {userInfo?.role === "admin" &&
                    adminStats.map((stat, index) => (
                        <Link to={stat?.link}
                            key={index}
                            className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition cursor-pointer"
                        >
                            <div>
                                <h2 className="text-gray-600 text-sm">{stat?.title}</h2>
                                <p className="text-xl font-bold">{stat?.value}</p>
                            </div>
                            {stat?.icon}
                        </Link>
                    ))}
            </div>
        </div>
    );
};

export default Dashboard;