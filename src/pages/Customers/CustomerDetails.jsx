import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router'; // Assuming you use React Router
import axios from 'axios';

// --- Helper Components for consistency (from CustomerManager) ---

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

// --- New: Edit Customer Modal Component (adapted from CustomerManager) ---

const EditCustomerModal = ({
    isOpen,
    onClose,
    form,
    isLoading,
    error,
    handleChange,
    handleSubmit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center justify-between">
                        <span>✏️ Edit Customer Details</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Close modal">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </h2>
                    <hr className="mb-4" />

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm" role="alert">
                            <p className="font-bold">Error:</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputField label="Name" name="name" value={form.name} onChange={handleChange} required />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                            <SelectField
                                label="Customer Type"
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                options={[{ value: "permanent", label: "Permanent" }, { value: "temporary", label: "Temporary" }]}
                            />
                        </div>
                        <InputField label="Address" name="address" value={form.address} onChange={handleChange} />
                        
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <InputField label="Current Due (৳)" name="due" type="number" value={form.due} onChange={handleChange} min="0" />
                            <InputField label="Current Advance (৳)" name="advance" type="number" value={form.advance} onChange={handleChange} min="0" />
                        </div>

                        <SelectField
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                        />
                        
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-150 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : "Update Customer"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const CustomerDetails = () => {
    // 1. Setup Hooks and Constants
    const { id } = useParams();
    const navigate = useNavigate(); // For redirecting after delete
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

    const [customer, setCustomer] = useState(null);
    const [form, setForm] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 2. Data Fetching Effect
    useEffect(() => {
        if (id) {
            fetchCustomerDetails();
        } else {
            setError("Customer ID not provided.");
            setIsLoading(false);
        }
    }, [id]);

    const fetchCustomerDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/${id}`);
            setCustomer(res.data.data);
            setForm(res.data.data); // Initialize form for editing
        } catch (err) {
            console.error(err);
            setError("Failed to fetch customer details. Does the ID exist?");
            setCustomer(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Edit Form Handlers
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;
        setForm({ ...form, [name]: newValue });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.put(`${API_BASE_URL}/${id}`, form);
            setCustomer(res.data.data); // Update main customer data
            setIsModalOpen(false); // Close modal on success
        } catch (err) {
            console.error(err);
             if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to update customer.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    // Function to open the modal and reset local error
    const openEditModal = () => {
        // Reset form state to current customer data just in case
        setForm(customer); 
        setError(null);
        setIsModalOpen(true);
    };

    // 4. Delete Handler
    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete customer: ${customer.name}?`)) return;
        
        setIsLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/${id}`);
            alert(`Customer "${customer.name}" deleted successfully.`);
            navigate('/customers'); // Redirect to the customer list page
        } catch (err) {
            console.error(err);
            setError("Failed to delete customer.");
            setIsLoading(false);
        }
    };

    // 5. Utility functions for Display
    const getStatusBadge = (status) => {
        const color = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${color} capitalize`}>{status}</span>;
    };

    const formatCurrency = (amount) => `৳${Number(amount).toFixed(2)}`;
    const formatDate = (isoDate) => isoDate ? new Date(isoDate).toLocaleDateString() : 'N/A';

    // 6. Conditional Rendering
    if (isLoading && !customer) {
        return <div className="p-8 text-center text-xl text-gray-500">Loading customer details...</div>;
    }

    if (error && !customer) {
        return <div className="p-8 text-center text-xl text-red-600">Error: {error}</div>;
    }

    if (!customer) {
        return <div className="p-8 text-center text-xl text-gray-700">Customer not found.</div>;
    }
    
    // 7. Render JSX
    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
                    <span className="text-blue-600">👤</span>
                    {customer.name}
                </h1>
                <p className="text-lg text-gray-500 mb-8 border-b pb-4">Details for Customer ID: **{customer._id}**</p>

                {/* Action Buttons */}
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={openEditModal}
                        className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        ✏️ Edit Customer
                    </button>
                    <button
                        onClick={handleDelete}
                        className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        🗑️ Delete Customer
                    </button>
                </div>

                {/* Details Grid */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6">
                    <h2 className="text-2xl font-bold text-gray-700 border-b pb-3">General Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem label="Phone" value={customer.phone || 'N/A'} />
                        <DetailItem label="Address" value={customer.address || 'N/A'} />
                        <DetailItem label="Type" value={customer.type} badge={true} />
                        <DetailItem label="Status" value={getStatusBadge(customer.status)} raw={true} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-700 border-b pt-4 pb-3">Financial Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DetailItem label="Current Due" value={formatCurrency(customer.due)} color="text-red-600" />
                        <DetailItem label="Current Advance" value={formatCurrency(customer.advance)} color="text-green-600" />
                        <DetailItem label="Total Sales" value={formatCurrency(customer.total_sales || 0)} />
                        <DetailItem label="Total Due (Lifetime)" value={formatCurrency(customer.total_due || 0)} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-700 border-b pt-4 pb-3">History</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem label="Joined Date" value={formatDate(customer.createdAt)} />
                        <DetailItem label="Last Purchase Date" value={formatDate(customer.last_purchase_date)} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-700 border-b pt-4 pb-3">Purchased Products</h2>
                    <div className="text-gray-700">
                        {customer.purchased_products && customer.purchased_products.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                                {customer.purchased_products.map((p, index) => <li key={index} className="text-sm">{p}</li>)}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No product history available.</p>
                        )}
                    </div>

                </div>
            </div>

            {/* Edit Modal */}
            <EditCustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                form={form}
                isLoading={isLoading}
                error={error}
                handleChange={handleChange}
                handleSubmit={handleEditSubmit}
            />
        </div>
    );
};

// --- Local Helper for Displaying Details ---
const DetailItem = ({ label, value, color = 'text-gray-900', raw = false, badge = false }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className={`mt-1 text-lg ${color} capitalize`}>
            {raw ? value : (badge ? <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{value}</span> : value)}
        </dd>
    </div>
);

export default CustomerDetails;