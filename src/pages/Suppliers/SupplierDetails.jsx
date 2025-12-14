import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import {
    MapPin,
    Phone,
    CheckCircle,
    XOctagon,
    Tag,
    Truck,
    Clock,
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertTriangle,
    Calendar,
    Briefcase,
    Clock9,
    Percent,
    ShoppingCart,
    Package,
    TrendingUp,
    BarChart3
} from 'lucide-react';

// Use a placeholder for the actual API base URL from env
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/suppliers`;

// --- Helper Functions (Adjusted/Expanded) ---

const formatBalance = (due, advance) => {
    const balance = due - advance;
    const absBalance = Math.abs(balance).toFixed(2);

    if (balance > 0) return { label: `৳${absBalance} Payable`, className: 'text-red-600 border-red-200', icon: ArrowUpCircle };
    if (balance < 0) return { label: `৳${absBalance} Receivable`, className: 'text-green-600 border-green-200', icon: ArrowDownCircle };
    return { label: 'Settled', className: 'text-gray-600 border-gray-200', icon: DollarSign };
};

const formatDate = (dateObject) => {
    if (!dateObject || !dateObject.$date) return 'N/A';
    return new Date(dateObject.$date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Simplified DetailRow for the new layout style (less icon, more clean text)
const DetailBlock = ({ label, value, className = "" }) => (
    <div className={`p-3 ${className}`}>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 break-words mt-1">{value}</p>
    </div>
);

// --- Main Component ---

const SupplierDetails = () => {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dummy data for fields not likely returned by the basic API (to match image fields)
    const dummyStats = {
        joinedDate: '2023-01-15', // Format for display: Jan 15, 2023
        businessDuration: '1 year, 11 months',
        averagePaymentTime: '12 Days',
        commissionProvided: '2%',
        profitMargin: '15%',
        totalSoldMonth: 125000,
        totalTransactionMonth: 45,
        orderFrequencyMonth: '3.7 per week',
        lastPurchased: 'Dec 10, 2024 (ID: P-987)',
    };

    useEffect(() => {
        if (!id) {
            setError("Supplier ID is missing from the URL.");
            setIsLoading(false);
            return;
        }

        const fetchSupplier = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch the supplier data
                const res = await axios.get(`${API_BASE_URL}/${id}`);
                // Merge real data with dummy stats for display
                setSupplier({ ...dummyStats, ...res.data.data, ...res.data });
            } catch (err) {
                console.error("Fetch error:", err);
                if (err.response?.status === 404) setError(`Supplier with ID "${id}" was not found.`);
                else setError("Failed to fetch supplier details. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupplier();
    }, [id]);

    if (isLoading) return <div className="text-center p-10 bg-white rounded-xl shadow-lg"><Truck className="w-8 h-8 mx-auto text-blue-500 animate-spin" /><p className="mt-2 text-lg text-gray-700">Loading supplier data...</p></div>;
    if (error) return <div className="p-6 bg-red-100 border-l-4 border-red-500 rounded-xl shadow-lg text-red-800"><div className="flex items-center space-x-3"><AlertTriangle className="w-6 h-6 flex-shrink-0" /><p className="font-bold text-lg">Error Loading Data:</p></div><p className="ml-9 mt-1">{error}</p></div>;

    const balanceInfo = formatBalance(supplier.due, supplier.advance);
    const StatusIcon = supplier.status === 'active' ? CheckCircle : XOctagon;
    const suppliedProductsString = supplier?.supplied_products?.join(", ") || 'N/A';
    
    // Calculated field for Total Due / Total Paid based on the image format
    const netBalance = supplier.due - supplier.advance;
    const netBalanceText = netBalance > 0 
        ? `৳${netBalance.toFixed(2)}` // Payable
        : netBalance < 0 
        ? `৳${Math.abs(netBalance).toFixed(2)}` // Receivable
        : '৳0.00';

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">

            <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
                
                {/* Header Section */}
                <header className="border-b pb-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <h1 className="text-3xl font-extrabold text-gray-900">Details of <span className="text-blue-600">{supplier.name}</span></h1>
                    <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                        <button className="text-sm font-bold text-yellow-600 hover:text-yellow-800 transition flex items-center gap-1">
                            <Briefcase className='w-4 h-4' /> Edit
                        </button>
                        <button className="text-sm font-bold text-red-600 hover:text-red-800 transition flex items-center gap-1">
                            <XOctagon className='w-4 h-4' /> Delete
                        </button>
                    </div>
                </header>

                {/* --- Main Info Grid (Left Side, Right Side of Image) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN (Supplier Info, Payment Due, Financials) */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-700 mb-3 border-b pb-2">Basic Information</h2>

                        {/* Supplier Info Block (Joined Date, Business Duration, Payment Time, Commission) */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                            <DetailBlock label="Joined Date" value={new Date(supplier.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
                            <DetailBlock label="Business Duration" value={supplier.businessDuration} />
                            <DetailBlock label="Average Payment Time" value={supplier.averagePaymentTime} />
                            <DetailBlock label="Commission Provided" value={supplier.commissionProvided} />
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-700 mb-3 pt-4 border-t border-b pb-2">Payment Due on ({supplier.name})</h2>
                        
                        {/* Current Balance Card */}
                        <div className={`p-4 rounded-lg border-2 shadow-sm ${balanceInfo.className}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-bold">Current Balance</p>
                                <p className="text-3xl font-extrabold">{balanceInfo.label}</p>
                            </div>
                        </div>

                        {/* Financial Details (Profit Margin, Provided Products, Total Amount, Total Paid, Total Due) */}
                        <div className="grid grid-cols-2 gap-4">
                            <DetailBlock label="Profit Margin" value={supplier.profitMargin} />
                            <DetailBlock label="Provided Products" value={suppliedProductsString.substring(0, 30) + (suppliedProductsString.length > 30 ? '...' : '')} />
                            <DetailBlock label="Total Amount" value={`৳${supplier.due.toFixed(2)}`} />
                            <DetailBlock label="Total Paid" value={`৳${supplier.advance.toFixed(2)}`} />
                            <DetailBlock label="Total Due (Net)" value={netBalanceText} className={netBalance > 0 ? 'text-red-600' : 'text-green-600'} />
                            <DetailBlock label="Last Purchased" value={supplier.lastPurchased} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Address, Phone, Monthly Stats) */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-700 mb-3 border-b pb-2">Contact & Location</h2>
                        
                        {/* Address and Phone */}
                        <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg border">
                            <DetailBlock label="Phone" value={supplier.phone || 'N/A'} />
                            <DetailBlock label="Address" value={supplier.address || 'N/A'} />
                            <DetailBlock label="Supplier Type" value={supplier.type ? supplier.type.charAt(0).toUpperCase() + supplier.type.slice(1) : 'N/A'} />
                        </div>

                        <h2 className="text-xl font-bold text-gray-700 mb-3 pt-4 border-t border-b pb-2">Monthly Statistics</h2>
                        
                        {/* Monthly Stats (Total Sold, Transactions, Order Frequency) */}
                        <div className="grid grid-cols-2 gap-4">
                            <DetailBlock label="Total Sold/Month" value={`৳${supplier.totalSoldMonth.toLocaleString()}`} />
                            <DetailBlock label="Total Transaction/Month" value={supplier.totalTransactionMonth} />
                            <DetailBlock label="Order Frequency/Month" value={supplier.orderFrequencyMonth} />
                        </div>
                    </div>
                </div>

                {/* --- Transaction History (Moved to bottom and simplified) --- */}
                <h2 className="text-xl font-bold text-gray-800 mt-10 mb-2 border-b pb-1">Recent Transaction History</h2>
                {supplier.supplier_history?.length ? (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Total Amount</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Paid Amount</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Due After Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Only show the last 5 transactions for a cleaner detail view */}
                                {supplier.supplier_history.slice(0, 5).map((history, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-700">{formatDate(history.date)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700 capitalize">{history.type.replace('_', ' ')}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700">৳{history.total_amount}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700">৳{history.paid_amount}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700">৳{history.due_after_payment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 text-center border-t">
                            <a href="#" className="text-blue-600 hover:underline text-sm font-medium">
                                View Full Transaction History ({supplier.supplier_history.length} records)
                            </a>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No transactions found for this supplier.</p>
                )}
            </div>
        </div>
    );
};

export default SupplierDetails;