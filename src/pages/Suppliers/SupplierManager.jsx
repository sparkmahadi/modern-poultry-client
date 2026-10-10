import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { 
    Search, 
    Plus, 
    Edit3, 
    Trash2, 
    User, 
    Phone, 
    MapPin, 
    Calculator, 
    Wallet, 
    ArrowUpRight, 
    RefreshCw,
    Building2
} from 'lucide-react';
import SupplierAddEditModal from "./SupplierAddEditModal";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
            name={name}
            type={type}
            value={value ?? ""}
            onChange={onChange}
            placeholder={placeholder}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            required={required}
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</label>
        <select
            name={name}
            value={value ?? ""}
            onChange={onChange}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const SupplierManager = () => {
    const navigate = useNavigate();

    const initialFormState = {
        name: "",
        address: "",
        phone: "",
        type: "regular",
        manual_due: 0,
        manual_advance: 0,
        status: "active",
    };

    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/suppliers`);
            setSuppliers(res.data?.data || []);
        } catch (err) {
            console.error("Fetch suppliers error:", err);
            setError("Failed to fetch suppliers from server.");
            toast.error("Error loading suppliers list.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? (value === "" ? 0 : Number(value)) : value;
        setForm(prev => ({ ...prev, [name]: newValue }));
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/suppliers/${editingId}`, form);
                toast.success("Supplier details updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/api/suppliers`, form);
                toast.success("New supplier registered successfully!");
            }
            resetForm();
            fetchSuppliers();
        } catch (err) {
            console.error("Save supplier error:", err);
            const msg = err.response?.data?.message || `Failed to ${editingId ? 'update' : 'add'} supplier.`;
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (supplier) => {
        setForm({
            name: supplier.name || "",
            address: supplier.address || "",
            phone: supplier.phone || "",
            type: supplier.type || "regular",
            manual_due: Number(supplier.manual_due) || 0,
            manual_advance: Number(supplier.manual_advance) || 0,
            status: supplier.status || "active",
        });
        setEditingId(supplier._id);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/suppliers/${id}`);
            toast.success("Supplier removed successfully.");
            fetchSuppliers();
        } catch (err) {
            console.error("Delete supplier error:", err);
            toast.error(err.response?.data?.message || "Failed to delete supplier.");
        }
    };

    const getStatusBadge = (status) => {
        const isActive = status === 'active';
        return (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
                {status || 'active'}
            </span>
        );
    };

    const getBalanceStyle = (due, advance) => {
        const balance = (Number(due) || 0) - (Number(advance) || 0);
        if (balance > 0) return { className: 'text-rose-600 font-bold font-mono', label: `৳${balance.toFixed(2)}`, sub: 'Payable' };
        if (balance < 0) return { className: 'text-emerald-600 font-bold font-mono', label: `৳${Math.abs(balance).toFixed(2)}`, sub: 'Receivable' };
        return { className: 'text-slate-400 font-medium font-mono', label: '৳0.00', sub: 'Settled' };
    };

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm.trim()) return suppliers;
        const q = searchTerm.toLowerCase();
        return suppliers.filter(supplier => (
            (supplier.name && supplier.name.toLowerCase().includes(q)) ||
            (supplier.phone && supplier.phone.toLowerCase().includes(q)) ||
            (supplier.address && supplier.address.toLowerCase().includes(q)) ||
            (supplier.type && supplier.type.toLowerCase().includes(q))
        ));
    }, [suppliers, searchTerm]);

    // Safe KPI Calculations
    const { totalDue, totalAdvance, netBalance } = useMemo(() => {
        return filteredSuppliers.reduce((acc, sup) => {
            const mDue = Number(sup?.manual_due) || 0;
            const mAdv = Number(sup?.manual_advance) || 0;
            const sDue = Number(sup?.due) || 0;
            const sAdv = Number(sup?.advance) || 0;

            const tDue = mDue + sDue;
            const tAdv = mAdv + sAdv;

            return {
                totalDue: acc.totalDue + tDue,
                totalAdvance: acc.totalAdvance + tAdv,
                netBalance: acc.netBalance + (tDue - tAdv)
            };
        }, { totalDue: 0, totalAdvance: 0, netBalance: 0 });
    }, [filteredSuppliers]);

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-slate-700">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Top Header Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Supplier Directory</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Manage vendor accounts, ledger balances, and purchase profiles.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search suppliers by name, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={fetchSuppliers}
                            disabled={isLoading}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
                        >
                            <Plus className="w-4 h-4" /> Add Supplier
                        </button>
                    </div>
                </div>

                {/* KPI Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100"><Calculator className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Payable (Due)</p>
                            <p className="text-2xl font-black font-mono text-slate-900">৳{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100"><Wallet className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Advance (Deposits)</p>
                            <p className="text-2xl font-black font-mono text-emerald-700">৳{totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${netBalance >= 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Portfolio Balance</p>
                            <p className={`text-2xl font-black font-mono ${netBalance >= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                ৳{Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-xs font-semibold text-slate-400 ml-1.5 uppercase">
                                    {netBalance >= 0 ? 'Net Payable' : 'Net Receivable'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                {/* Main Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                                    <th className="px-5 py-3.5">Supplier Identity</th>
                                    <th className="px-5 py-3.5 text-center">Type</th>
                                    <th className="px-4 py-3.5 text-right bg-rose-50/30">Manual (D / A)</th>
                                    <th className="px-4 py-3.5 text-right bg-blue-50/30">System (D / A)</th>
                                    <th className="px-4 py-3.5 text-right">Aggregated (D / A)</th>
                                    <th className="px-5 py-3.5 text-right">Net Balance</th>
                                    <th className="px-5 py-3.5 text-center">Last Purchase</th>
                                    <th className="px-5 py-3.5 text-center w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading && suppliers.length === 0 ? (
                                    <tr><td colSpan="9" className="text-center py-16 text-slate-400 italic text-xs">Loading supplier records...</td></tr>
                                ) : filteredSuppliers.length === 0 ? (
                                    <tr><td colSpan="9" className="text-center py-16 text-slate-400 italic text-xs">No matching suppliers found.</td></tr>
                                ) : filteredSuppliers.map((sup, index) => {
                                    const mDue = Number(sup?.manual_due) || 0;
                                    const mAdv = Number(sup?.manual_advance) || 0;
                                    const sDue = Number(sup?.due) || 0;
                                    const sAdv = Number(sup?.advance) || 0;

                                    const combinedDue = mDue + sDue;
                                    const combinedAdv = mAdv + sAdv;
                                    const balanceInfo = getBalanceStyle(combinedDue, combinedAdv);

                                    return (
                                        <tr key={sup?._id || index} className="hover:bg-slate-50/70 transition-colors group">
                                            <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-400">{index + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col">
                                                    <span 
                                                        onClick={() => navigate(`/suppliers/${sup?._id}`)}
                                                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                                                    >
                                                        {sup?.name}
                                                    </span>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {sup?.phone || 'N/A'}</span>
                                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {sup?.address || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-center">
                                                <div className="space-y-1">
                                                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600">
                                                        {sup?.type || 'regular'}
                                                    </span>
                                                    <div>{getStatusBadge(sup?.status)}</div>
                                                </div>
                                            </td>

                                            {/* Manual */}
                                            <td className="px-4 py-3.5 text-right bg-rose-50/10 font-mono">
                                                <div className="text-xs font-bold text-rose-700">৳{mDue.toFixed(2)}</div>
                                                <div className="text-[10px] text-emerald-600 font-medium">৳{mAdv.toFixed(2)}</div>
                                            </td>

                                            {/* System */}
                                            <td className="px-4 py-3.5 text-right bg-blue-50/10 font-mono">
                                                <div className="text-xs font-bold text-blue-700">৳{sDue.toFixed(2)}</div>
                                                <div className="text-[10px] text-emerald-600 font-medium">৳{sAdv.toFixed(2)}</div>
                                            </td>

                                            {/* Aggregated */}
                                            <td className="px-4 py-3.5 text-right font-mono">
                                                <div className="text-xs font-black text-slate-900">৳{combinedDue.toFixed(2)}</div>
                                                <div className="text-[10px] text-emerald-600 font-bold">৳{combinedAdv.toFixed(2)}</div>
                                            </td>

                                            {/* Net Balance */}
                                            <td className="px-5 py-3.5 text-right">
                                                <div className={`text-sm ${balanceInfo.className}`}>{balanceInfo.label}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{balanceInfo.sub}</div>
                                            </td>

                                            {/* Last Purchase Date */}
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                                                    {sup?.last_purchase_date ? (
                                                        format(new Date(sup.last_purchase_date), "dd MMM yyyy")
                                                    ) : '—'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex justify-center items-center gap-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => navigate(`/suppliers/${sup?._id}`)} 
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                        title="View Profile & Orders"
                                                    >
                                                        <User className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleEdit(sup)} 
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" 
                                                        title="Edit Supplier"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDelete(sup?._id)} 
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" 
                                                        title="Delete Supplier"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Registration / Edit Modal */}
            <SupplierAddEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Supplier Record" : "Register New Supplier"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField 
                        label="Supplier / Company Name" 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        placeholder="e.g., Aftab Feed Mills Ltd." 
                        required 
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField 
                            label="Primary Phone" 
                            name="phone" 
                            value={form.phone} 
                            onChange={handleChange} 
                            placeholder="01xxxxxxxxx" 
                        />
                        <SelectField 
                            label="Supplier Type" 
                            name="type" 
                            value={form.type} 
                            onChange={handleChange} 
                            options={[
                                { value: "regular", label: "Regular Vendor" },
                                { value: "corporate", label: "Corporate / Mill" },
                                { value: "occasional", label: "Occasional Vendor" },
                                { value: "international", label: "International Import" },
                            ]} 
                        />
                    </div>
                    
                    <InputField 
                        label="Office / Depot Address" 
                        name="address" 
                        value={form.address} 
                        onChange={handleChange} 
                        placeholder="Factory depot or office address" 
                    />

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
                            Manual Ledger Adjustments (Opening Balance)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField 
                                label="Opening Payable (৳ Due)" 
                                name="manual_due" 
                                type="number" 
                                value={form.manual_due} 
                                onChange={handleChange} 
                            />
                            <InputField 
                                label="Opening Advance (৳ Deposit)" 
                                name="manual_advance" 
                                type="number" 
                                value={form.manual_advance} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>

                    <SelectField 
                        label="Account Status" 
                        name="status" 
                        value={form.status} 
                        onChange={handleChange} 
                        options={[
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive / On-Hold" },
                        ]} 
                    />

                    <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                        <button 
                            type="button" 
                            onClick={resetForm} 
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="flex-1 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : editingId ? "Save Changes" : "Confirm Registration"}
                        </button>
                    </div>
                </form>
            </SupplierAddEditModal>
        </div>
    );
};

export default SupplierManager;