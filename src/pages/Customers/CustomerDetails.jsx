import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    User, 
    Users,
    Phone, 
    MapPin, 
    ArrowLeft, 
    Edit3, 
    Trash2, 
    Calculator, 
    Wallet, 
    Layers, 
    Plus, 
    ShoppingBag, 
    Calendar,
    Truck,
    Store
} from 'lucide-react';
import CreateBatchForm from '../FarmBatches/CreateBatchForm';
import UniversalSalesManager from '../Sales/UniversalSalesManager';
import ReceiveDueManuallyModal from './ReceiveDueManuallyModal';
import CustomerFormModal from './CustomerFormModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --- CustomerBatchList Subcomponent ---
const CustomerBatchList = ({ batches, customerId, onBatchUpdate }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

    const deleteBatch = async (batchId) => {
        if (!window.confirm("Are you sure you want to permanently delete this farm batch?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/batches/${batchId}`);
            toast.success('Batch deleted successfully!');
            onBatchUpdate();
        } catch (error) {
            console.error('Failed to delete batch:', error);
            toast.error(error.response?.data?.message || 'Failed to delete batch.');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-slate-100 border-b">
                <div>
                    <h2 className="flex items-center gap-2 font-bold text-base text-slate-900">
                        <Layers className="w-4 h-4 text-amber-600" /> Linked Farm Batches
                    </h2>
                    <p className="mt-0.5 text-slate-400 text-xs">Production batches assigned to this customer/farmer</p>
                </div>
                <button
                    type="button"
                    onClick={() => { setEditingBatch(null); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl font-bold text-amber-800 text-xs transition"
                >
                    <Plus className="w-3.5 h-3.5" /> Start New Batch
                </button>
            </div>

            {(!batches || batches.length === 0) ? (
                <div className="space-y-2 py-10 border-2 border-slate-100 border-dashed rounded-xl text-center">
                    <p className="text-slate-400 text-xs italic">No farming batches associated with this customer.</p>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 border-slate-200 border-b font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Batch ID</th>
                                <th className="px-4 py-3">Breed</th>
                                <th className="px-4 py-3 text-center">Chicks</th>
                                <th className="px-4 py-3 text-center">Start Date</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {batches.map((batch) => (
                                <tr key={batch._id} className="hover:bg-slate-50/70 transition">
                                    <td className="px-4 py-3 font-bold font-mono text-slate-900">#{batch._id.slice(-6)}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{batch.chicksBreed || 'Broiler'}</td>
                                    <td className="px-4 py-3 font-bold font-mono text-blue-600 text-center">{batch.chicksQuantity}</td>
                                    <td className="px-4 py-3 text-center text-slate-500 text-xs">
                                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                                            batch.active ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            {batch.active ? 'Active' : 'Harvested'}
                                        </span>
                                    </td>
                                    <td className="space-x-2 px-4 py-3 text-center">
                                        <Link 
                                            to={`/farm-batches/${batch._id}`} 
                                            className="bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-bold text-blue-700 text-xs transition"
                                        >
                                            Details
                                        </Link>
                                        <button 
                                            type="button"
                                            onClick={() => deleteBatch(batch._id)} 
                                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isCreateModalOpen && (
                <CreateBatchForm
                    batchData={editingBatch || { farmer: "", farmerId: customerId }}
                    onSuccess={() => { setIsCreateModalOpen(false); onBatchUpdate(); }}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}
        </div>
    );
};

// --- Main CustomerDetails Component ---
const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const CUSTOMER_API_URL = `${API_BASE_URL}/api/customers`;

    const [customer, setCustomer] = useState(null);
    const [customerBatches, setCustomerBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [salesKey, setSalesKey] = useState(Date.now());

    const fetchCustomerDetails = useCallback(async () => {
        setError(null);
        try {
            const res = await axios.get(`${CUSTOMER_API_URL}/${id}`);
            setCustomer(res.data?.data || null);
        } catch (err) {
            console.error("Fetch Customer Details Error:", err);
            setError("Failed to fetch customer profile.");
            toast.error("Error retrieving customer details.");
        }
    }, [CUSTOMER_API_URL, id]);

    const fetchBatchesByCustomerId = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/batches/customer-farming-batches/${id}`);
            setCustomerBatches(res.data?.batches || res.data?.data || []);
        } catch (err) {
            console.error("Fetch Batches Error:", err);
            setCustomerBatches([]);
        }
    }, [id]);

    useEffect(() => {
        if (!id) {
            setError("Customer ID not provided.");
            setIsLoading(false);
            return;
        }

        const loadAll = async () => {
            setIsLoading(true);
            await Promise.all([fetchCustomerDetails(), fetchBatchesByCustomerId()]);
            setIsLoading(false);
        };
        loadAll();
    }, [id, fetchCustomerDetails, fetchBatchesByCustomerId]);

    const handleDelete = async () => {
        if (!customer) return;
        if (!window.confirm(`Are you sure you want to permanently delete "${customer.name}"?`)) return;

        try {
            await axios.delete(`${CUSTOMER_API_URL}/${id}`);
            toast.success(`Customer "${customer.name}" deleted.`);
            navigate('/customers');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete customer.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center gap-2 p-16 font-bold text-blue-600">
                <Users className="w-5 h-5 animate-spin" /> Loading Customer Details...
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="mx-auto p-8 max-w-xl font-sans">
                <div className="bg-rose-50 p-6 border border-rose-200 rounded-2xl text-rose-700">
                    <p className="font-bold text-base">Error Loading Customer</p>
                    <p className="mt-1 text-rose-600 text-xs">{error || "Customer not found."}</p>
                    <button 
                        type="button"
                        onClick={() => navigate('/customers')}
                        className="bg-rose-600 hover:bg-rose-700 mt-4 px-4 py-2 rounded-xl font-bold text-white text-xs transition"
                    >
                        Return to Ledger
                    </button>
                </div>
            </div>
        );
    }

    const totalDue = (Number(customer.manual_due) || 0) + (Number(customer.due) || 0);
    const totalAdv = (Number(customer.manual_advance) || 0) + (Number(customer.advance) || 0);
    const netReceivable = totalDue - totalAdv;

    return (
        <div className="space-y-6 bg-slate-50 p-4 md:p-6 min-h-screen font-sans text-slate-700">
            <div className="space-y-6 mx-auto max-w-7xl">
                
                {/* Top Header Card */}
                <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 bg-slate-900 p-5 rounded-2xl shadow-sm text-white">
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => navigate('/customers')} 
                            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-slate-300 transition"
                            title="Back to Customers"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="bg-blue-600/20 p-3 border border-blue-500/30 rounded-xl text-blue-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-white text-xl tracking-tight">{customer.name}</h1>
                                <span className="bg-slate-800 px-2 py-0.5 border border-slate-700 rounded-full font-bold text-[10px] text-slate-300 uppercase">
                                    {customer.type}
                                </span>
                            </div>
                            <p className="mt-0.5 text-slate-400 text-xs">Account ID: {customer._id}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 shadow-md px-4 py-2 rounded-xl font-bold text-white text-xs transition"
                        >
                            <span>💰</span> Receive Due Payment
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 border border-slate-700 rounded-xl font-bold text-slate-200 text-xs transition"
                        >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-600 px-3.5 py-2 border border-slate-700 rounded-xl font-bold text-slate-300 hover:text-white text-xs transition"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                </div>

                {/* Financial Position Cards */}
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-4 bg-white shadow-sm p-5 border border-slate-200 rounded-2xl">
                        <div className="bg-rose-50 p-3 border border-rose-100 rounded-xl text-rose-600"><Calculator className="w-6 h-6" /></div>
                        <div>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Gross Due</p>
                            <p className="font-black font-mono text-2xl text-slate-900">{formatCurrency(totalDue)}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">System: ৳{(customer.due || 0).toFixed(2)} | Manual: ৳{(customer.manual_due || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white shadow-sm p-5 border border-slate-200 rounded-2xl">
                        <div className="bg-emerald-50 p-3 border border-emerald-100 rounded-xl text-emerald-600"><Wallet className="w-6 h-6" /></div>
                        <div>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Gross Advance</p>
                            <p className="font-black font-mono text-2xl text-emerald-700">{formatCurrency(totalAdv)}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">System: ৳{(customer.advance || 0).toFixed(2)} | Manual: ৳{(customer.manual_advance || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white shadow-sm p-5 border border-slate-200 rounded-2xl">
                        <div className="bg-blue-50 p-3 border border-blue-100 rounded-xl text-blue-600"><ShoppingBag className="w-6 h-6" /></div>
                        <div>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Lifetime Billing</p>
                            <p className="font-black font-mono text-2xl text-blue-700">{formatCurrency(customer.total_sales || 0)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white shadow-sm p-5 border border-slate-200 rounded-2xl">
                        <div className={`p-3 rounded-xl border ${netReceivable >= 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                            <span className="font-bold font-mono text-xl">৳</span>
                        </div>
                        <div>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Net Balance</p>
                            <p className={`text-2xl font-black font-mono ${netReceivable >= 0 ? "text-rose-600" : "text-emerald-700"}`}>
                                {formatCurrency(Math.abs(netReceivable))}
                            </p>
                            <p className="mt-0.5 font-bold text-[10px] text-slate-400 uppercase">{netReceivable >= 0 ? "Receivable Due" : "Advance Deposit"}</p>
                        </div>
                    </div>
                </div>

                {/* Account Details Box */}
                <div className="space-y-4 bg-white shadow-sm p-6 border border-slate-200 rounded-2xl">
                    <h2 className="pb-2 border-slate-100 border-b font-bold text-slate-400 text-sm uppercase tracking-wider">
                        Profile & Contact Specifications
                    </h2>
                    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-xs">
                        <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl">
                            <span className="block font-bold text-slate-400 uppercase">Phone Number</span>
                            <span className="block mt-0.5 font-bold text-slate-900 text-sm">{customer.phone || 'N/A'}</span>
                        </div>
                        <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl">
                            <span className="block font-bold text-slate-400 uppercase">Location / Address</span>
                            <span className="block mt-0.5 font-bold text-slate-900 text-sm">{customer.address || 'N/A'}</span>
                        </div>
                        <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl">
                            <span className="block font-bold text-slate-400 uppercase">Registered Date</span>
                            <span className="block mt-0.5 font-bold text-slate-900 text-sm">
                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl">
                            <span className="block font-bold text-slate-400 uppercase">Account Status</span>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                customer.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                                {customer.status || 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Customer Batches List */}
                <CustomerBatchList 
                    batches={customerBatches} 
                    customerId={id}
                    onBatchUpdate={fetchBatchesByCustomerId}
                />

                {/* Customer Sales Invoice History */}
                <UniversalSalesManager
                    key={salesKey}
                    context="customer"
                    title={`Sales Invoices for ${customer.name}`}
                    fetchUrl={`${API_BASE_URL}/api/sales?customer_id=${customer._id}`}
                />

                {/* Modals */}
                <ReceiveDueManuallyModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    customerId={customer._id}
                    customerName={customer.name}
                    onPaymentSuccess={() => {
                        fetchCustomerDetails();
                        setSalesKey(Date.now());
                    }}
                />

                <CustomerFormModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    form={customer}
                    editingId={customer._id}
                    isLoading={false}
                    error={null}
                    handleChange={(e) => {
                        const { name, value, type } = e.target;
                        setCustomer(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
                    }}
                    handleSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            await axios.put(`${CUSTOMER_API_URL}/${id}`, customer);
                            toast.success("Customer profile updated!");
                            setIsEditModalOpen(false);
                            fetchCustomerDetails();
                        } catch (err) {
                            toast.error(err.response?.data?.message || "Failed to update customer.");
                        }
                    }}
                    resetForm={() => setIsEditModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default CustomerDetails;