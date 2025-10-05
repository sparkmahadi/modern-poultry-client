import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Assuming you use react-router-dom for routing
import { useParams } from 'react-router'; 

// Import icons from lucide-react (or your chosen library)
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
    AlertTriangle
} from 'lucide-react'; 

// NOTE: This API base URL needs to match your backend
const API_BASE_URL = "http://localhost:5000/api/suppliers";

// Helper function to format the balance (copied for consistency)
const formatBalance = (due, advance) => {
    const balance = due - advance;
    const absBalance = Math.abs(balance).toFixed(2);

    if (balance > 0) {
        // We owe the supplier (Payable)
        return {
            label: `Payable: ৳${absBalance}`,
            className: 'text-red-600 bg-red-50 border-red-200',
            icon: ArrowUpCircle 
        };
    } else if (balance < 0) {
        // Supplier owes us (Receivable/Advance)
        return {
            label: `Receivable: ৳${absBalance}`,
            className: 'text-green-600 bg-green-50 border-green-200',
            icon: ArrowDownCircle
        };
    } else {
        return {
            label: 'Settled',
            className: 'text-gray-600 bg-gray-50 border-gray-200',
            icon: DollarSign
        };
    }
};

// Helper function to format date (copied for consistency)
const formatDate = (dateObject) => {
    if (!dateObject || !dateObject.$date) return 'N/A';
    return new Date(dateObject.$date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Component for a single detail row
const DetailRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-start space-x-3 p-3 ${className}`}>
        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-base font-semibold text-gray-900 break-words">{value}</p>
        </div>
    </div>
);

// ===============================================
// === The Supplier Details Fetching Component ===
// ===============================================
const SupplierDetails = () => {
    // Fetches the 'id' parameter from the URL path, e.g., /suppliers/68e29d3cdae9a34a9533ed58
    const { id } = useParams(); 
    
    const [supplier, setSupplier] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                // Fetch data from the endpoint api/suppliers/:id
                const res = await axios.get(`${API_BASE_URL}/${id}`);
                // Assuming the backend returns the supplier object directly or under a 'data' key
                setSupplier(res.data.data || res.data); 
            } catch (err) {
                console.error("Fetch error:", err);
                // Check for 404 specifically
                if (err.response && err.response.status === 404) {
                    setError(`Supplier with ID "${id}" was not found.`);
                } else {
                    setError("Failed to fetch supplier details. Please try again.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupplier();
    }, [id]); // Re-fetch if the ID changes (useful if using the component for multiple details pages)

    if (isLoading) {
        return (
            <div className="text-center p-10 bg-white rounded-xl shadow-lg">
                <Truck className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                <p className="mt-2 text-lg text-gray-700">Loading supplier data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-100 border-l-4 border-red-500 rounded-xl shadow-lg text-red-800">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                    <p className="font-bold text-lg">Error Loading Data:</p>
                </div>
                <p className="ml-9 mt-1">{error}</p>
            </div>
        );
    }

    // If data is successfully loaded, render the details
    const balanceInfo = formatBalance(supplier.due, supplier.advance);
    const StatusIcon = supplier.status === 'active' ? CheckCircle : XOctagon;

    return (
        <div className="p-6 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl mx-auto">
            <header className="border-b pb-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Truck className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-extrabold text-gray-900">{supplier.name} Details</h1>
                </div>
                <span className={`px-4 py-2 mt-3 sm:mt-0 text-sm font-bold rounded-full capitalize 
                                 ${supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <StatusIcon className="w-4 h-4 inline mr-1" />
                    {supplier.status}
                </span>
            </header>

            {/* === Financial Status Section === */}
            <div className={`p-4 rounded-lg mb-6 border-2 ${balanceInfo.className}`}>
                <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">Current Balance</p>
                    <p className="text-3xl font-extrabold">{balanceInfo.label}</p>
                </div>
                <p className="text-xs text-right mt-1 opacity-90">
                    (Payable: ৳{supplier.due.toFixed(2)} / Receivable: ৳{supplier.advance.toFixed(2)})
                </p>
            </div>


            {/* === Core Details Grid === */}
            <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-1">Contact & Basic Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pb-4 mb-4">
                <DetailRow 
                    icon={Phone} 
                    label="Phone / Contact" 
                    value={supplier.phone || 'N/A'}
                />
                <DetailRow 
                    icon={Tag} 
                    label="Supplier Type" 
                    value={supplier.type ? supplier.type.charAt(0).toUpperCase() + supplier.type.slice(1) : 'N/A'}
                />
                <DetailRow 
                    icon={MapPin} 
                    label="Address" 
                    value={supplier.address || 'N/A'}
                    className="md:col-span-2"
                />
            </div>
            
            {/* === Metadata === */}
            <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-1">System Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DetailRow 
                    icon={Clock} 
                    label="Record Created" 
                    value={formatDate(supplier.createdAt)}
                />
                <DetailRow 
                    icon={Clock} 
                    label="Last Updated" 
                    value={formatDate(supplier.updatedAt)}
                />
                <DetailRow 
                    icon={DollarSign} 
                    label="Database ID" 
                    value={supplier._id?.$oid || 'N/A'}
                />
            </div>
        </div>
    );
};

export default SupplierDetails;