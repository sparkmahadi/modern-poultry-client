import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router"; // Added for routing
import { toast } from "react-toastify";

// Sub-components

import textConstants from "../Sales/CreateSell/SalesMemo/memoTexts";
import MemoHeader from "./CreateSell/SalesMemo/MemoHeader";
import PaymentModal from "../Purchase/PaymentModal";
import { InputField } from "../Purchase/FormComponents";
import ProductTable from "./CreateSell/SalesMemo/ProductTable";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SaleDetails = () => {
    const { saleId } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const [lang, setLang] = useState("en");
    const t = useMemo(() => textConstants[lang], [lang]);

    // --- State Management ---
    const [loading, setLoading] = useState(false);
    const [memoNo, setMemoNo] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    const [form, setForm] = useState({
        payment_method: "",
        account_id: "",
        paid_amount: 0,
    });

    // --- 1. Load Initial Data (Accounts) ---
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
                setAccountList(res.data.data || []);
            } catch (err) { console.error("Accounts fetch failed", err); }
        };
        fetchAccounts();
    }, []);

    // --- 2. Load Existing Sale (Edit Mode) ---
    const fetchSale = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/sales/${saleId}`);
            if (res.data.success) {
                const s = res.data.sale;
                console.log(s);
                // Map backend keys to Form State
                setMemoNo(s.memoNo);
                setDate(new Date(s.date).toISOString().split("T")[0]);
                setForm({
                    payment_method: s.payment_method || "",
                    account_id: s.account_id || "",
                    paid_amount: s.paid_amount || 0
                });

                // Map products: backend 'product_id' -> frontend '_id'
                // Map products: backend 'sale_price' -> frontend 'price'
                const mappedProducts = s.products.map(p => ({
                    ...p,
                    _id: p.product_id, 
                    price: p.sale_price,
                    subtotal: p.subtotal
                }));
                setSelectedProducts(mappedProducts);

                // Fetch full customer object
                if (s.customer_id) {
                    const cRes = await axios.get(`${API_BASE_URL}/api/customers/${s.customer_id}`);
                    setSelectedCustomer(cRes.data.data);
                }
            }
        } catch (err) {
            toast.error("Error loading sale record");
        } finally {
            setLoading(false);
        }
    }, [saleId]);

    useEffect(() => {
        if (saleId) fetchSale();
    }, [fetchSale]);


        // Product Search Logic
    useEffect(() => {
        const delay = setTimeout(() => {
            const q = search.trim();
            if (!q) return setSearchResults([]);
            axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`)
                .then(res => setSearchResults(res.data.data || []))
                .catch(() => setSearchResults([]));
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    // --- Calculations ---
    const total = selectedProducts.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
    const due = Number(total.toFixed(2)) - Number(form.paid_amount || 0);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handlePaymentSelect = ({ paymentMethod, accountId }) => {
        setForm(prev => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
    };

    const addProduct = async (product) => {
        if (selectedProducts.find(p => p._id === product._id)) return toast.warn("Already added.");
        setIsCheckingStock(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${product._id}`);
            const stock = res.data?.stock || 0;
            if (stock < 1 && !window.confirm("Stock is zero. Proceed anyway?")) return;

            setSelectedProducts([...selectedProducts, { 
                ...product, qty: 1, price: Number(product.price) || 0, subtotal: Number(product.price) || 0, availableStock: stock 
            }]);
            setSearch("");
            setSearchResults([]);
        } finally { setIsCheckingStock(false); }
    };

    const updateQty = (id, qty) => {
        setSelectedProducts(prev => prev.map(p => p._id === id ? { ...p, qty: Number(qty), subtotal: +(Number(qty) * p.price).toFixed(2) } : p));
    };

    const updatePrice = (id, p) => {
        setSelectedProducts(prev => prev.map(item => item._id === id ? { ...item, price: Number(p), subtotal: +(item.qty * Number(p)).toFixed(2) } : item));
    };

    // --- 3. Save / Update Logic ---
    const handleSave = async () => {
        if (!memoNo) return toast.error("Missing memo number");
        if (!selectedCustomer) return toast.error("Please select a customer");
        if (selectedProducts.length === 0) return toast.error("Please add products");

        const payload = {
            memoNo, 
            date, 
            customer_id: selectedCustomer._id,
            products: selectedProducts.map(p => ({ 
                product_id: p._id,
                name:p.item_name, 
                qty: p.qty, 
                sale_price: p.price, 
                subtotal: p.subtotal 
            })),
            total_amount: total,
            paid_amount: form.paid_amount,
            payment_method: form.payment_method,
            account_id: form.account_id,
            due_amount: due, // Changed to match your backend key 'due_amount'
        };

        try {
            let res;
            if (saleId) {
                // Update existing
                res = await axios.put(`${API_BASE_URL}/api/sales/${saleId}`, payload);
            } else {
                // Create new
                res = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
            }

            if (res.data.success) {
                toast.success(saleId ? "Sale Updated!" : t.saveSuccess);
                if (!saleId) navigate(`/sales`); // Redirect after creation
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Save operation failed");
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Synchronizing Data...</div>;

    return (
        <div className="p-4 max-w-5xl mx-auto print:bg-white min-h-screen">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
                <MemoHeader 
                    t={t} lang={lang} setLang={setLang} 
                    memoNo={memoNo} setMemoNo={setMemoNo} 
                    date={date} setDate={setDate} 
                    selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} 
                />
                
                <ProductTable 
                    t={t} search={search} setSearch={setSearch} 
                    searchResults={searchResults} addProduct={addProduct} 
                    selectedProducts={selectedProducts} 
                    removeProduct={(id) => setSelectedProducts(prev => prev.filter(p => p._id !== id))} 
                    updateQty={updateQty} 
                    updatePrice={updatePrice} 
                    isCheckingStock={isCheckingStock} 
                />


                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t">
                    <div className="space-y-4">
                        <textarea placeholder={t.notes} className="w-full border rounded-lg p-2 h-24 print:hidden" />
                        <div className="flex gap-3 no-print">
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-3 rounded-xl shadow hover:bg-green-700 font-bold transition flex items-center gap-2">
                                {saleId ? "Update Memo" : "Save Memo"}
                            </button>
                            <button onClick={() => window.print()} className="border px-6 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-2">Print</button>
                        </div>
                    </div>

                    <div className="space-y-4 bg-gray-50 p-5 rounded-xl border">
                        <div className="flex justify-between font-bold text-xl border-b pb-2">
                            <span>{t.total}</span>
                            <span>৳ {total.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => setShowPaymentModal(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-bold">
                                    {form.payment_method ? `Method: ${form.payment_method.toUpperCase()}` : "Select Account"}
                                </button>
                                <div className="w-32">
                                    <InputField name="paid_amount" type="number" value={form.paid_amount} onChange={handleChange} />
                                </div>
                            </div>

                            <div className={`flex justify-between text-2xl font-extrabold pt-2 border-t ${due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span>{t.due}</span>
                                <span>৳ {due.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentModal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)} 
                onSelectPayment={handlePaymentSelect} 
                defaultPaymentMethod={form.payment_method} 
            />
        </div>
    );
};

export default SaleDetails;