import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import CustomerFormModal from "./CustomerFormModal";
import { Trash2, Edit, Eye, User, Phone, TrendingUp, Plus, Calculator } from 'lucide-react';

// --- Helper Functions ---
const formatDate = (dateObject) => {
    if (!dateObject || !dateObject.$date) return 'N/A';
    return new Date(dateObject.$date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getBalanceStyle = (net) => {
    if (net > 0) return { className: 'text-rose-600 bg-rose-50 border-rose-100', label: `৳${net.toFixed(2)}`, status: 'Receivable' };
    if (net < 0) return { className: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: `৳${Math.abs(net).toFixed(2)}`, status: 'Payable' };
    return { className: 'text-slate-400 bg-slate-50 border-slate-100', label: '৳0.00', status: 'Settled' };
};

// --- Sub-Component: CustomerListTable ---
const CustomerListTable = ({ customers, handleEdit, handleDelete, isLoading }) => {
    // Grand Totals for Footer
    const grand = customers.reduce((acc, c) => ({
        sDue: acc.sDue + (c.due || 0),
        sAdv: acc.sAdv + (c.advance || 0),
        mDue: acc.mDue + (c.manual_due || 0),
        mAdv: acc.mAdv + (c.manual_advance || 0),
    }), { sDue: 0, sAdv: 0, mDue: 0, mAdv: 0 });

    if (isLoading) return <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Loading Ledger...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                            <th colSpan="3" className="px-4 py-2 border-r border-slate-200">Customer Info</th>
                            <th colSpan="2" className="px-4 py-2 border-r border-slate-200 bg-slate-50/50">System Entry</th>
                            <th colSpan="2" className="px-4 py-2 border-r border-slate-200 bg-blue-50/30 text-blue-600">Manual Entry</th>
                            <th colSpan="3" className="px-4 py-2 bg-indigo-50 text-indigo-700">Aggregated Totals (Net)</th>
                        </tr>
                        <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                            <th className="px-4 py-4 text-center">SL</th>
                            <th className="px-4 py-4">Customer Name</th>
                            <th className="px-4 py-4 border-r border-slate-100">Type</th>
                            {/* System */}
                            <th className="px-4 py-4 text-right bg-slate-50/30">S. Due</th>
                            <th className="px-4 py-4 text-right border-r border-slate-200 bg-slate-50/30">S. Adv</th>
                            {/* Manual */}
                            <th className="px-4 py-4 text-right bg-blue-50/20 text-blue-600">M. Due</th>
                            <th className="px-4 py-4 text-right border-r border-slate-200 bg-blue-50/20 text-blue-600">M. Adv</th>
                            {/* Aggregated */}
                            <th className="px-4 py-4 text-right bg-indigo-50/50 text-indigo-900 font-black">Total Payable</th>
                            <th className="px-4 py-4 text-right bg-indigo-50/50 text-indigo-900 font-black">Total Paid</th>
                            <th className="px-6 py-4 text-center bg-indigo-100/40 text-indigo-900 font-black">Final Balance</th>
                            {/* Meta */}
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customers.map((c, index) => {
                            const rowPayable = (c.due || 0) + (c.manual_due || 0);
                            const rowPaid = (c.advance || 0) + (c.manual_advance || 0);
                            const netBalance = rowPayable - rowPaid;
                            const balanceStyle = getBalanceStyle(netBalance);

                            return (
                                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4 text-center text-xs text-slate-400 font-bold">{index + 1}</td>
                                    <td className="px-4 py-4 font-bold text-slate-700">
                                        <div className="flex flex-col">
                                            <span>{c.name}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">{c.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 border-r border-slate-100">
                                        <span className="text-[10px] font-black uppercase text-slate-400">{c.type}</span>
                                    </td>
                                    {/* System */}
                                    <td className="px-4 py-4 text-right text-slate-500">৳{(c.due || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 text-right text-slate-500 border-r border-slate-200">৳{(c.advance || 0).toFixed(2)}</td>
                                    {/* Manual */}
                                    <td className="px-4 py-4 text-right text-blue-500 font-medium">৳{(c.manual_due || 0).toFixed(2)}</td>
                                    <td className="px-4 py-4 text-right text-blue-500 font-medium border-r border-slate-200">৳{(c.manual_advance || 0).toFixed(2)}</td>
                                    {/* Aggregated Row Data */}
                                    <td className="px-4 py-4 text-right bg-indigo-50/20 font-bold text-slate-700">৳{rowPayable.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-right bg-indigo-50/20 font-bold text-emerald-600">৳{rowPaid.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right bg-indigo-50/30">
                                        <div className={`inline-flex flex-col items-end px-3 py-1 rounded-lg border w-full ${balanceStyle.className}`}>
                                            <span className="text-sm font-black">{balanceStyle.label}</span>
                                            <span className="text-[8px] uppercase font-bold opacity-70 tracking-tighter">{balanceStyle.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <Link to={c._id} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all"><Eye className="w-4 h-4" /></Link>
                                            <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-amber-600"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(c._id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Master Summary Footer */}
            <div className="bg-slate-800 text-white p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 border-r border-slate-700">
                    <div className="p-2 bg-indigo-600 rounded-lg"><Calculator className="w-5 h-5" /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Aggregate Position</p>
                        <p className="text-xl font-black">৳{( (grand.sDue + grand.mDue) - (grand.sAdv + grand.mAdv) ).toLocaleString()}</p>
                    </div>
                </div>
                <div className="text-right border-r border-slate-700 pr-6">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total System Due</p>
                    <p className="text-lg font-bold">৳{grand.sDue.toLocaleString()}</p>
                </div>
                <div className="text-right border-r border-slate-700 pr-6">
                    <p className="text-[10px] uppercase font-bold text-blue-400">Total Manual Due</p>
                    <p className="text-lg font-bold text-blue-400">৳{grand.mDue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Total Collections (All)</p>
                    <p className="text-lg font-bold text-emerald-400">৳{(grand.sAdv + grand.mAdv).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

// Main: CustomerManager Component (Logic remains exactly as provided)
const CustomerManager = () => {
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;
    const initialFormState = {
        name: "", address: "", phone: "", type: "permanent",
        due: 0, advance: 0, manual_due: 0, manual_advance: 0,
        status: "active", last_transaction_date: null, 
    };

    const [customers, setCustomers] = useState([]);
    const [form, setForm] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(API_BASE_URL);
            setCustomers(res.data.data || []);
        } catch (err) { setError("Data retrieval failed."); }
        finally { setIsLoading(false); }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm({ ...form, [name]: type === 'number' ? Number(value) : value });
    };

    const resetForm = () => {
        setForm(initialFormState);
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) { await axios.put(`${API_BASE_URL}/${editingId}`, form); }
            else { await axios.post(API_BASE_URL, form); }
            resetForm();
            fetchCustomers();
        } catch (err) { setError("Submit failed."); }
        finally { setIsLoading(false); }
    };

    const handleEdit = (customer) => {
        setForm({ ...customer, manual_due: customer.manual_due || 0, manual_advance: customer.manual_advance || 0 });
        setEditingId(customer._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete customer?")) return;
        try { await axios.delete(`${API_BASE_URL}/${id}`); fetchCustomers(); }
        catch (err) { alert("Delete failed."); }
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl"><User className="w-6 h-6 text-white" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Accounts Ledger</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Financial Aggregation</p>
                        </div>
                    </div>
                    <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                        <Plus className="w-5 h-5" /> New Customer
                    </button>
                </div>

                <CustomerListTable customers={customers} handleEdit={handleEdit} handleDelete={handleDelete} isLoading={isLoading} />

                <CustomerFormModal 
                    isOpen={isModalOpen} onClose={resetForm} form={form} editingId={editingId} 
                    isLoading={isLoading} error={error} handleChange={handleChange} 
                    handleSubmit={handleSubmit} resetForm={resetForm} 
                />
            </div>
        </div>
    );
};

export default CustomerManager;