import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router';
import {
    Calendar,
    User,
    UserPlus,
    Search,
    Trash2,
    CreditCard,
    Save,
    Printer,
    FileText,
    Store,
    X,
    Phone,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Layers,
    ArrowLeft
} from 'lucide-react';
import CustomerFormModal from '../../Customers/CustomerFormModal';
import PaymentModal from "../../Purchase/PaymentModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreateSell = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Check if redirected from a specific batch
    const searchParams = new URLSearchParams(location.search);
    const prefillBatchId = location.state?.batchId || searchParams.get('batchId') || '';
    const prefillCustomerId = location.state?.customerId || searchParams.get('customerId') || '';

    // --- Invoice Metadata ---
    const [memoNo, setMemoNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
    const [dateTime, setDateTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Farm Batch Integration ---
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(prefillBatchId);

    // --- Customer Selection ---
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const customerRef = useRef(null);

    // --- Product Selection & Line Items ---
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);
    const productRef = useRef(null);

    // --- Payment State ---
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [form, setForm] = useState({
        payment_method: 'cash',
        account_id: '',
        paid_amount: 0
    });

    // 1. Initial Load: Date, Accounts & Batches
    useEffect(() => {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setDateTime(local);

        const fetchInitData = async () => {
            try {
                const [accRes, batchRes] = await Promise.allSettled([
                    axios.get(`${API_BASE_URL}/api/payment_accounts`),
                    axios.get(`${API_BASE_URL}/api/batches`)
                ]);

                if (accRes.status === 'fulfilled') {
                    const accs = accRes.value.data?.data || [];
                    setAccountList(accs);
                    const defaultCash = accs.find((a) => a.type === 'cash' && a.is_default);
                    if (defaultCash) {
                        setForm((prev) => ({ ...prev, account_id: defaultCash._id }));
                    }
                }

                if (batchRes.status === 'fulfilled') {
                    const batchList = batchRes.value.data?.data || batchRes.value.data?.batches || [];
                    setBatches(batchList);

                    // If redirected with a batch ID, pre-load customer
                    if (prefillBatchId) {
                        const targetBatch = batchList.find(b => b._id === prefillBatchId);
                        if (targetBatch && targetBatch.farmerId) {
                            fetchCustomerById(targetBatch.farmerId);
                        }
                    }
                }
            } catch (err) {
                console.error('Initialization error:', err);
            }
        };

        fetchInitData();

        if (prefillCustomerId && !prefillBatchId) {
            fetchCustomerById(prefillCustomerId);
        }
    }, [prefillBatchId, prefillCustomerId]);

    // Helper: Load Customer Directly by ID
    const fetchCustomerById = async (cid) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/customers/${cid}`);
            if (res.data?.data) {
                setSelectedCustomer(res.data.data);
            }
        } catch (err) {
            console.error('Pre-fetch customer error:', err);
        }
    };

    // Auto-sync customer when batch changes
    const handleBatchSelection = (batchId) => {
        setSelectedBatchId(batchId);
        if (!batchId) return;

        const target = batches.find((b) => b._id === batchId);
        if (target && target.farmerId) {
            fetchCustomerById(target.farmerId);
        }
    };

    // Outside Click Dropdown Close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (customerRef.current && !customerRef.current.contains(e.target)) {
                setShowCustomerResults(false);
            }
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced Customer Search
    useEffect(() => {
        const delay = setTimeout(async () => {
            const query = customerSearch.trim();
            if (!query) return setCustomerResults([]);
            setCustomerLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/customers/search?q=${encodeURIComponent(query)}`);
                setCustomerResults(res.data?.data || []);
                setShowCustomerResults(true);
            } catch (err) {
                setCustomerResults([]);
            } finally {
                setCustomerLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [customerSearch]);

    // Debounced Product Search
    useEffect(() => {
        const delay = setTimeout(async () => {
            const query = productSearch.trim();
            if (!query) return setProductResults([]);
            setProductLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);
                setProductResults(res.data?.data || []);
                setShowProductResults(true);
            } catch (err) {
                setProductResults([]);
            } finally {
                setProductLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [productSearch]);

    // Add Product to Invoice
    const addProduct = async (product) => {
        if (products.find((p) => p._id === product._id)) {
            return toast.warn('Item already added.');
        }

        let stock = 0;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${product._id}`);
            stock = res.data?.stock || 0;
        } catch (err) {
            console.warn('Stock query failed:', err);
        }

        if (stock < 1 && !window.confirm('Available stock is 0. Continue adding?')) return;

        const price = Number(product.price || product.sale_price || 0);
        setProducts((prev) => [
            ...prev,
            {
                _id: product._id,
                item_name: product.item_name || product.name,
                qty: 1,
                price: price,
                subtotal: price,
                availableStock: stock
            }
        ]);
        setProductSearch('');
        setShowProductResults(false);
    };

    const updateQty = (id, val) => {
        const qty = Number(val) || 0;
        setProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, qty, subtotal: +(qty * p.price).toFixed(2) } : p))
        );
    };

    const updatePrice = (id, val) => {
        const price = Number(val) || 0;
        setProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, price, subtotal: +(p.qty * price).toFixed(2) } : p))
        );
    };

    const updateSubtotal = (id, val) => {
        const subtotal = Number(val) || 0;
        setProducts((prev) =>
            prev.map((p) =>
                p._id === id
                    ? { ...p, subtotal, price: p.qty > 0 ? +(subtotal / p.qty).toFixed(2) : 0 }
                    : p
            )
        );
    };

    const removeProduct = (id) => {
        setProducts((prev) => prev.filter((p) => p._id !== id));
    };

    const totalAmount = useMemo(() => {
        return products.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
    }, [products]);

    const remainingDue = useMemo(() => {
        return Math.max(0, Number(totalAmount.toFixed(2)) - Number(form.paid_amount || 0));
    }, [totalAmount, form.paid_amount]);

    // Submit Memo
    const handleSaveMemo = async () => {
        if (!memoNo) return toast.error('Enter memo number.');
        if (!selectedCustomer) return toast.error('Select a customer.');
        if (products.length === 0) return toast.error('Add at least one product.');
        if (form.paid_amount > 0 && !form.account_id) {
            return toast.error('Select receiving payment account.');
        }

        const payload = {
            memoNo,
            date: new Date(dateTime).toISOString(),
            customer_id: selectedCustomer._id,
            batch_id: selectedBatchId || null, // 👈 Linked to Farm Batch[cite: 1]
            products: products.map((p) => ({
                product_id: p._id,
                qty: p.qty,
                sale_price: p.price,
                subtotal: p.subtotal,
                name: p.item_name
            })),
            total_amount: totalAmount,
            paid_amount: form.paid_amount,
            payment_method: form.payment_method,
            account_id: form.account_id,
            payment_due: remainingDue,
            notes
        };

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
            if (res.data?.success) {
                toast.success(res.data.message || 'Sale created successfully!');
                setProducts([]);
                setSelectedCustomer(null);
                setForm((prev) => ({ ...prev, paid_amount: 0 }));
                setNotes('');
                setMemoNo(`INV-${Date.now().toString().slice(-6)}`);
                
                // If this came from a batch, prompt to go back to batch view
                if (selectedBatchId) {
                    navigate(`/farm-batches/${selectedBatchId}`);
                }
            } else {
                toast.info(res.data?.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create sale.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans text-slate-700 min-h-screen">
            {/* Top Toolbar Ribbon */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Sales Invoice Entry
                            {selectedBatchId && (
                                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Batch Linked
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-slate-400">Direct Retail & Farm Production Billing</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400 uppercase">Memo:</span>
                        <input
                            type="text"
                            value={memoNo}
                            onChange={(e) => setMemoNo(e.target.value)}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none w-28 text-right"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Farm Batch Assignment Strip */}
            <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                            Assign to Farm Batch (Optional)
                        </span>
                        <p className="text-xs text-amber-700">
                            Tagging a batch adds this sale to the farmer's feed, chick, or medicine production ledger.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={selectedBatchId}
                        onChange={(e) => handleBatchSelection(e.target.value)}
                        className="w-full md:w-72 bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    >
                        <option value="">-- General Walk-in (No Batch) --</option>
                        {batches.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.farmer ? `${b.farmer} (${b.chicksBreed || 'Batch'})` : b._id}
                            </option>
                        ))}
                    </select>

                    {selectedBatchId && (
                        <button
                            type="button"
                            onClick={() => setSelectedBatchId('')}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-amber-100 transition"
                            title="Unlink Batch"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Customer Search & Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-600" /> Customer Account
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                    >
                        <UserPlus className="w-3.5 h-3.5" /> Add Customer
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative" ref={customerRef}>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                placeholder="Search customer by name or phone..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            />
                            {customerLoading && (
                                <span className="absolute right-3.5 top-2.5 text-xs text-blue-600 animate-pulse font-semibold">
                                    Searching...
                                </span>
                            )}
                        </div>

                        {showCustomerResults && customerResults.length > 0 && (
                            <ul className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                                {customerResults.map((c) => (
                                    <li
                                        key={c._id}
                                        onClick={() => {
                                            setSelectedCustomer(c);
                                            setShowCustomerResults(false);
                                            setCustomerSearch('');
                                        }}
                                        className="p-3 hover:bg-blue-50/70 cursor-pointer flex justify-between items-center transition"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{c.name}</p>
                                            <p className="text-xs text-slate-400">{c.phone || 'No phone'}</p>
                                        </div>
                                        {c.manual_due > 0 && (
                                            <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded">
                                                Due: ৳{c.manual_due}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="md:col-span-7">
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                                    <div>
                                        <span className="text-slate-400 uppercase font-bold block text-[10px]">Name</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedCustomer.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 uppercase font-bold block text-[10px]">Phone</span>
                                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-slate-400" />
                                            {selectedCustomer.phone || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 uppercase font-bold block text-[10px]">Address</span>
                                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            {selectedCustomer.address || 'N/A'}
                                        </span>
                                    </div>
                                    {selectedCustomer.manual_due > 0 && (
                                        <div>
                                            <span className="text-rose-400 uppercase font-bold block text-[10px]">Ledger Due</span>
                                            <span className="font-bold text-rose-600">৳{selectedCustomer.manual_due}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCustomer(null)}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-3 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                                No customer selected. Search above or select an assigned batch.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Search & Line Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/70" ref={productRef}>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            value={productSearch}
                            onFocus={() => setShowProductResults(true)}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowProductResults(true);
                            }}
                            placeholder="Search feed, medicine, day-old chicks by name..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-24 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        />
                        {productLoading && (
                            <span className="absolute right-3.5 top-2.5 text-xs text-blue-600 font-semibold animate-pulse">
                                Loading...
                            </span>
                        )}
                    </div>

                    {showProductResults && productResults.length > 0 && (
                        <ul className="absolute z-50 left-8 right-8 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                            {productResults.map((p) => (
                                <li
                                    key={p._id}
                                    onClick={() => addProduct(p)}
                                    className="p-3.5 hover:bg-blue-50/70 cursor-pointer flex justify-between items-center transition"
                                >
                                    <div>
                                        <span className="font-bold text-slate-800 text-sm">{p.item_name || p.name}</span>
                                        {p.category && <span className="text-xs text-slate-400 block">{p.category}</span>}
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">
                                        ৳{Number(p.price || p.sale_price || 0).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center">#</th>
                                <th className="px-4 py-3">Product Description</th>
                                <th className="px-4 py-3 text-center w-36">Stock Remaining</th>
                                <th className="px-4 py-3 text-right w-28">Qty</th>
                                <th className="px-4 py-3 text-right w-32">Rate (৳)</th>
                                <th className="px-4 py-3 text-right w-36">Subtotal (৳)</th>
                                <th className="px-4 py-3 text-center w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-400 italic">
                                        No items added yet. Search products above.
                                    </td>
                                </tr>
                            ) : (
                                products.map((p, idx) => {
                                    const remaining = p.availableStock - p.qty;
                                    return (
                                        <tr key={p._id || idx} className="hover:bg-slate-50/60 transition">
                                            <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{p.item_name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        remaining < 0
                                                            ? 'bg-rose-50 text-rose-600'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                    }`}
                                                >
                                                    {remaining < 0 ? (
                                                        <AlertTriangle className="w-3 h-3" />
                                                    ) : (
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    )}
                                                    {remaining} ({p.availableStock})
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={p.qty}
                                                    onChange={(e) => updateQty(p._id, e.target.value)}
                                                    className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:bg-white outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={p.price}
                                                    onChange={(e) => updatePrice(p._id, e.target.value)}
                                                    className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:bg-white outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={p.subtotal}
                                                    onChange={(e) => updateSubtotal(p._id, e.target.value)}
                                                    className="w-28 text-right bg-blue-50/50 border border-blue-200 rounded-lg px-2 py-1 font-bold text-blue-900 focus:bg-white outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeProduct(p._id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Checkout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Remarks / Delivery Instructions
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add delivery driver, feed batch notes, or vehicle numbers..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none h-28 resize-none transition"
                    />
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, paid_amount: totalAmount }))}
                            className="w-1/2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition"
                        >
                            Mark Full Paid
                        </button>
                    </div>
                </div>

                <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Memo Amount</span>
                        <span className="text-3xl font-black text-slate-900 font-mono">
                            ৳{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Receiving Channel
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 transition"
                            >
                                <span className="flex items-center gap-2 uppercase text-xs">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    {form.payment_method || 'Select Account'}
                                </span>
                                <span className="text-xs text-blue-600">Change</span>
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Collected Amount (৳)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={form.paid_amount || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, paid_amount: Number(e.target.value) || 0 }))}
                                placeholder="0.00"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-base font-bold text-emerald-600 focus:bg-white outline-none text-right"
                            />
                        </div>
                    </div>

                    <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            remainingDue > 0
                                ? 'bg-rose-50 border-rose-100 text-rose-900'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                        }`}
                    >
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider block">
                                {remainingDue > 0 ? 'Remaining Due Balance' : 'Settlement Status'}
                            </span>
                            <span className="text-xs opacity-75">
                                {remainingDue > 0 ? 'Will increment customer ledger due' : 'Fully settled without due'}
                            </span>
                        </div>
                        <span className="text-xl font-black font-mono">
                            ৳{remainingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveMemo}
                        disabled={isSubmitting || products.length === 0}
                        className="w-full py-3.5 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? 'Saving...' : 'Complete & Save Memo'}
                    </button>
                </div>
            </div>

            {/* Modals */}
            <CustomerFormModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                form={{ name: '', phone: '', address: '', type: 'permanent', status: 'active' }}
                editingId={null}
                isLoading={false}
                error={null}
                handleChange={() => {}}
                handleSubmit={async (e) => {
                    e.preventDefault();
                    setIsCustomerModalOpen(false);
                }}
                resetForm={() => setIsCustomerModalOpen(false)}
            />

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSelectPayment={({ paymentMethod, accountId }) =>
                    setForm((prev) => ({ ...prev, payment_method: paymentMethod, account_id: accountId }))
                }
                defaultPaymentMethod={form.payment_method}
                defaultSelectedAccount={form.account_id}
            />
        </div>
    );
};

export default CreateSell;