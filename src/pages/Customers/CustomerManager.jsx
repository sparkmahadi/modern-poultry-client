import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import CustomerFormModal from "./CustomerFormModal";
import { 
    Trash2, 
    Edit3, 
    Eye, 
    User, 
    Phone, 
    MapPin, 
    Plus, 
    Calculator, 
    Wallet, 
    ArrowUpRight, 
    Search, 
    RefreshCw, 
    Users,
    Truck,
    Store
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

const getBalanceStyle = (net) => {
    if (net > 0) return { className: 'text-rose-600 font-mono font-bold', label: `৳${net.toFixed(2)}`, status: 'Receivable' };
    if (net < 0) return { className: 'text-emerald-600 font-mono font-bold', label: `৳${Math.abs(net).toFixed(2)}`, status: 'Payable / Adv' };
    return { className: 'text-slate-400 font-mono font-medium', label: '৳0.00', status: 'Settled' };
};

const getTypeBadge = (type) => {
    switch (type) {
        case 'distributor':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase"><Truck className="w-3 h-3" /> Distributor</span>;
        case 'sales_center':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase"><Store className="w-3 h-3" /> Sales Center</span>;
        case 'temporary':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">Retail</span>;
        default:
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase"><User className="w-3 h-3" /> Farmer</span>;
    }
};

const CustomerListTable = ({ customers, handleEdit, handleDelete, isLoading }) => {
    const grand = useMemo(() => {
        return customers.reduce((acc, c) => ({
            sDue: acc.sDue + (Number(c.due) || 0),
            sAdv: acc.sAdv + (Number(c.advance) || 0),
            mDue: acc.mDue + (Number(c.manual_due) || 0),
            mAdv: acc.mAdv + (Number(c.manual_advance) || 0),
        }), { sDue: 0, sAdv: 0, mDue: 0, mAdv: 0 });
    }, [customers]);

    const netAggregate = (grand.sDue + grand.mDue) - (grand.sAdv + grand.mAdv);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                            <th colSpan="3" className="px-4 py-2 border-r border-slate-200">Account Identity</th>
                            <th colSpan="2" className="px-4 py-2 border-r border-slate-200 bg-slate-50/50">System Ledger</th>
                            <th colSpan="2" className="px-4 py-2 border-r border-slate-200 bg-blue-50/20 text-blue-700">Manual Opening</th>
                            <th colSpan="3" className="px-4 py-2 bg-indigo-50/40 text-indigo-900 font-black">Net Position</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                            <th className="px-4 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3">Customer / Party Name</th>
                            <th className="px-4 py-3 border-r border-slate-200 text-center w-36">Type</th>
                            
                            <th className="px-4 py-3 text-right bg-slate-50/30">S. Due (৳)</th>
                            <th className="px-4 py-3 text-right border-r border-slate-200 bg-slate-50/30">S. Adv (৳)</th>
                            
                            <th className="px-4 py-3 text-right bg-blue-50/10 text-blue-700">M. Due (৳)</th>
                            <th className="px-4 py-3 text-right border-r border-slate-200 bg-blue-50/10 text-blue-700">M. Adv (৳)</th>
                            
                            <th className="px-4 py-3 text-right bg-indigo-50/20 font-bold text-slate-700">Total Due</th>
                            <th className="px-4 py-3 text-right bg-indigo-50/20 font-bold text-emerald-700">Total Adv</th>
                            <th className="px-4 py-3 text-right bg-indigo-50/30 text-indigo-950 font-black">Net Balance</th>
                            
                            <th className="px-4 py-3 text-center w-28">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading && customers.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="text-center py-16 text-slate-400 font-medium italic text-xs">
                                    Loading customer ledger records...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="text-center py-16 text-slate-400 font-medium italic text-xs">
                                    No customer records matching this criteria.
                                </td>
                            </tr>
                        ) : (
                            customers.map((c, index) => {
                                const rowPayable = (Number(c.due) || 0) + (Number(c.manual_due) || 0);
                                const rowPaid = (Number(c.advance) || 0) + (Number(c.manual_advance) || 0);
                                const netBalance = rowPayable - rowPaid;
                                const balanceStyle = getBalanceStyle(netBalance);

                                return (
                                    <tr key={c._id || index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3.5 text-center text-xs text-slate-400 font-semibold">{index + 1}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-col">
                                                <Link 
                                                    to={`/customers/${c._id}`} 
                                                    className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm"
                                                >
                                                    {c.name}
                                                </Link>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-normal">
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {c.phone || "No phone"}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {c.address || "N/A"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center border-r border-slate-200">
                                            {getTypeBadge(c.type)}
                                        </td>
                                        
                                        {/* System */}
                                        <td className="px-4 py-3.5 text-right font-mono text-slate-600">৳{(Number(c.due) || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600 border-r border-slate-200">৳{(Number(c.advance) || 0).toFixed(2)}</td>
                                        
                                        {/* Manual */}
                                        <td className="px-4 py-3.5 text-right font-mono text-blue-700 font-medium">৳{(Number(c.manual_due) || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600 font-medium border-r border-slate-200">৳{(Number(c.manual_advance) || 0).toFixed(2)}</td>
                                        
                                        {/* Aggregated Row Data */}
                                        <td className="px-4 py-3.5 text-right bg-indigo-50/10 font-mono font-bold text-slate-900">৳{rowPayable.toFixed(2)}</td>
                                        <td className="px-4 py-3.5 text-right bg-indigo-50/10 font-mono font-bold text-emerald-600">৳{rowPaid.toFixed(2)}</td>
                                        
                                        <td className="px-4 py-3.5 text-right bg-indigo-50/20">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm ${balanceStyle.className}`}>{balanceStyle.label}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">{balanceStyle.status}</span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex justify-center items-center gap-1">
                                                <Link 
                                                    to={`/customers/${c._id}`} 
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEdit(c)} 
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" 
                                                    title="Edit Record"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(c._id)} 
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" 
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Master Summary Footer */}
            <div className="bg-slate-900 text-white p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 md:border-r border-slate-800">
                    <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30"><Calculator className="w-5 h-5" /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Portfolio Position</p>
                        <p className={`text-xl font-black font-mono ${netAggregate >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                            ৳{Math.abs(netAggregate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-slate-400 ml-1.5">
                                {netAggregate >= 0 ? "(Net Due)" : "(Net Advance)"}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="md:text-right md:border-r border-slate-800 md:pr-6">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total System Due</p>
                    <p className="text-lg font-bold font-mono text-slate-200">৳{grand.sDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="md:text-right md:border-r border-slate-800 md:pr-6">
                    <p className="text-[10px] uppercase font-bold text-blue-400">Total Manual Due</p>
                    <p className="text-lg font-bold font-mono text-blue-400">৳{grand.mDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="md:text-right">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Total Collections / Advance</p>
                    <p className="text-lg font-bold font-mono text-emerald-400">৳{(grand.sAdv + grand.mAdv).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
    );
};

const CustomerManager = () => {
    const initialFormState = {
        name: "", 
        address: "", 
        phone: "", 
        type: "permanent",
        due: 0, 
        advance: 0, 
        manual_due: 0, 
        manual_advance: 0,
        status: "active"
    };

    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [form, setForm] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(API_BASE_URL);
            setCustomers(res.data?.data || []);
        } catch (err) {
            setError("Failed to retrieve customer records.");
            toast.error("Error loading customer ledger.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchCustomers(); 
    }, [fetchCustomers]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? (value === "" ? 0 : Number(value)) : value 
        }));
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
                await axios.put(`${API_BASE_URL}/${editingId}`, form);
                toast.success("Customer record updated successfully!");
            } else { 
                await axios.post(API_BASE_URL, form);
                toast.success("New customer registered successfully!");
            }
            resetForm();
            fetchCustomers();
        } catch (err) {
            const msg = err.response?.data?.message || "Operation failed.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (customer) => {
        setForm({ 
            ...customer, 
            manual_due: Number(customer.manual_due) || 0, 
            manual_advance: Number(customer.manual_advance) || 0 
        });
        setEditingId(customer._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
        try { 
            await axios.delete(`${API_BASE_URL}/${id}`);
            toast.success("Customer removed successfully.");
            fetchCustomers(); 
        } catch (err) { 
            toast.error(err.response?.data?.message || "Delete operation failed."); 
        }
    };

    // Filter Logic
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch = !searchTerm.trim() || (
                (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            if (!matchesSearch) return false;

            if (filterType === 'all') return true;
            if (filterType === 'due') {
                const net = (Number(c.due) || 0) + (Number(c.manual_due) || 0) - (Number(c.advance) || 0) - (Number(c.manual_advance) || 0);
                return net > 0;
            }
            return c.type === filterType;
        });
    }, [customers, searchTerm, filterType]);

    // Header Metrics
    const metrics = useMemo(() => {
        const total = customers.length;
        const totalDue = customers.reduce((acc, c) => acc + (Number(c.due) || 0) + (Number(c.manual_due) || 0), 0);
        const totalAdvance = customers.reduce((acc, c) => acc + (Number(c.advance) || 0) + (Number(c.manual_advance) || 0), 0);
        const netReceivable = totalDue - totalAdvance;
        return { total, totalDue, totalAdvance, netReceivable };
    }, [customers]);

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-slate-700 space-y-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Top Toolbar Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Sales & Customer Ledger</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Manage wholesale distributors, sales centers, and contract farmers</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={fetchCustomers}
                            disabled={isLoading}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="Refresh List"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        <button 
                            type="button"
                            onClick={() => { resetForm(); setIsModalOpen(true); }} 
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
                        >
                            <Plus className="w-4 h-4" /> New Customer
                        </button>
                    </div>
                </div>

                {/* Financial KPI Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">{metrics.total.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><Calculator className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Due (All)</p>
                            <p className="text-2xl font-black font-mono text-slate-900">৳{metrics.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Advance</p>
                            <p className="text-2xl font-black font-mono text-emerald-700">৳{metrics.totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${metrics.netReceivable >= 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Position</p>
                            <p className={`text-2xl font-black font-mono ${metrics.netReceivable >= 0 ? "text-rose-600" : "text-emerald-700"}`}>
                                ৳{Math.abs(metrics.netReceivable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-fit">
                    {[
                        { key: "all", label: "All Parties" },
                        { key: "permanent", label: "Farmers" },
                        { key: "distributor", label: "Distributors" },
                        { key: "sales_center", label: "Sales Centers" },
                        { key: "due", label: "Outstanding Due" }
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilterType(key)}
                            className={`px-4 py-1.5 rounded-lg capitalize transition-all ${
                                filterType === key ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Main Table */}
                <CustomerListTable 
                    customers={filteredCustomers} 
                    handleEdit={handleEdit} 
                    handleDelete={handleDelete} 
                    isLoading={isLoading} 
                />

                {/* Modal */}
                <CustomerFormModal 
                    isOpen={isModalOpen} 
                    onClose={resetForm} 
                    form={form} 
                    editingId={editingId} 
                    isLoading={isLoading} 
                    error={error} 
                    handleChange={handleChange} 
                    handleSubmit={handleSubmit} 
                    resetForm={resetForm} 
                />
            </div>
        </div>
    );
};

export default CustomerManager;