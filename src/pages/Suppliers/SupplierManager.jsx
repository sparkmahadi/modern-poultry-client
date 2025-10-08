import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { Search } from 'lucide-react'; // Import Search icon

const API_BASE_URL = import.meta.env.VITE_API_BASE_URLLL;

// Helper components for consistency and readability (unchanged)
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

// New Component: SupplierManager
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
    const [searchTerm, setSearchTerm] = useState(''); // NEW SEARCH STATE
    const [form, setForm] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/suppliers`);
            // Assuming res.data.data contains the list
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
    };

    // ... handleSubmit, handleEdit, handleDelete functions remain the same ...
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // ===========================================
    // === NEW FEATURE: Client-Side Filtering ===
    // ===========================================
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

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b pb-2">📦 Supplier Management</h1>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* === Supplier Form Card === */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                        {editingId ? "✏️ Edit Supplier" : "➕ Add New Supplier"}
                    </h2>
                    <hr className="mb-4" />

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputField
                            label="Supplier Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Company Name / Contact Person"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
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
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* === Supplier List Table with Search === */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Supplier List ({filteredSuppliers.length} / {suppliers.length})</h2>

                    {/* NEW SEARCH INPUT */}
                    <div className="mb-4 relative">
                        <input
                            type="text"
                            placeholder="Search by name, phone, or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {/* END NEW SEARCH INPUT */}
                    
                    <hr className="mb-4" />

                    {isLoading && !suppliers.length ? (
                        <div className="text-center py-10 text-gray-500">Loading data...</div>
                    ) : filteredSuppliers.length === 0 && searchTerm ? (
                        <div className="text-center py-10 text-gray-500">
                            No suppliers found matching "{searchTerm}".
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Use filteredSuppliers here */}
                                    {filteredSuppliers.map((sup) => {
                                        const balanceInfo = getBalanceStyle(sup.due, sup.advance);
                                        return (
                                            <tr key={sup._id} className="hover:bg-yellow-50/50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{sup.name}</div>
                                                    <div className="text-xs text-gray-500">{sup.phone}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{sup.address}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-700 capitalize">{sup.type}</span>
                                                    <div className="mt-1">{getStatusBadge(sup.status)}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm ${balanceInfo.className}`}>{balanceInfo.label}</div>
                                                    <div className="text-xs text-gray-400 mt-1">(P: ৳{sup.due.toFixed(2)} / R: ৳{sup.advance.toFixed(2)})</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                                            onClick={() => navigate(sup._id)}
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-yellow-600 transition"
                                                            onClick={() => handleEdit(sup)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition"
                                                            onClick={() => handleDelete(sup._id)}
                                                        >
                                                            Delete
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

                    {!isLoading && suppliers.length === 0 && !searchTerm && (
                        <div className="text-center py-10 text-gray-500">No suppliers recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupplierManager;