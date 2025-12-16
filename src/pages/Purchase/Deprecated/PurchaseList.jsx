    import React, { useState, useEffect, useCallback } from 'react';
    import axios from 'axios';
    import { Link, useNavigate } from 'react-router';
    import { toast } from 'react-toastify';

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/purchases`; // Adjust as needed

    const PurchaseList = () => {
        const [purchases, setPurchases] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const navigate = useNavigate();

        const fetchPurchases = useCallback(async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(API_BASE_URL);
                // Assuming the controller returns { success: true, data: purchases }
                setPurchases(response.data.data);
            } catch (err) {
                console.error('Failed to fetch purchases:', err);
                setError(err.response?.data?.error || 'Failed to load purchase data.');
                toast.error('Failed to load purchases.');
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => {
            fetchPurchases();
        }, [fetchPurchases]);

        const handleDelete = async (id) => {
            if (!window.confirm("Are you sure you want to delete this purchase? This will affect inventory.")) {
                return;
            }

            try {
                await axios.delete(`${API_BASE_URL}/${id}`);
                toast.success('Purchase deleted successfully!');
                // Update the state to remove the deleted purchase
                setPurchases(prev => prev.filter(p => p._id !== id));
            } catch (err) {
                console.error('Failed to delete purchase:', err);
                toast.error(err.response?.data?.message || 'Failed to delete purchase.');
            }
        };

        const handlePaySupplierDue = async () => {

        }

        if (loading) {
            return <div className="p-8 text-center text-xl">Loading Purchases... 🔄</div>;
        }

        if (error) {
            return <div className="p-8 text-center text-red-600 font-semibold">Error: {error}</div>;
        }


        // Calculate totals
        const totalPurchased = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);

        const totalPaid = purchases.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

        const totalDue = purchases.reduce((sum, p) => sum + ((p.total_amount || 0) - (p.paid_amount || 0)), 0);

        

        return (
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Purchase History</h1>
                <div className="flex justify-end mb-4">
                    <Link
                        to="/purchases/create"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + New Purchase
                    </Link>
                    <Link
                        to="/purchases/due-list"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Due List
                    </Link>
                </div>

                {purchases.length === 0 ? (
                    <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800 border border-yellow-300">
                        No purchase records found.
                    </div>
                ) : (
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-blue-100 rounded-lg text-center">
                                <h3 className="font-semibold text-gray-700">Total Purchased</h3>
                                <p className="text-2xl font-bold">৳{totalPurchased.toFixed(2)}</p>
                            </div>

                            <div className="p-4 bg-green-100 rounded-lg text-center">
                                <h3 className="font-semibold text-gray-700">Total Paid</h3>
                                <p className="text-2xl font-bold">৳{totalPaid.toFixed(2)}</p>
                            </div>

                            <Link to="/purchases/due-list" className="p-4 bg-red-100 rounded-lg text-center">
                                <h3 className="font-semibold text-gray-700">Total Due</h3>
                                <p className="text-2xl font-bold">৳{totalDue.toFixed(2)}</p>
                            </Link>
                        </div>


                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {purchases.map((purchase) => (
                                    <tr key={purchase._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {new Date(purchase.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {purchase.supplier_id || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                            ৳{Number(purchase.total_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                            ৳{Number(purchase.paid_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                            ৳{Number(purchase.total_amount - purchase.paid_amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {
                                                Number(purchase.total_amount - purchase.paid_amount || 0).toFixed(2) > 0 &&
                                                <button
                                                    onClick={() => handlePaySupplierDue(purchase._id)}
                                                    className="text-red-600 hover:text-red-900 transition ml-4"
                                                >
                                                    Pay
                                                </button>
                                            }
                                            <Link
                                                to={`/purchases/edit/${purchase._id}`}
                                                className="text-indigo-600 hover:text-indigo-900 transition"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(purchase._id)}
                                                className="text-red-600 hover:text-red-900 transition ml-4"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    export default PurchaseList;