import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/purchases`; // Adjust as needed

const PurchaseDueList = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");


    const fetchPurchases = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/?type=due`);
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

    const handlePaySupplierDue = (purchase) => {
        setSelectedPurchase(purchase);
        setPaymentAmount("");
        setShowPaymentModal(true);
    };

const handleSubmitPayment = async () => {
    const pay = Number(paymentAmount);
    const paymentMethod = "cash";
    const due = remainingDue;

    if (!pay || pay <= 0) {
        return toast.error("Enter a valid payment amount.");
    }

    if (pay > due) {
        return toast.error("Payment cannot exceed remaining due!");
    }

    try {
        const response = await axios.patch(
            `${API_BASE_URL}/pay/${selectedPurchase._id}`,
            {
                payAmount: pay,
                paymentMethod: paymentMethod || "cash"  // optional dropdown later
            }
        );

        const updated = response.data.data;

        // Update UI instantly
        setPurchases(prev =>
            prev.map(p =>
                p._id === selectedPurchase._id
                    ? { ...p, paidAmount: updated.paidAmount }
                    : p
            )
        );

        toast.success("Payment recorded successfully!");
        setShowPaymentModal(false);

    } catch (err) {
        console.error("Payment update failed:", err);
        toast.error(err.response?.data?.message || "Failed to update payment.");
    }
};







    if (loading) {
        return <div className="p-8 text-center text-xl">Loading Purchases... 🔄</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-semibold">Error: {error}</div>;
    }

    const totalDue = purchases.reduce((sum, item) => sum + item.payment_due, 0);
    const remainingDue = selectedPurchase
        ? Number(selectedPurchase.totalAmount) - Number(selectedPurchase.paidAmount)
        : 0;

    const updatedRemainingDue = selectedPurchase
        ? remainingDue - Number(paymentAmount || 0)
        : 0;

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

            {purchases?.length === 0 ? (
                <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800 border border-yellow-300">
                    No purchase records found.
                </div>
            ) : (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
                                        {purchase.supplierId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                        ৳{Number(purchase.totalAmount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                        ৳{Number(purchase.paidAmount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                        ৳{Number(purchase.totalAmount - purchase.paidAmount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {
                                            Number(purchase.totalAmount - purchase.paidAmount || 0).toFixed(2) > 0 &&
                                            <button
                                                onClick={() => handlePaySupplierDue(purchase)}
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

                    <h3>Total Due: {totalDue}</h3>
                </div>
            )}


            {/* modal */}
            {showPaymentModal && selectedPurchase && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Pay Supplier Due</h2>

            <div className="space-y-2 mb-4">
                <p><strong>Total Amount:</strong> ৳{selectedPurchase.totalAmount}</p>
                <p><strong>Paid Already:</strong> ৳{selectedPurchase.paidAmount}</p>
                <p><strong>Current Due:</strong> ৳{remainingDue}</p>

                {/* LIVE UPDATED REMAINING DUE */}
                {paymentAmount && (
                    <p
                        className={`font-semibold ${
                            updatedRemainingDue < 0 ? "text-red-600" : "text-green-700"
                        }`}
                    >
                        Remaining After Payment: ৳{updatedRemainingDue.toFixed(2)}
                    </p>
                )}
            </div>

            <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="w-full p-2 border rounded mb-4"
            />

            {/* Error message if pay > due */}
            {paymentAmount > remainingDue && (
                <p className="text-red-600 text-sm mb-3">
                    Payment cannot exceed remaining due!
                </p>
            )}

            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSubmitPayment}
                    disabled={paymentAmount > remainingDue}
                    className={`px-4 py-2 rounded text-white ${
                        paymentAmount > remainingDue
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    Pay
                </button>
            </div>
        </div>
    </div>
)}

        </div>
    );
};

export default PurchaseDueList;