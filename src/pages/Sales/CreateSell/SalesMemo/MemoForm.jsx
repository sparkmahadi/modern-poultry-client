import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Sub-components
import MemoHeader from "./MemoHeader";
import ProductTable from "./ProductTable";
import textConstants from "./memoTexts";
import PaymentModal from "../../../Purchase/PaymentModal";
import { InputField } from "../../../Purchase/FormComponents";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MemoForm = () => {
    const [lang, setLang] = useState("en");
    const t = useMemo(() => textConstants[lang], [lang]);

    // --- State Management ---
    const [memoNo, setMemoNo] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [error, setError] = useState("");
    
    // Product Search & Selection
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    // Form state for Payment Logic (Replicated from PurchaseForm)
    const [form, setForm] = useState({
        payment_method: "",
        account_id: "",
        paid_amount: 0,
    });

    // --- Payment Logic & Initial Data ---
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
                setAccountList(res.data.data || []);
            } catch (err) { console.error("Accounts fetch failed", err); }
        };
        fetchAccounts();
    }, []);

    // Auto-select default account when payment method changes
    useEffect(() => {
        if (!form.payment_method || accountList.length === 0) return;
        const defaultAcc = accountList.find(acc => acc.type === form.payment_method && acc.is_default);
        if (defaultAcc) setForm(prev => ({ ...prev, account_id: defaultAcc._id }));
    }, [form.payment_method, accountList]);

    // --- Derived Calculations ---
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

    const handleSave = async () => {
        if (!memoNo ) return toast.error("Missing memono");
        if (!selectedCustomer) return toast.error("Missing selected customer");
        if (selectedProducts.length === 0) return toast.error("Missing length");
        if (form.paid_amount > 0 && !form.payment_method) return toast.error("Select payment method for paid amount.");

        const payload = {
            memoNo, date, customer_id: selectedCustomer._id,
            products: selectedProducts.map(p => ({ product_id: p._id, qty: p.qty, sale_price: p.price, subtotal: p.subtotal, name:p.item_name })),
            total_amount: total,
            paid_amount: form.paid_amount,
            payment_method: form.payment_method,
            account_id: form.account_id,
            payment_due: due,
        };

        try {
            const res = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
            if (res.data.success) {
                toast.success(t.saveSuccess)
            } else{
                toast.info(res.data.message);
            }
        } catch (err) { toast.error("Save Failed -" + err.response.data.message); }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto print:bg-white min-h-screen">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <MemoHeader t={t} lang={lang} setLang={setLang} memoNo={memoNo} setMemoNo={setMemoNo} date={date} setDate={setDate} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
                
                <ProductTable t={t} search={search} setSearch={setSearch} searchResults={searchResults} addProduct={addProduct} selectedProducts={selectedProducts} removeProduct={(id) => setSelectedProducts(prev => prev.filter(p => p._id !== id))} updateQty={updateQty} updatePrice={(id, p) => setSelectedProducts(prev => prev.map(item => item._id === id ? { ...item, price: Number(p), subtotal: +(item.qty * Number(p)).toFixed(2) } : item))} isCheckingStock={isCheckingStock} />

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t">
                    {/* Left: Notes & Actions */}
                    <div className="space-y-4">
                        <textarea placeholder={t.notes} className="w-full border rounded-lg p-2 h-24 print:hidden" />
                        <div className="flex gap-3 no-print">
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-3 rounded-xl shadow hover:bg-green-700 font-bold transition flex items-center gap-2">Save Memo</button>
                            <button onClick={() => window.print()} className="border px-6 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-2">Print</button>
                        </div>
                    </div>

                    {/* Right: Payment & Totals */}
                    <div className="space-y-4 bg-gray-50 p-5 rounded-xl border">
                        <div className="flex justify-between font-bold text-xl border-b pb-2">
                            <span>{t.total}</span>
                            <span>৳ {total.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => setShowPaymentModal(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
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

export default MemoForm;