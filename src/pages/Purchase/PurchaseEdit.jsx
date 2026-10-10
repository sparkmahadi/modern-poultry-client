import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, 
    Calendar, 
    CreditCard, 
    Trash2, 
    Save, 
    Search, 
    PackagePlus, 
    X, 
    ShoppingBag, 
    Phone, 
    MapPin 
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import AddProductModal from '../../components/AddProductModal/AddProductModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PURCHASE_API = `${API_BASE_URL}/api/purchases`;
const SUPPLIER_API = `${API_BASE_URL}/api/suppliers`;
const ACCOUNT_API = `${API_BASE_URL}/api/payment_accounts`;

const ProductRowEditor = ({ product, index, onChange, onRemove }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onChange(index, name, value);
    };

    return (
        <tr className="hover:bg-slate-50/60 transition">
            <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{product.name}</td>
            <td className="px-3 py-3 text-center">
                <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded font-semibold uppercase">
                    {product.unit || 'pcs'}
                </span>
            </td>
            <td className="px-3 py-3 text-right">
                <input
                    type="number"
                    name="qty"
                    min="1"
                    value={product.qty}
                    onChange={handleInputChange}
                    className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:bg-white outline-none"
                />
            </td>
            <td className="px-3 py-3 text-right">
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="purchase_price"
                    value={product.purchase_price}
                    onChange={handleInputChange}
                    className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:bg-white outline-none"
                />
            </td>
            <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono text-sm">
                ৳{(Number(product.qty || 0) * Number(product.purchase_price || 0)).toFixed(2)}
            </td>
            <td className="px-3 py-3 text-center">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

const PurchaseEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [purchase, setPurchase] = useState(null);
    const [supplierDetails, setSupplierDetails] = useState(null);
    const [accountList, setAccountList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Product search inside Edit screen
    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [productSearchLoading, setProductSearchLoading] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);
    const productRef = useRef(null);

    // AddProductModal state
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [addProductApiInProgress, setAddProductApiInProgress] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [accountsRes, purchaseRes, catRes] = await Promise.all([
                    axios.get(ACCOUNT_API),
                    axios.get(`${PURCHASE_API}/${id}`),
                    axios.get(`${API_BASE_URL}/api/utilities/categories`).catch(() => ({ data: { data: [] } }))
                ]);

                setAccountList(accountsRes.data?.data || []);
                setCategories(catRes.data?.data || []);
                const data = purchaseRes.data?.data;

                if (data) {
                    setPurchase({
                        ...data,
                        date: formatForInput(data.date),
                        products: (data.products || []).map(p => ({
                            ...p,
                            product_id: p.product_id || p._id,
                            name: p.name || p.item_name,
                            unit: p.unit || 'pcs'
                        }))
                    });

                    if (data.supplier_id) {
                        const supplierRes = await axios.get(`${SUPPLIER_API}/${data.supplier_id}`);
                        setSupplierDetails(supplierRes.data?.data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                toast.error('Failed to load purchase details.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    // Handle outside clicks to close product dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced Product Search
    useEffect(() => {
        const delay = setTimeout(async () => {
            const query = productSearch.trim();
            if (!query) {
                setSearchResults([]);
                return;
            }
            setProductSearchLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);
                setSearchResults(res.data?.data || []);
                setShowProductResults(true);
            } catch (err) {
                console.error("Product search failed:", err);
                setSearchResults([]);
            } finally {
                setProductSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [productSearch]);

    // Add Product from Autocomplete Search into purchase.products
    const handleAddProductToOrder = (item) => {
        if (!purchase) return;
        const itemId = item._id || item.product_id;
        const exists = purchase.products.find(p => (p.product_id || p._id) === itemId);

        if (exists) {
            toast.info("Item is already added to this purchase order.");
            return;
        }

        const price = Number(item.purchase_price || item.price || 0);
        const newItem = {
            product_id: itemId,
            name: item.item_name || item.name,
            unit: item.unit || 'pcs',
            qty: 1,
            purchase_price: price,
            subtotal: price
        };

        setPurchase(prev => ({
            ...prev,
            products: [...prev.products, newItem]
        }));
        setProductSearch("");
        setShowProductResults(false);
        toast.success(`Added "${newItem.name}" to line items.`);
    };

    // Save newly created product from AddProductModal
    const saveNewProduct = async (productData) => {
        setAddProductApiInProgress(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/products`, productData);
            const created = res.data?.data;
            toast.success(`Product "${created.item_name}" created!`);
            handleAddProductToOrder(created);
            setShowAddProductModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create product.");
        } finally {
            setAddProductApiInProgress(false);
        }
    };

    const total_purchase = useMemo(() => {
        return purchase?.products.reduce((sum, p) => sum + (Number(p.qty || 0) * Number(p.purchase_price || 0)), 0) || 0;
    }, [purchase?.products]);

    const updateProductField = (index, field, value) => {
        if (!purchase) return;
        const newProducts = [...purchase.products];
        const numeric = ['qty', 'purchase_price'].includes(field) ? Number(value || 0) : value;
        newProducts[index][field] = numeric;
        newProducts[index].subtotal = Number(newProducts[index].qty || 0) * Number(newProducts[index].purchase_price || 0);
        setPurchase(prev => ({ ...prev, products: newProducts }));
    };

    const removeProduct = (index) => {
        if (!purchase) return;
        setPurchase(prev => ({ ...prev, products: purchase.products.filter((_, i) => i !== index) }));
    };

    const handlePaymentSelect = ({ paymentMethod, accountId }) => {
        setPurchase(prev => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;
        setPurchase(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!purchase.products?.length) {
            toast.error('Purchase must contain at least one product.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                supplier_id: purchase.supplier_id || null,
                products: purchase.products.map(p => ({
                    product_id: p.product_id || p._id,
                    name: p.name || p.item_name,
                    unit: p.unit || 'pcs',
                    qty: Number(p.qty),
                    purchase_price: Number(p.purchase_price),
                    subtotal: Number(p.qty * p.purchase_price),
                })),
                date: new Date(purchase.date).toISOString(),
                total_amount: total_purchase,
                paid_amount: Number(purchase.paid_amount) || 0,
                payment_method: purchase.payment_method,
                account_id: purchase.account_id || null,
            };

            await axios.put(`${PURCHASE_API}/${id}`, payload);
            toast.success('Purchase updated successfully!');
            navigate('/purchases');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update purchase.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatForInput = (dbDate) => {
        if (!dbDate) return "";
        const d = new Date(dbDate);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    if (loading) return <div className="p-16 text-center text-blue-600 font-bold animate-pulse">Loading Purchase Details...</div>;
    if (!purchase) return <div className="p-16 text-center text-rose-600 font-bold">Purchase not found.</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans text-slate-700 min-h-screen space-y-6">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Edit Purchase Order <span className="text-blue-400">#{id.slice(-6)}</span>
                        </h1>
                        <p className="text-xs text-slate-400">Update Supplier Transaction & Stock Line Items</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Supplier Info */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="font-bold text-slate-400 uppercase block mb-1">Supplier</span>
                        <p className="text-base font-bold text-slate-900">{supplierDetails?.name || 'N/A'}</p>
                        <p className="text-slate-500 mt-0.5">{supplierDetails?.address || 'No Address Provided'}</p>
                    </div>
                    <div className="md:text-right space-y-1">
                        <p className="text-slate-500">Phone: <strong className="text-slate-800">{supplierDetails?.phone || 'N/A'}</strong></p>
                        <p className="text-slate-500">Internal ID: <span className="font-mono text-slate-400">{purchase.supplier_id}</span></p>
                    </div>
                </div>

                {/* Date Input */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-sm">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Purchase Date & Time</label>
                    <input
                        type="datetime-local"
                        name="date"
                        value={purchase.date}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none focus:bg-white"
                        required
                    />
                </div>

                {/* Line Items Table with Autocomplete & Add SKU */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                            Purchased SKUs ({purchase.products.length})
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowAddProductModal(true)}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                        >
                            <PackagePlus className="w-4 h-4" /> Add New SKU
                        </button>
                    </div>

                    {/* Product Search Bar */}
                    <div className="relative" ref={productRef}>
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            value={productSearch}
                            onFocus={() => setShowProductResults(true)}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Add more products by searching name or barcode..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        />
                        {productSearch && (
                            <button
                                type="button"
                                onClick={() => setProductSearch("")}
                                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {showProductResults && searchResults.length > 0 && (
                            <ul className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                                {searchResults.map((p) => (
                                    <li
                                        key={p._id}
                                        onClick={() => handleAddProductToOrder(p)}
                                        className="p-3 hover:bg-blue-50/70 cursor-pointer flex justify-between items-center transition"
                                    >
                                        <div>
                                            <span className="font-bold text-slate-800 text-sm block">{p.item_name}</span>
                                            <span className="text-slate-400">Unit: {p.unit || 'pcs'} • {p.category || 'Standard'}</span>
                                        </div>
                                        <span className="font-bold text-blue-600 text-sm">৳{Number(p.purchase_price || p.price || 0).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Product Name</th>
                                    <th className="px-3 py-3 text-center w-24">Unit</th>
                                    <th className="px-3 py-3 text-right w-24">Qty</th>
                                    <th className="px-3 py-3 text-right w-32">Rate (৳)</th>
                                    <th className="px-4 py-3 text-right w-36">Subtotal (৳)</th>
                                    <th className="px-3 py-3 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {purchase.products.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-6 text-center text-slate-400 italic text-xs">
                                            No items in this purchase order. Add items using the search bar above.
                                        </td>
                                    </tr>
                                ) : (
                                    purchase.products.map((p, index) => (
                                        <ProductRowEditor
                                            key={p.product_id || p._id || index}
                                            product={p}
                                            index={index}
                                            onChange={updateProductField}
                                            onRemove={removeProduct}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Checkout & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-100">
                            Disbursement Details
                        </span>
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 transition"
                            >
                                <span className="uppercase">{purchase.payment_method || 'Select Account'}</span>
                                <span className="text-blue-600">Change</span>
                            </button>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Paid Amount (৳)</label>
                            <input
                                type="number"
                                name="paid_amount"
                                value={purchase.paid_amount || ""}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-600 outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Purchase Amount</span>
                            <span className="text-2xl font-black font-mono text-white">৳{total_purchase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || purchase.products.length === 0}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Confirm & Update Purchase'}
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

            <AddProductModal
                isOpen={showAddProductModal}
                onClose={() => setShowAddProductModal(false)}
                apiInProgress={addProductApiInProgress}
                categories={categories}
                onSave={saveNewProduct}
            />
        </div>
    );
};

export default PurchaseEdit;