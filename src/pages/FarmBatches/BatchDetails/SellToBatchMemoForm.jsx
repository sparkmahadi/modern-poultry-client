// SellToBatchMemoForm.jsx - UPDATED with Advanced Payment Logic
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Import the sub-components
import MemoHeader from "./MemoHeader";
import ProductTable from "./ProductTable";
import textConstants from "./memoTexts";
import PaymentModal from "../../Purchase/PaymentModal";
import { InputField } from "../../Purchase/FormComponents";

// Imported from Purchase/Common components to match MemoForm behavior

const SellToBatchMemoForm = ({ batchData, selectedCustomer }) => {
    console.log(selectedCustomer);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [lang, setLang] = useState("en");
    const t = useMemo(() => textConstants[lang], [lang]);

    // --- State Management ---
    const [memoNo, setMemoNo] = useState("");
    // const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
            const [dateTime, setDateTime] = useState("");
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Product State
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    // Unified Payment State (Matches MemoForm)
    const [paymentForm, setPaymentForm] = useState({
        payment_method: "",
        account_id: "",
        paid_amount: 0,
    });

    // --- Data Fetching: Accounts (New logic for accounting) ---
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
                setAccountList(res.data.data || []);
            } catch (err) {
                console.error("Failed to fetch accounts", err);
            }
        };
        fetchAccounts();
    }, [API_BASE_URL]);

    // Auto-select default account when payment method changes
    useEffect(() => {
        if (!paymentForm.payment_method || accountList.length === 0) return;
        const defaultAcc = accountList.find(
            (acc) => acc.type === paymentForm.payment_method && acc.is_default
        );
        if (defaultAcc) {
            setPaymentForm(prev => ({ ...prev, account_id: defaultAcc._id }));
        }
    }, [paymentForm.payment_method, accountList]);

    // --- Stock Check Logic (Old functionality preserved) ---
    const checkStock = async (productId) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${productId}`);
            if (res?.data?.success) return Number(res.data.stock) || 0;
            return 0;
        } catch { return 0; }
    };

    // --- Product Handlers ---
    const addProductToMemo = async (product) => {
        if (isCheckingStock) return;
        if (selectedProducts.find((p) => p._id === product._id)) {
            return toast.warn(`Product already in memo.`);
        }

        setIsCheckingStock(true);
        try {
            const availableStock = await checkStock(product._id);
            if (availableStock < 1) {
                const proceed = window.confirm(`${t.stockLowWarning} Available: ${availableStock}. Proceed?`);
                if (!proceed) return;
            }

            const price = Number(product.price) || 0;
            setSelectedProducts([...selectedProducts, {
                ...product,
                qty: 1,
                price,
                subtotal: price,
                availableStock
            }]);
            setSearch("");
            setSearchResults([]);
        } finally {
            setIsCheckingStock(false);
        }
    };

    const updateQty = (id, qtyRaw) => {
        const qty = Number(qtyRaw) || 0;
        setSelectedProducts(prev => prev.map(p => 
            p._id === id ? { ...p, qty, subtotal: +(qty * p.price).toFixed(2) } : p
        ));
    };

    // --- Calculations ---
    const total = selectedProducts.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
    const due = Number(total.toFixed(2)) - Number((paymentForm.paid_amount || 0).toFixed(2));

    // --- Save Handler (Unified Logic) ---
    const handleSave = async () => {
        if (!memoNo.trim()) return toast.error(t.saveAlertMemoNo);
        if (!selectedCustomer) return toast.error(t.saveAlertName);
        if (selectedProducts.length === 0) return toast.error(t.saveAlertProducts);
        if (paymentForm.paid_amount > 0 && !paymentForm.payment_method) {
            return toast.error("Please select a payment method/account for the paid amount.");
        }

        const payload = {
            memoNo,
            date: dateTime,
            customer_id:  selectedCustomer._id,
            products: selectedProducts.map(p => ({
                product_id: p._id,
                qty: p.qty,
                sale_price: p.price,
                subtotal: p.subtotal,
            })),
            total_amount: total,
            paid_amount: Number(paymentForm.paid_amount.toFixed(2)),
            payment_method: paymentForm.payment_method,
            account_id: paymentForm.account_id,
            payment_due: Number(due.toFixed(2)),
            batch_id : batchData?._id,
        };

        console.log(payload);

        try {
            // 1. Create Sale
            const saleRes = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
            if (saleRes.data.success) {
                toast.success("Sale memo created successfully");
                
                // 2. Attach to Batch (Old functionality logic)
                const memoId = saleRes.data.memoId;
                const batchId = batchData._id;
                await axios.post(`${API_BASE_URL}/api/batches/add-sell-history`, { memoId, batchId });
                toast.success("Batch updated with sale history");
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save sale memo.");
        }
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

    return (
        <div className="p-4 max-w-5xl mx-auto print:bg-white min-h-screen">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <MemoHeader 
                    t={t} lang={lang} setLang={setLang} 
                    memoNo={memoNo} setMemoNo={setMemoNo} 
                    dateTime={dateTime} setDateTime={setDateTime}
                    selectedCustomer={selectedCustomer} 
                />

                <ProductTable 
                    t={t} search={search} setSearch={setSearch} 
                    searchResults={searchResults} addProduct={addProductToMemo} 
                    selectedProducts={selectedProducts} 
                    removeProduct={(id) => setSelectedProducts(prev => prev.filter(p => p._id !== id))} 
                    updateQty={updateQty} 
                    updatePrice={(id, pr) => setSelectedProducts(prev => prev.map(p => p._id === id ? {...p, price: Number(pr), subtotal: +(p.qty * Number(pr)).toFixed(2)} : p))}
                    isCheckingStock={isCheckingStock} 
                />

                {/* Integrated Footer Logic from MemoForm */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t">
                    <div className="space-y-4">
                        <textarea placeholder={t.notes} className="w-full border rounded-lg p-2 h-24 print:hidden" />
                        <div className="flex gap-3 no-print">
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-3 rounded-xl shadow hover:bg-green-700 font-bold transition">
                                Save Memo
                            </button>
                            <button onClick={() => window.print()} className="border px-6 py-3 rounded-xl hover:bg-gray-50">
                                Print
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 bg-gray-50 p-5 rounded-xl border">
                        <div className="flex justify-between font-bold text-xl border-b pb-2">
                            <span>{t.total}</span>
                            <span>৳ {total.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <button 
                                    type="button" 
                                    onClick={() => setShowPaymentModal(true)} 
                                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    {paymentForm.payment_method ? `Method: ${paymentForm.payment_method.toUpperCase()}` : "Select Account"}
                                </button>
                                <div className="w-32">
                                    <InputField 
                                        name="paid_amount" 
                                        type="number" 
                                        value={paymentForm.paid_amount} 
                                        onChange={(e) => setPaymentForm(prev => ({...prev, paid_amount: Number(e.target.value)}))} 
                                    />
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
                onSelectPayment={({ paymentMethod, accountId }) => setPaymentForm(prev => ({...prev, payment_method: paymentMethod, account_id: accountId }))} 
                defaultPaymentMethod={paymentForm.payment_method} 
            />
        </div>
    );
};

export default SellToBatchMemoForm;