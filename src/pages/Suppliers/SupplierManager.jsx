import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { Search, Plus, Edit, Trash2, Info, User, Phone, MapPin, Calculator, Wallet, ArrowUpRight } from 'lucide-react';
import SupplierAddEditModal from "./SupplierAddEditModal";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==========================================
// 2. Helper Components (Simplified/Unchanged)
// ==========================================

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition duration-150"
            required={required}
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition duration-150"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);


// ==========================================
// 3. Main Component: SupplierManager
// ==========================================
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

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/suppliers`);
            setSuppliers(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch suppliers.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;
        setForm({ ...form, [name]: newValue });
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
            } else {
                await axios.post(`${API_BASE_URL}/api/suppliers`, form);
            }
            resetForm();
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            setError(`Failed to ${editingId ? 'update' : 'add'} supplier.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (supplier) => {
        setForm(supplier);
        setEditingId(supplier._id);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/suppliers/${id}`);
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            alert("Failed to delete supplier.");
        }
    };

    const getStatusBadge = (status) => {
        const color = status === 'active' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
        return <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${color}`}>{status}</span>;
    };

    const getBalanceStyle = (due, advance) => {
        const balance = due - advance;
        if (balance > 0) return { className: 'text-rose-600 font-bold', label: `৳${balance?.toFixed(2)}`, sub: 'Payable' };
        if (balance < 0) return { className: 'text-emerald-600 font-bold', label: `৳${Math.abs(balance)?.toFixed(2)}`, sub: 'Receivable' };
        return { className: 'text-slate-400 font-medium', label: '৳0.00', sub: 'Settled' };
    };

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return suppliers.filter(supplier => (
            supplier.name.toLowerCase().includes(lowerCaseSearch) ||
            supplier.phone.toLowerCase().includes(lowerCaseSearch) ||
            supplier.address.toLowerCase().includes(lowerCaseSearch) ||
            supplier.type.toLowerCase().includes(lowerCaseSearch)
        ));
    }, [suppliers, searchTerm]);

    const totalManualDue = filteredSuppliers.reduce((sum, sup) => sum + sup?.manual_due, 0);
    const totalManualAdvance = filteredSuppliers.reduce((sum, sup) => sum + sup?.manual_advance, 0);
    const totalSystemDue = filteredSuppliers.reduce((sum, sup) => sum + sup?.due, 0);
    const totalSystemAdvance = filteredSuppliers.reduce((sum, sup) => sum + sup?.advance, 0);
    const totalDue = totalManualDue + totalSystemDue;
    const totalAdvance = totalManualAdvance + totalSystemAdvance;
    const netBalance = totalDue - totalAdvance;

    return (
        <div className="p-4 md:p-6 bg-[#f8fafc] min-h-screen font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Supplier Directory</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage vendor accounts, outstanding balances, and purchase history.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" /> Add Supplier
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Calculator className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Payable</p>
                            <p className="text-xl font-black text-slate-800">৳{totalDue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Wallet className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Paid</p>
                            <p className="text-xl font-black text-slate-800">৳{totalAdvance.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 ring-2 ring-inset ${netBalance >= 0 ? 'ring-rose-100' : 'ring-emerald-100'}`}>
                        <div className={`p-3 rounded-xl ${netBalance >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><ArrowUpRight className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Portfolio Balance</p>
                            <p className={`text-xl font-black ${netBalance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>৳{Math.abs(netBalance).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Main Table Area */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-bold tracking-widest">
                                    <th className="px-6 py-4 w-12 text-center">#</th>
                                    <th className="px-6 py-4">Supplier Identity</th>
                                    <th className="px-6 py-4">Catalog</th>
                                    <th className="px-4 py-4 text-right bg-rose-50/30">Manual (D/A)</th>
                                    <th className="px-4 py-4 text-right bg-blue-50/30">System (D/A)</th>
                                    <th className="px-4 py-4 text-right">Aggregated (D/A)</th>
                                    <th className="px-6 py-4 text-right">Net Balance</th>
                                    <th className="px-6 py-4 text-center">Last Purchase</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading && !suppliers?.length ? (
                                    <tr><td colSpan="9" className="text-center py-20 text-slate-400 italic">Fetching records...</td></tr>
                                ) : filteredSuppliers?.length === 0 ? (
                                    <tr><td colSpan="9" className="text-center py-20 text-slate-400">No matching supplier records found.</td></tr>
                                ) : filteredSuppliers?.map((sup, index) => {
                                    const combinedDue = parseFloat(sup?.manual_due) + parseFloat(sup?.due);
                                    const combinedAdv = parseFloat(sup?.manual_advance) + parseFloat(sup?.advance);
                                    const balanceInfo = getBalanceStyle(combinedDue, combinedAdv);

                                    return (
                                        <tr key={sup?._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{sup?.name}</span>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium"><Phone className="w-3 h-3" /> {sup?.phone || 'N/A'}</span>
                                                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium"><MapPin className="w-3 h-3" /> {sup?.address || 'Global'}</span>
                                                    </div>
                                                    <div className="mt-2">{getStatusBadge(sup?.status)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold">
                                                    <Info className="w-3.5 h-3.5" /> View Products
                                                </button>
                                            </td>
                                            {/* Manual */}
                                            <td className="px-4 py-4 text-right bg-rose-50/20">
                                                <div className="text-xs font-bold text-rose-700">৳{sup?.manual_due?.toFixed(2)}</div>
                                                <div className="text-[10px] text-emerald-600 font-medium">৳{sup?.manual_advance?.toFixed(2)}</div>
                                            </td>
                                            {/* System */}
                                            <td className="px-4 py-4 text-right bg-blue-50/20">
                                                <div className="text-xs font-bold text-blue-700">৳{sup?.due?.toFixed(2)}</div>
                                                <div className="text-[10px] text-emerald-600 font-medium">৳{sup?.advance?.toFixed(2)}</div>
                                            </td>
                                            {/* Aggregated */}
                                            <td className="px-4 py-4 text-right">
                                                <div className="text-xs font-black text-slate-700">৳{combinedDue?.toFixed(2)}</div>
                                                <div className="text-[10px] text-emerald-600 font-bold">৳{combinedAdv?.toFixed(2)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`text-sm ${balanceInfo.className}`}>{balanceInfo.label}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{balanceInfo.sub}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[11px] font-bold italic">
                                                    {sup?.last_purchase_date ? format(sup?.last_purchase_date, "PPpp") : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center items-center gap-1">
                                                    <button onClick={() => navigate(`/suppliers/${sup?._id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Profile"><User className="w-4 h-4" /></button>
                                                    <button onClick={() => handleEdit(sup)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit Data"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(sup?._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Remove"><Trash2 className="w-4 h-4" /></button>
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

            {/* Modal - Kept exactly as instructed but rendering within current state */}
            <SupplierAddEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "✏️ Edit Supplier Record" : "➕ Register New Supplier"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Supplier/Company Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Acme Corp" required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Primary Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx" />
                        <SelectField label="Supplier Type" name="type" value={form.type} onChange={handleChange} options={[
                            { value: "regular", label: "Regular Vendor" },
                            { value: "onetime", label: "One-Time Vendor" },
                            { value: "international", label: "International Import" },
                        ]} />
                    </div>
                    <InputField label="Operational Address" name="address" value={form.address} onChange={handleChange} placeholder="City, State, Country" />

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Manual Ledger Adjustments</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Opening Payable (৳)" name="manual_due" type="number" value={form.manual_due} onChange={handleChange} />
                            <InputField label="Opening Receivable (৳)" name="manual_advance" type="number" value={form.manual_advance} onChange={handleChange} />
                        </div>
                    </div>

                    <SelectField label="Account Status" name="status" value={form.status} onChange={handleChange} options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "On-Hold" },
                    ]} />

                    <div className="flex gap-3 pt-4">
                        <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50">
                            {isLoading ? 'Processing...' : editingId ? "Save Changes" : "Confirm Registration"}
                        </button>
                        <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                            Cancel
                        </button>
                    </div>
                </form>
            </SupplierAddEditModal>
        </div>
    );
};

export default SupplierManager;