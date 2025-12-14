import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { Search, Plus, X, Edit, Trash2, Info } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==========================================
// 1. Modal Component (New)
// ==========================================
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={onClose} // Close modal on backdrop click
        >
            <div 
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
                onClick={e => e.stopPropagation()} // Prevent closing on modal content click
            >
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-blue-600">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};


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
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500 transition duration-150"
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
            className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-blue-500 focus:border-blue-500 transition duration-150"
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
        due: 0,
        advance: 0,
        status: "active",
    };

    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // NEW MODAL STATE

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
        setIsModalOpen(false); // Close modal on reset
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

    // Open modal for editing
    const handleEdit = (supplier) => {
        setForm(supplier);
        setEditingId(supplier._id);
        setIsModalOpen(true); // Open modal
    };
    
    // Open modal for adding
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
        const color = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color} capitalize`}>{status}</span>;
    };

    const getBalanceStyle = (due, advance) => {
        const balance = due - advance;
        if (balance > 0) return { className: 'text-red-600 font-bold', label: `Payable: ৳${balance.toFixed(2)}` };
        if (balance < 0) return { className: 'text-green-600 font-bold', label: `Receivable: ৳${Math.abs(balance).toFixed(2)}` };
        return { className: 'text-gray-500', label: 'Settled' };
    };

    // Client-Side Filtering
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) {
            return suppliers;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return suppliers.filter(supplier => (
            supplier.name.toLowerCase().includes(lowerCaseSearch) ||
            supplier.phone.toLowerCase().includes(lowerCaseSearch) ||
            supplier.address.toLowerCase().includes(lowerCaseSearch) ||
            supplier.type.toLowerCase().includes(lowerCaseSearch)
        ));
    }, [suppliers, searchTerm]);
    
    // Calculate Totals for the bottom summary (as per image)
    const totalDue = filteredSuppliers.reduce((sum, sup) => sum + sup.due, 0);
    const totalAdvance = filteredSuppliers.reduce((sum, sup) => sum + sup.advance, 0);
    const netBalance = totalDue - totalAdvance;

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* ============================================== */}
            {/* === Main Content: Supplier List Area === */}
            {/* ============================================== */}
            
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-extrabold text-gray-800">Suppliers List</h1>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition duration-150"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Supplier
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Search and List */}
                <div className="mb-4 relative max-w-sm">
                    <input
                        type="text"
                        placeholder="Search by name, phone, or address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                
                {isLoading && !suppliers.length ? (
                    <div className="text-center py-10 text-gray-500">Loading data...</div>
                ) : filteredSuppliers.length === 0 && searchTerm ? (
                    <div className="text-center py-10 text-gray-500">
                        No suppliers found matching "{searchTerm}".
                    </div>
                ) : (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">SL</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provided Products (Info)</th> {/* Added (Info) column to match the image */}
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount (Due)</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid (Advance)</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due / Balance</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchased</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSuppliers.map((sup, index) => {
                                    const balanceInfo = getBalanceStyle(sup.due, sup.advance);
                                    return (
                                        <tr key={sup._id} className="hover:bg-yellow-50/50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{sup.name}</div>
                                                <div className="text-xs text-gray-500">{sup.phone}</div>
                                                {/* <div className="text-xs text-gray-500 truncate max-w-xs">{sup.address}</div> */}
                                                <div className="mt-1">{getStatusBadge(sup.status)}</div>
                                            </td>
                                            {/* Simulated 'Provided Products' - Could be a link to product details */}
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                    <Info className="w-3 h-3"/> View Products
                                                </button>
                                            </td>
                                            {/* Total Amount (Due) */}
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-red-700">
                                                ৳{sup.due.toFixed(2)}
                                            </td>
                                            {/* Total Paid (Advance) */}
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-green-700">
                                                ৳{sup.advance.toFixed(2)}
                                            </td>
                                            {/* Total Due / Balance (Net Balance) */}
                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <div className={`text-sm ${balanceInfo.className}`}>{balanceInfo.label}</div>
                                            </td>
                                            {/* Last Purchased - Placeholder date */}
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                {/* Replace with actual last purchase date logic */}
                                                {index % 2 === 0 ? 'N/A' : '2025-12-01'} 
                                            </td>
                                            {/* Actions (Details/Delete in image = Details/Edit/Delete here) */}
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900 transition p-1"
                                                        onClick={() => navigate(`/suppliers/${sup._id}`)} // Placeholder route
                                                        title="View Details"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="text-yellow-600 hover:text-yellow-900 transition p-1"
                                                        onClick={() => handleEdit(sup)}
                                                        title="Edit Supplier"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-900 transition p-1"
                                                        onClick={() => handleDelete(sup._id)}
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
                )}
                
                {/* Total Section (Mimicking the image) */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-lg font-bold">
                    <div className="text-gray-800">Total</div>
                    <div className="flex space-x-8 text-right">
                        <div className="text-red-700">Total Due: ৳{totalDue.toFixed(2)}</div>
                        <div className="text-green-700">Total Paid: ৳{totalAdvance.toFixed(2)}</div>
                        <div className={netBalance >= 0 ? 'text-red-600' : 'text-green-600'}>
                            Net Balance: ৳{Math.abs(netBalance).toFixed(2)} ({netBalance >= 0 ? 'Payable' : 'Receivable'})
                        </div>
                    </div>
                </div>

                {!isLoading && suppliers.length === 0 && !searchTerm && (
                    <div className="text-center py-10 text-gray-500">No suppliers recorded yet.</div>
                )}
            </div>

            {/* ============================================== */}
            {/* === Modal for Add/Edit Supplier === */}
            {/* ============================================== */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "✏️ Edit Supplier" : "➕ Add New Supplier"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        label="Supplier Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Company Name / Contact Person"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                            label="Phone"
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
                                { value: "regular", label: "Regular" },
                                { value: "onetime", label: "One-Time" },
                                { value: "international", label: "International" },
                            ]}
                        />
                    </div>
                    <InputField
                        label="Address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Business Address / Location"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                        <InputField
                            label="Current Payable (৳)"
                            name="due"
                            type="number"
                            value={form.due}
                            onChange={handleChange}
                            placeholder="0"
                        />
                        <InputField
                            label="Current Receivable (৳)"
                            name="advance"
                            type="number"
                            value={form.advance}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                    <SelectField
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        options={[
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                        ]}
                    />
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-150 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : editingId ? "Update Supplier" : "Add Supplier"}
                        </button>
                        {(editingId || !isLoading) && (
                             <button
                                 type="button"
                                 onClick={resetForm}
                                 className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
                             >
                                 Cancel
                             </button>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SupplierManager;