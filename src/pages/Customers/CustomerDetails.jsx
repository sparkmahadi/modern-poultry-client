import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreateBatchForm from '../FarmBatches/CreateBatchForm';
import UniversalSalesManager from '../Sales/UniversalSalesManager';
import ReceiveDueManuallyModal from './ReceiveDueManuallyModal';
// Assuming you have access to icons (e.g., from heroicons)
// For this example, I'll use simple SVG definitions or unicode icons.

// --- Constants & Utilities ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formatDate = (isoDate) => isoDate ? new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
const formatCurrency = (amount) => `৳${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; // Use better locale formatting

// --- Helper Components for consistency ---

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "", min }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="border border-gray-300 rounded-xl p-3 w-full focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
            required={required}
            min={min}
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="border border-gray-300 rounded-xl p-3 w-full bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

// Improved DetailItem for the main grid
const DetailItem = ({ label, value, color = 'text-gray-900', raw = false, badge = false }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
        <dd className={`mt-1 text-lg font-bold ${color} capitalize`}>
            {raw ? value : (badge ? <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">{value}</span> : value)}
        </dd>
    </div>
);

// --- Edit Customer Modal Component (Kept Separate) ---

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
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
                <div className="p-8">
                    <h2 className="text-3xl font-extrabold text-indigo-600 mb-4 flex items-center justify-between">
                        <span>📝 Edit Customer Details</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-indigo-600 transition" aria-label="Close modal">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </h2>
                    <hr className="mb-6 border-indigo-100" />

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm rounded-lg" role="alert">
                            <p className="font-bold">Update Error:</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField label="Name" name="name" value={form.name} onChange={handleChange} required />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                        <div className="grid grid-cols-2 gap-5 border-t pt-5">
                            <InputField label="Current Manual Due (৳)" name="due" type="number" value={form.due} onChange={handleChange} min="0" />
                            <InputField label="Current Manual Advance (৳)" name="advance" type="number" value={form.advance} onChange={handleChange} min="0" />
                        </div>

                        <SelectField
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                        />

                        <div className="flex gap-4 pt-5">
                            <button
                                type="submit"
                                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition duration-200 shadow-md disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving Changes...' : "Save & Update Customer"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition duration-200"
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


// --- CustomerBatchList Component (Merged & Improved UI) ---

const CustomerBatchList = ({ batches, fetchBatchesByCustomerId }) => {
    const [loadingDelete, setLoadingDelete] = useState(false);

    const handleFormSuccess = () => { setIsModalOpen(false) };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const handleOpenEdit = (batch) => { setEditingBatch(batch); setIsModalOpen(true); };

    const deleteBatch = async (batchId) => {
        setLoadingDelete(true);
        try {
            await axios.delete(`${API_BASE_URL}/api/batches/${batchId}`);
            toast.success('Batch deleted successfully!');
            fetchBatchesByCustomerId();
        } catch (error) {
            console.error('Failed to delete batch:', error);
            toast.error(error.response?.data?.message || 'Failed to delete batch. Please try again.');
        } finally {
            setLoadingDelete(false);
        }
    };

    const handleDeleteBatch = async (batchId) => {
        if (window.confirm("Are you sure you want to permanently delete this batch?")) {
            await deleteBatch(batchId);
        }
    };

    if (!batches || batches.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-500 italic">No active or historical farming batches associated with this customer.</p>
                <Link to='/create-batch'
                    className="mt-4 inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 text-sm"
                >
                    <span className="mr-2">🌱</span> Start New Batch
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50">
            {isModalOpen && (
                <CreateBatchForm
                    batchData={editingBatch}
                    onSuccess={handleFormSuccess}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            <hr className="my-8" />

            <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Batch ID', 'Farmer', 'Start Date', 'Status', "Chicks", 'Expected End Date', "Breed", 'Actions'].map((header) => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {batches.map((batch) => (
                                <tr key={batch._id}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{batch._id.slice(-6)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{batch.farmer}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(batch.startDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${batch.active ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {batch.active ? 'Active' : 'Completed'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{batch.chicksQuantity}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{batch.expectedEndDate || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{batch.chicksBreed}</td>
                                    <td className="px-6 py-4 text-sm font-medium space-x-3">
                                        <button onClick={() => handleOpenEdit(batch)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <Link to={`/farm-batches/${batch._id}`} className="text-indigo-600 hover:text-indigo-900">Details</Link>
                                        <button onClick={() => handleDeleteBatch(batch._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Main CustomerDetails Component ---

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const CUSTOMER_API_URL = `${API_BASE_URL}/api/customers`;
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const [customer, setCustomer] = useState(null);
    const [customerBatches, setCustomerBatches] = useState(null);
    const [form, setForm] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 2. Data Fetching Functions
    const fetchCustomerDetails = async () => {
        setError(null);
        try {
            const res = await axios.get(`${CUSTOMER_API_URL}/${id}`);
            const customerData = res.data.data;
            console.log(customerData);
            setCustomer(customerData);
            setForm(customerData);
        } catch (err) {
            console.error("Fetch Customer Details Error:", err);
            setError("Failed to fetch customer details. Does the ID exist?");
            setCustomer(null);
        }
    };

    const fetchBatchesByCustomerId = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/batches/customer-farming-batches/${id}`);
            setCustomerBatches(res.data.batches);
        } catch (err) {
            console.error("Fetch Batches Error:", err);
            setCustomerBatches([]);
        }
    };

    // Combined Fetch Effect
    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                setIsLoading(true);
                await Promise.all([
                    fetchCustomerDetails(),
                    fetchBatchesByCustomerId()
                ]);
                setIsLoading(false);
            };
            fetchData();
        } else {
            setError("Customer ID not provided.");
            setIsLoading(false);
        }
    }, [id]);

    // 3. Edit Form Handlers
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = (type === 'number' && value !== '') ? Number(value) : value;
        setForm({ ...form, [name]: newValue });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.put(`${CUSTOMER_API_URL}/${id}`, form);
            setCustomer(res.data.data);
            setIsModalOpen(false);
            toast.success("Customer details updated successfully!");
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
        if (customer) {
            setForm({
                ...customer,
                due: String(customer.due || 0),
                advance: String(customer.advance || 0),
            });
        }
        setError(null);
        setIsModalOpen(true);
    };

    // 4. Delete Handler
    const handleDelete = async () => {
        if (!customer) return;
        if (!window.confirm(`Are you sure you want to permanently delete customer: ${customer.name}? This action cannot be undone.`)) return;

        setIsLoading(true);
        try {
            await axios.delete(`${CUSTOMER_API_URL}/${id}`);
            toast.success(`Customer "${customer.name}" deleted successfully.`);
            navigate('/customers');
        } catch (err) {
            console.error(err);
            setError("Failed to delete customer.");
            setIsLoading(false);
            toast.error("Failed to delete customer.");
        }
    };

    // 5. Utility functions for Display
    const getStatusBadge = (status) => {
        const color = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${color} capitalize`}>{status}</span>;
    };


    // 6. Conditional Rendering
    if (isLoading && !customer) {
        return <div className="p-8 text-center text-xl text-indigo-500 font-semibold">Loading customer details...</div>;
    }

    if (error && !customer) {
        return <div className="p-8 text-center text-xl text-red-600 bg-red-50 rounded-xl border border-red-300 mx-auto max-w-6xl">Error: {error}</div>;
    }

    if (!customer) {
        return <div className="p-8 text-center text-xl text-gray-700">Customer not found.</div>;
    }

    // 7. Render JSX
    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
                        <span className="text-indigo-600">👤</span>
                        {customer.name}
                    </h1>
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-md"
                        >
                            <span className="text-lg">💰</span> Receive Payment Manually
                        </button>
                        <button
                            onClick={openEditModal}
                            className="bg-yellow-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                            disabled={isLoading}
                        >
                            ✏️ Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                            disabled={isLoading}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </div>

                {/* General Information & History Grid */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-700 border-b pb-3 flex items-center"><span className="mr-2 text-indigo-500">ℹ️</span> Customer Information</h2>

                    {/* General Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="Phone" value={customer.phone || 'N/A'} color="text-gray-700" />
                        <DetailItem label="Type" value={customer.type} badge={true} />
                        <DetailItem label="Joined Date" value={formatDate(customer.createdAt)} color="text-gray-700" />
                        <DetailItem label="Last Purchase Date" value={formatDate(customer.last_Sale_date)} color="text-gray-700" />
                        <DetailItem label="ID" value={customer._id} color="text-gray-700" />
                        <DetailItem label="Address" value={customer?.address || 'N/A'} color="text-gray-700" />
                    </div>

                </div>


                {/* Financial/Status Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-red-500">
                        <p className="text-sm font-medium text-gray-500">Current Total Due</p>
                        <p className="text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(customer.manual_due + customer.due)}</p>
                    </div>

                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-green-500">
                        <p className="text-sm font-medium text-gray-500">Current Total Advance</p>
                        <p className="text-2xl font-extrabold text-green-600 mt-1">{formatCurrency(customer.manual_advance + customer.advance)}</p>
                    </div>

                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500">
                        <p className="text-sm font-medium text-gray-500">Total Lifetime Sales</p>
                        <p className="text-2xl font-extrabold text-indigo-600 mt-1">{formatCurrency(customer.total_sales || 0)}</p>
                    </div>
                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-gray-500">
                        <p className="text-sm font-medium text-gray-500">Customer Status</p>
                        <div className="mt-2">{getStatusBadge(customer.status)}</div>
                    </div>


                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-red-500">
                        <p className="text-sm font-medium text-gray-500">Current System Due</p>
                        <p className="text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(customer.due)}</p>
                    </div>
                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-red-500">
                        <p className="text-sm font-medium text-gray-500">Current Manual Due</p>
                        <p className="text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(customer.manual_due)}</p>
                    </div>

                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-green-500">
                        <p className="text-sm font-medium text-gray-500">Current System Advance</p>
                        <p className="text-2xl font-extrabold text-green-600 mt-1">{formatCurrency(customer.advance)}</p>
                    </div>
                    <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-green-500">
                        <p className="text-sm font-medium text-gray-500">Current Manual Advance</p>
                        <p className="text-2xl font-extrabold text-green-600 mt-1">{formatCurrency(customer.manual_advance)}</p>
                    </div>


                </div>

                {/* Batches and Sales Sections */}
                <div className="space-y-8">
                    {/* Batches of this customer (using merged component) */}
                    <CustomerBatchList
                        batches={customerBatches}
                        fetchBatchesByCustomerId={fetchBatchesByCustomerId}
                    />

                    {/* sales history of this customer (using merged component) */}
                    <UniversalSalesManager
                        context="customer"
                        title={`History: ${customer.name}`}
                        fetchUrl={`${API_BASE_URL}/api/sales/customer-sales/${customer._id}`}
                    />
                </div>



                <div className="pt-4 border-t">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Purchased Products Summary</h3>
                    <div className="text-gray-700 p-3 bg-gray-50 rounded-lg border">
                        {customer.purchased_products && customer.purchased_products.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm grid sm:grid-cols-2">
                                {customer.purchased_products.map((p, index) => <li key={index} className="text-gray-600">{p}</li>)}
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
                onClose={() => { setIsModalOpen(false); setError(null); }}
                form={form}
                isLoading={isLoading}
                error={error}
                handleChange={handleChange}
                handleSubmit={handleEditSubmit}
            />

            <ReceiveDueManuallyModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                customerId={customer._id}
                customerName={customer.name}
                onPaymentSuccess={() => {
                    fetchCustomerDetails(); // Refresh balance/due cards
                    // Trigger a refresh of the sales history
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default CustomerDetails;