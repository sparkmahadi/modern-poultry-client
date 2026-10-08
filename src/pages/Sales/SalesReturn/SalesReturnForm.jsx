import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Sub-components & Modals
import SalesReturnProductTable from "./SalesReturnProductTable";
import MemoHeader from "../Sales/Memo/MemoHeader"; // Reuses your existing MemoHeader
import PaymentModal from "../../../Purchase/PaymentModal";
import { InputField } from "../../../Purchase/FormComponents";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SalesReturnForm = () => {
    const [lang, setLang] = useState("en");

    // --- State Management ---
    const [returnMemoNo, setReturnMemoNo] = useState(`SR-${Date.now().toString().slice(-6)}`);
    const [originalMemoNo, setOriginalMemoNo] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [dateTime, setDateTime] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [accountList, setAccountList] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product Search & Selection
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    // Payment / Refund State
    const [form, setForm] = useState({
        payment_method: "",
        account_id: "",
        refund_amount: 0, // Cash or bank disbursed immediately to customer
    });

    // Initialize local datetime string
    useEffect(() => {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setDateTime(local);
    }, []);

    // Fetch Payment Accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
                setAccountList(res.data.data || []);
            } catch (err) {
                console.error("Accounts fetch failed", err);
            }
        };
        fetchAccounts();
    }, []);

    // Auto-select default payment account
    useEffect(() => {
        if (!form.payment_method || accountList.length === 0) return;
        const defaultAcc = accountList.find(acc => acc.type === form.payment_method && acc.is_default);
        if (defaultAcc) setForm(prev => ({ ...prev, account_id: defaultAcc._id }));
    }, [form.payment_method, accountList]);

    // --- Calculations ---
    const totalReturnAmount = useMemo(() => {
        return selectedProducts.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
    }, [selectedProducts]);

    // Financial adjustment: 
    // Return value reduces customer's existing balance due. 
    // Any immediate cash refund paid out negates that reduction.
    const currentCustomerDue = Number(selectedCustomer?.due || 0);
    const adjustedCustomerDue = useMemo(() => {
        const netAdjustment = totalReturnAmount - Number(form.refund_amount || 0);
        return Math.max(0, currentCustomerDue - netAdjustment);
    }, [currentCustomerDue, totalReturnAmount, form.refund_amount]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handlePaymentSelect = ({ paymentMethod, accountId }) => {
        setForm(prev => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
    };

    // Debounced Product Search
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

    // Add Product with Live Stock Check
    const addProduct = async (product) => {
        if (selectedProducts.find(p => p._id === product._id)) {
            return toast.warn("Product is already added in return table.");
        }

        setIsCheckingStock(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/inventory/stock/${product._id}`);
            const stock = res.data?.stock || 0;

            setSelectedProducts(prev => [
                ...prev,
                {
                    ...product,
                    qty: 1,
                    price: Number(product.price || product.sale_price || 0),
                    subtotal: Number(product.price || product.sale_price || 0),
                    availableStock: stock,
                    reason: "Quality / Mortality"
                }
            ]);
            setSearch("");
            setSearchResults([]);
        } catch (err) {
            console.error("Stock check error:", err);
            toast.error("Failed to verify current stock.");
        } finally {
            setIsCheckingStock(false);
        }
    };

    const updateQty = (id, qty) => {
        const numericQty = Number(qty) || 0;
        setSelectedProducts(prev =>
            prev.map(p =>
                p._id === id
                    ? { ...p, qty: numericQty, subtotal: +(numericQty * p.price).toFixed(2) }
                    : p
            )
        );
    };

    const updatePrice = (id, price) => {
        const numericPrice = Number(price) || 0;
        setSelectedProducts(prev =>
            prev.map(p =>
                p._id === id
                    ? { ...p, price: numericPrice, subtotal: +(p.qty * numericPrice).toFixed(2) }
                    : p
            )
        );
    };

    // Bidirectional Subtotal Calculation matching MemoForm
    const updateSubtotal = (id, subtotal) => {
        setSelectedProducts(prev =>
            prev.map(item => {
                if (item._id !== id) return item;
                const qty = Number(item.qty) || 0;
                const subtotalValue = Number(subtotal) || 0;
                return {
                    ...item,
                    subtotal: subtotalValue,
                    price: qty > 0 ? +(subtotalValue / qty).toFixed(2) : 0,
                };
            })
        );
    };

    const updateReason = (id, reason) => {
        setSelectedProducts(prev =>
            prev.map(p => p._id === id ? { ...p, reason } : p)
        );
    };

    const removeProduct = (id) => {
        setSelectedProducts(prev => prev.filter(p => p._id !== id));
    };

    // --- Submission ---
    const handleSave = async () => {
        if (!returnMemoNo) return toast.error("Return Memo Number is required.");
        if (!selectedCustomer) return toast.error("Please select a customer.");
        if (selectedProducts.length === 0) return toast.error("Add at least one product to return.");
        if (form.refund_amount > 0 && !form.payment_method) {
            return toast.error("Select payment account for refunded cash.");
        }

        const payload = {
            return_memo_no: returnMemoNo,
            original_memo_no: originalMemoNo,
            date: dateTime,
            customer_id: selectedCustomer._id,
            products: selectedProducts.map(p => ({
                product_id: p._id,
                name: p.item_name || p.name,
                qty: Number(p.qty),
                return_price: Number(p.price),
                subtotal: Number(p.subtotal),
                reason: p.reason
            })),
            total_return_amount: totalReturnAmount,
            refund_amount: Number(form.refund_amount) || 0,
            payment_method: form.payment_method || null,
            account_id: form.account_id || null,
            notes: notes
        };

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/sales/return`, payload);
            if (res.data?.success) {
                toast.success(res.data.message || "Sales return memo created successfully!");
                setSelectedProducts([]);
                setForm({ payment_method: "", account_id: "", refund_amount: 0 });
                setNotes("");
            } else {
                toast.info(res.data?.message || "Operation completed with notices.");
            }
        } catch (err) {
            console.error("Sales return failed", err);
            toast.error("Save Failed - " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto print:bg-white min-h-screen">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-amber-100">
                {/* Top Notification / Banner */}
                <div className="bg-amber-600 text-white px-6 py-2.5 flex justify-between items-center text-sm font-semibold">
                    <span className="flex items-center gap-2">
                        <span>↩️</span> Sales Return & Credit Memo Mode
                    </span>
                    <span className="text-amber-100 text-xs">Increases Inventory Stock & Adjusts Balance</span>
                </div>

                {/* Memo Header Integration */}
                <MemoHeader
                    lang={lang}
                    setLang={setLang}
                    memoNo={returnMemoNo}
                    setMemoNo={setReturnMemoNo}
                    date={date}
                    setDate={setDate}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    dateTime={dateTime}
                    setDateTime={setDateTime}
                />

                {/* Optional Original Memo Link */}
                <div className="px-6 py-2 bg-amber-50/50 border-b border-gray-200 flex items-center gap-4 text-sm no-print">
                    <label className="font-semibold text-gray-700 whitespace-nowrap">Original Memo Ref # (Optional):</label>
                    <input
                        type="text"
                        value={originalMemoNo}
                        onChange={(e) => setOriginalMemoNo(e.target.value)}
                        placeholder="e.g. INV-10492"
                        className="border border-gray-300 rounded px-3 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-64"
                    />
                </div>

                {/* Products Table with Return Stock Math (+ Instead of -) */}
                <SalesReturnProductTable
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    addProduct={addProduct}
                    selectedProducts={selectedProducts}
                    removeProduct={removeProduct}
                    updateQty={updateQty}
                    updatePrice={updatePrice}
                    updateSubtotal={updateSubtotal}
                    updateReason={updateReason}
                    isCheckingStock={isCheckingStock}
                />

                {/* Bottom Section: Notes & Financial Settlements */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t">
                    {/* Left: Notes & Action Buttons */}
                    <div className="space-y-4">
                        <textarea
                            placeholder="Reason for return, driver note, or physical voucher number..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded-lg p-2.5 h-28 print:hidden text-sm focus:ring-2 focus:ring-amber-200 outline-none"
                        />
                        <div className="flex gap-3 no-print">
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting || selectedProducts.length === 0}
                                className="bg-amber-600 text-white px-6 py-3 rounded-xl shadow hover:bg-amber-700 font-bold transition flex items-center gap-2 disabled:bg-gray-400"
                            >
                                {isSubmitting ? "Saving..." : "Save Return Memo"}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700"
                            >
                                Print Voucher
                            </button>
                        </div>
                    </div>

                    {/* Right: Payment, Customer Due & Balance Calculations */}
                    <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                        {/* Total Return Amount */}
                        <div className="flex justify-between font-bold text-xl border-b pb-2 text-gray-800">
                            <span>Total Return Value</span>
                            <span className="text-amber-700">৳ {totalReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        {/* Customer Current Due */}
                        {selectedCustomer && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Previous Receivable Due:</span>
                                <span className="font-semibold text-gray-800">৳ {currentCustomerDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        {/* Cash Refund Disbursement */}
                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                                Immediate Cash Refund Given (Optional)
                            </label>
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                    className="text-sm bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-900 transition whitespace-nowrap"
                                >
                                    {form.payment_method ? `From: ${form.payment_method.toUpperCase()}` : "Disburse Account"}
                                </button>
                                <div className="w-36">
                                    <InputField
                                        name="refund_amount"
                                        type="number"
                                        value={form.refund_amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            {form.payment_method && form.account_id && (
                                <p className="text-xs text-green-700 font-medium">
                                    Disbursing from account: {form.account_id}
                                </p>
                            )}

                            {/* Net Balance Receivable After Return */}
                            <div className="flex justify-between text-xl font-extrabold pt-3 border-t text-gray-800">
                                <span>Updated Balance Due:</span>
                                <span className={adjustedCustomerDue > 0 ? "text-red-600" : "text-green-600"}>
                                    ৳ {adjustedCustomerDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal Re-use */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSelectPayment={handlePaymentSelect}
                defaultPaymentMethod={form.payment_method}
            />
        </div>
    );
};

export default SalesReturnForm;