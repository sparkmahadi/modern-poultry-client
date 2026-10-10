import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import {
    MapPin,
    Phone,
    Building2,
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertTriangle,
    Calendar,
    Edit3,
    Trash2,
    ArrowLeft,
    CheckCircle2,
    Calculator,
    Wallet
} from 'lucide-react';
import UniversalPurchaseManager from '../Purchase/UniversalPurchaseManager';
import PayDueManuallyModal from './PayDueManuallyModal';
import SupplierAddEditModal from './SupplierAddEditModal';
import { format } from 'date-fns';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/suppliers`;

const formatBalance = (due, advance) => {
    const d = Number(due) || 0;
    const a = Number(advance) || 0;
    const balance = d - a;
    const absBalance = Math.abs(balance).toFixed(2);

    if (balance > 0) return { label: `৳${absBalance} Payable`, className: 'text-rose-600 bg-rose-50/60 border-rose-200', icon: ArrowUpCircle };
    if (balance < 0) return { label: `৳${absBalance} Receivable`, className: 'text-emerald-600 bg-emerald-50/60 border-emerald-200', icon: ArrowDownCircle };
    return { label: 'Settled ৳0.00', className: 'text-slate-500 bg-slate-50 border-slate-200', icon: DollarSign };
};

const DetailBlock = ({ label, value, className = "" }) => (
    <div className={`p-3.5 bg-slate-50 border border-slate-200 rounded-xl ${className}`}>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-base font-bold text-slate-800 break-words mt-1">{value || 'N/A'}</p>
    </div>
);

const SupplierDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        address: "",
        phone: "",
        type: "regular",
        manual_due: 0,
        manual_advance: 0,
        status: "active"
    });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // Key to trigger purchase history reload without page refresh
    const [historyKey, setHistoryKey] = useState(Date.now());

    const fetchSupplierDetails = useCallback(async () => {
        if (!id) {
            setError("Supplier ID is missing from URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/${id}`);
            const sup = res.data?.data || res.data;
            setSupplier(sup);
            setEditForm({
                name: sup.name || "",
                address: sup.address || "",
                phone: sup.phone || "",
                type: sup.type || "regular",
                manual_due: Number(sup.manual_due) || 0,
                manual_advance: Number(sup.manual_advance) || 0,
                status: sup.status || "active"
            });
        } catch (err) {
            console.error("Fetch supplier error:", err);
            if (err.response?.status === 404) setError(`Supplier with ID "${id}" was not found.`);
            else setError("Failed to fetch supplier details.");
            toast.error("Could not load supplier information.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchSupplierDetails();
    }, [fetchSupplierDetails]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingEdit(true);
        try {
            await axios.put(`${API_BASE_URL}/${id}`, editForm);
            toast.success("Supplier details updated!");
            setIsEditModalOpen(false);
            fetchSupplierDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update supplier.");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/${id}`);
            toast.success("Supplier deleted successfully.");
            navigate('/suppliers');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete supplier.");
        }
    };

    if (isLoading) {
        return (
            <div className="p-16 text-center text-blue-600 font-bold flex items-center justify-center gap-2">
                <Building2 className="w-5 h-5 animate-spin" /> Synchronizing Supplier Profile...
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="p-8 max-w-xl mx-auto font-sans">
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 font-bold text-base">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <span>Error Loading Profile</span>
                    </div>
                    <p className="text-xs text-rose-600 mt-2">{error || "Supplier not found."}</p>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const totalDue = (Number(supplier.manual_due) || 0) + (Number(supplier.due) || 0);
    const totalAdv = (Number(supplier.manual_advance) || 0) + (Number(supplier.advance) || 0);
    const balanceInfo = formatBalance(totalDue, totalAdv);
    const netBalance = totalDue - totalAdv;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-slate-700 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Header Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition"
                            title="Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-white">{supplier.name}</h1>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    supplier.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                    {supplier.status || 'Active'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Supplier ID: {supplier._id}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                        >
                            <span>💰</span> Settle Due (FIFO)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                </div>

                {/* Financial Health Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100"><Calculator className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payable (Due)</p>
                            <p className="text-2xl font-black font-mono text-slate-900">৳{totalDue.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Manual: ৳{(Number(supplier.manual_due) || 0).toFixed(2)} | System: ৳{(Number(supplier.due) || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100"><Wallet className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Advance (Paid Out)</p>
                            <p className="text-2xl font-black font-mono text-emerald-700">৳{totalAdv.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Manual: ৳{(Number(supplier.manual_advance) || 0).toFixed(2)} | System: ৳{(Number(supplier.advance) || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl border-2 shadow-sm flex items-center justify-between ${balanceInfo.className}`}>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Ledger Status</p>
                            <p className="text-2xl font-black font-mono mt-1">{balanceInfo.label}</p>
                            <p className="text-[11px] font-bold uppercase mt-0.5">{netBalance >= 0 ? "Outstanding Debt" : "Credit Balance"}</p>
                        </div>
                        <balanceInfo.icon className="w-8 h-8 opacity-80" />
                    </div>
                </div>

                {/* Profile Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                            Contact & Location
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DetailBlock label="Phone Number" value={supplier.phone || 'N/A'} />
                            <DetailBlock label="Supplier Type" value={(supplier.type || 'regular').toUpperCase()} />
                            <div className="sm:col-span-2">
                                <DetailBlock label="Office / Depot Address" value={supplier.address || 'N/A'} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                            Account Metadata & Purchases
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DetailBlock 
                                label="Created Date" 
                                value={supplier.createdAt ? format(new Date(supplier.createdAt), "dd MMM yyyy") : 'N/A'} 
                            />
                            <DetailBlock 
                                label="Last Purchase" 
                                value={supplier.last_purchase_date ? format(new Date(supplier.last_purchase_date), "dd MMM yyyy, hh:mm a") : 'No orders yet'} 
                            />
                            <div className="sm:col-span-2">
                                <DetailBlock 
                                    label="Total Purchases Tracked" 
                                    value={`৳${(Number(supplier.total_purchase) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Paginated Purchase History for this Supplier */}
                <UniversalPurchaseManager
                    key={historyKey}
                    context="supplier"
                    title={`Orders from ${supplier.name}`}
                    fetchUrl={`${import.meta.env.VITE_API_BASE_URL}/api/purchases?supplier_id=${supplier._id}`}
                />

                {/* FIFO Payment Modal */}
                <PayDueManuallyModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    supplierId={supplier._id}
                    supplierName={supplier.name}
                    onPaymentSuccess={() => {
                        fetchSupplierDetails();
                        setHistoryKey(Date.now()); // Re-triggers purchase order sync without page reload
                    }}
                />

                {/* Inline Edit Modal */}
                <SupplierAddEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title={`Edit ${supplier.name}`}
                >
                    <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                        <div>
                            <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Company / Supplier Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Type</label>
                                <select
                                    value={editForm.type}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white"
                                >
                                    <option value="regular">Regular</option>
                                    <option value="corporate">Corporate</option>
                                    <option value="occasional">Occasional</option>
                                    <option value="international">International</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Address</label>
                            <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white"
                            />
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-200 pb-1">
                                Manual Opening Ledger Adjustments
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Payable (৳ Due)</label>
                                    <input
                                        type="number"
                                        value={editForm.manual_due}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, manual_due: Number(e.target.value) || 0 }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Advance (৳ Deposit)</label>
                                    <input
                                        type="number"
                                        value={editForm.manual_advance}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, manual_advance: Number(e.target.value) || 0 }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                                disabled={isSubmittingEdit}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingEdit}
                                className="flex-1 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {isSubmittingEdit ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </SupplierAddEditModal>
            </div>
        </div>
    );
};

export default SupplierDetails;