import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router'; // Fixed: standard for web
import { toast } from 'react-toastify';
import PaymentModal from './PaymentModal';

/**
 * CONFIGURATION & API ENDPOINTS
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PURCHASE_API = `${API_BASE_URL}/api/purchases`;
const SUPPLIER_API = `${API_BASE_URL}/api/suppliers`;
const ACCOUNT_API = `${API_BASE_URL}/api/payment_accounts`;

/**
 * SUB-COMPONENT: ProductRowEditor
 * Handles the rendering and local changes of individual product items.
 */
const ProductRowEditor = ({ product, index, onChange, onRemove }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onChange(index, name, value);
    };

    return (
        <tr className="border-b hover:bg-gray-50 transition-colors">
            <td className="p-3 text-sm text-gray-700 font-medium">{product.name}</td>
            <td className="p-3">
                <input
                    type="number"
                    name="qty"
                    value={product.qty}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                    min="1"
                />
            </td>
            <td className="p-3">
                <div className="relative">
                    <span className="absolute left-2 top-2 text-gray-400">৳</span>
                    <input
                        type="number"
                        name="purchase_price"
                        value={product.purchase_price}
                        onChange={handleInputChange}
                        className="w-full border p-2 pl-6 rounded text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </td>
            <td className="p-3 text-right text-sm font-bold text-gray-800">
                ৳{(product.qty * product.purchase_price).toLocaleString()}
            </td>
            <td className="p-3 text-center">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-400 hover:text-red-600 transition-colors text-xl"
                >
                    &times;
                </button>
            </td>
        </tr>
    );
};

/**
 * MAIN COMPONENT: PurchaseEdit
 */
const PurchaseEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [purchase, setPurchase] = useState(null);
    const [supplierDetails, setSupplierDetails] = useState(null);
    const [accountList, setAccountList] = useState([]); // Fetched but currently managed via Modal
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Payment Accounts
                const accountsResponse = await axios.get(ACCOUNT_API);
                setAccountList(accountsResponse.data.data || []);

                // 2. Fetch Specific Purchase Details
                const purchaseResponse = await axios.get(`${PURCHASE_API}/${id}`);
                const data = purchaseResponse.data.data;

                // 3. Map API data to local state
                const initialPurchaseState = {
                    ...data,
                    date: formatForInput(data.date),
                    totalAmount: data.total_amount,
                    paid_amount: data.paid_amount,
                    payment_method: data.payment_method,
                    supplier_id: data.supplier_id,
                    account_id: data.account_id,
                };
                setPurchase(initialPurchaseState);

                // 4. Fetch Supplier info based on the purchase data
                if (data.supplier_id) {
                    const supplierResponse = await axios.get(`${SUPPLIER_API}/${data.supplier_id}`);
                    setSupplierDetails(supplierResponse.data.data);
                }

            } catch (err) {
                console.error('Failed to fetch data:', err);
                toast.error('Failed to load purchase or associated details.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    // --- Computed Values ---
    // Automatically recalculates grand total whenever product quantities or prices change
    const total_purchase = useMemo(() => {
        return purchase?.products.reduce((sum, p) => sum + (p.qty * p.purchase_price), 0) || 0;
    }, [purchase?.products]);

    // --- Event Handlers: Product Management ---
    const updateProductField = (index, field, value) => {
        if (!purchase) return;

        const newProducts = [...purchase.products];
        const numericValue = ['qty', 'purchase_price'].includes(field) ? Number(value || 0) : value;

        newProducts[index][field] = numericValue;
        newProducts[index].subtotal = newProducts[index].qty * newProducts[index].purchase_price;

        setPurchase(prev => ({
            ...prev,
            products: newProducts,
        }));
    };

    const removeProduct = (index) => {
        if (!purchase) return;
        const newProducts = purchase.products.filter((_, i) => i !== index);
        setPurchase(prev => ({ ...prev, products: newProducts }));
    };

    // --- Event Handlers: Payment & Form ---
    const handlePaymentSelect = ({ paymentMethod, accountId }) => {
        setPurchase((prev) => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;

        if (["date","paid_amount", "payment_method", "account_id"].includes(name)) {
            setPurchase({ ...purchase, [name]: newValue });
        }
    };

    // --- Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!purchase.products?.length) {
            toast.error('Purchase must contain at least one product.');
            return;
        }
        if (!purchase.date) {
            toast.error('Purchase must contain date and time.');
            return;
        }
        if (!purchase.account_id && purchase.payment_method !== 'credit') {
            toast.error('Please select a payment account.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                products: purchase.products.map(p => ({
                    product_id: p.product_id,
                    name: p.name,
                    qty: p.qty,
                    purchase_price: p.purchase_price,
                    subtotal: p.subtotal,
                })),
                date: new Date(purchase.date)?.toISOString(),
                total_amount: total_purchase,
                paid_amount: purchase.paid_amount,
                payment_method: purchase.payment_method,
                account_id: purchase.account_id || null,
                supplier_id: purchase.supplier_id || null,
            };

            await axios.put(`${PURCHASE_API}/${id}`, payload);
            toast.success('Purchase updated successfully!');
            navigate('/purchases');
        } catch (err) {
            console.log(err);
            toast.error(err.response?.data?.message || 'Failed to update purchase.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatForInput = (dbDate) => {
    if (!dbDate) return "";
    // Removes milliseconds and the 'Z' to become YYYY-MM-DDTHH:mm
    return new Date(dbDate).toISOString().split('.')[0].slice(0, 16);
};




    // --- Loading & Error States ---
    if (loading) return <div className="p-20 text-center text-xl animate-pulse">Loading Purchase Details... 🔄</div>;
    if (!purchase) return <div className="p-20 text-center text-red-600 font-bold">Purchase not found.</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="bg-white shadow-xl rounded-2xl p-8">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-extrabold text-gray-800">
                        Edit Purchase <span className="text-indigo-600">#{id.slice(-6)}</span>
                    </h1>
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 font-medium">
                        &larr; Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* SECTION: Supplier Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <div>
                            <h2 className="text-sm uppercase tracking-wider font-bold text-indigo-400 mb-2">Supplier Information</h2>
                            <p className="text-lg font-bold text-gray-800">{supplierDetails?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{supplierDetails?.address || 'No Address Provided'}</p>
                        </div>
                        <div className="md:text-right">
                            <p className="text-sm text-gray-500">Phone: <span className="text-gray-800 font-medium">{supplierDetails?.phone || 'N/A'}</span></p>
                            <p className="text-sm text-gray-500">Last Purchase: <span className="text-gray-800 font-medium">{supplierDetails?.last_purchase_date || 'N/A'}</span></p>
                            <p className="text-xs text-gray-400 mt-2">Internal ID: {purchase.supplier_id}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                        <h2 className="text-sm uppercase tracking-wider font-bold text-gray-400 mb-4">Transaction Schedule</h2>
                        <InputField
                            label="Purchase Date & Time"
                            name="date"
                            type="datetime-local"
                            value={purchase.date} // This is now 'YYYY-MM-DDTHH:mm'
                            onChange={handleChange}
                        />
                    </div>

                    {/* SECTION: Product Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-700">Product Items</h2>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                {purchase.products.length} Items
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Product Name</th>
                                        <th className="p-4 text-center w-32">Qty</th>
                                        <th className="p-4 text-right w-40">Unit Price</th>
                                        <th className="p-4 text-right w-40">Subtotal</th>
                                        <th className="p-4 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {purchase.products.map((p, index) => (
                                        <ProductRowEditor
                                            key={p.product_id || index}
                                            product={p}
                                            index={index}
                                            onChange={updateProductField}
                                            onRemove={removeProduct}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION: Payment & Financials */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                            <h2 className="text-lg font-bold text-gray-800">Payment Details</h2>

                            <div>
                                <label className="text-sm font-semibold text-gray-600 block mb-2">Funding Source</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full px-4 py-3 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all font-medium"
                                >
                                    {purchase.payment_method ? 'Change Payment Account' : 'Select Payment Account'}
                                </button>

                                {purchase.payment_method && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                                        <span className="font-bold uppercase">{purchase.payment_method}</span>
                                        <span className="text-gray-400">|</span>
                                        <span>Acc: {purchase.account_id || 'Credit'}</span>
                                    </div>
                                )}
                            </div>

                            <InputField
                                label="Paid Amount (৳)"
                                name="paid_amount"
                                type="number"
                                value={purchase.paid_amount || ""}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Summary Box */}
                        <div className="space-y-4">
                            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <p className="text-indigo-100 text-sm font-medium uppercase tracking-widest">Grand Total</p>
                                <div className="flex justify-between items-baseline mt-2">
                                    <span className="text-4xl font-black">৳{total_purchase.toLocaleString()}</span>
                                    <span className="text-indigo-200 text-sm">Including VAT</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || purchase.products.length === 0 || !purchase.supplier_id}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl text-lg font-bold hover:bg-black transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none shadow-lg"
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm & Update Purchase'}
                            </button>
                        </div>
                    </div>
                </form>

                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSelectPayment={handlePaymentSelect}
                    defaultPaymentMethod={purchase.payment_method}
                />
            </div>
        </div>
    );
};

/**
 * REUSABLE UI: InputField
 */
export const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-semibold text-gray-600 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="border border-gray-200 rounded-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            required={required}
        />
    </div>
);

export default PurchaseEdit;