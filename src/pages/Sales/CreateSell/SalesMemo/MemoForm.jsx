// MemoForm.jsx - UPDATED with Stock Display in selectedProducts

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Import the sub-components
import MemoHeader from "./MemoHeader";
import ProductTable from "./ProductTable"; // Ensure this component is updated to display 'availableStock'
import MemoFooter from "./MemoFooter";
import textConstants from "./memoTexts";

const MemoForm = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [lang, setLang] = useState("en");
    const t = useMemo(() => textConstants[lang], [lang]);

    // Form State
    const [memoNo, setMemoNo] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [paidAmount, setPaidAmount] = useState(0);

    // Customer State
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Product State
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    // --- API / Side Effects (Product Search) ---
    useEffect(() => {
        const id = setTimeout(() => {
            const q = (search || "").trim();
            if (!q) {
                setSearchResults([]);
                return;
            }
            axios
                .get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`)
                .then((res) => {
                    if (res?.data?.success) setSearchResults(res.data.data || []);
                    else setSearchResults([]);
                })
                .catch(() => setSearchResults([]));
        }, 300);
        return () => clearTimeout(id);
    }, [search, API_BASE_URL]);

    // --- API Helper: Checks the current stock level for a product. ---
    const checkStock = async (productId) => {
        // ASSUMPTION: This route returns { success: true, stock: number }
        const url = `${API_BASE_URL}/api/inventory/stock/${productId}`;
        const res = await axios.get(url);
        console.log(res);
        if (res?.data?.success) {
            return Number(res.data.stock) || 0;
        }
        return 0;
    };

    // --- Product Manipulation Logic ---
    const addProduct = async (product) => {
        if (isCheckingStock) return;

        const exists = selectedProducts.find((p) => p._id === product._id);
        if (exists) {
            toast.warn(`Product '${product.item_name}' is already in the memo.`);
            setSearch("");
            setSearchResults([]);
            return;
        }

        setIsCheckingStock(true);
        try {
            const availableStock = await checkStock(product._id);
            const requestedQty = 1;

            // --- Stock Validation Logic ---
            if (availableStock < requestedQty) {
                const proceed = window.confirm(
                    `${t.stockLowWarning} '${product.item_name}'! Available: ${availableStock}. Do you want to proceed and sell on advance/credit?`
                );

                if (!proceed) {
                    setIsCheckingStock(false);
                    return;
                }
            } else {
                toast.success(`${t.stockAvailable}: ${availableStock}`);
            }

            // --- Add Product to Memo (Core Logic) ---
            const price = Number(product.price) || 0;
            setSelectedProducts([
                ...selectedProducts,
                { 
                    ...product, 
                    qty: requestedQty, 
                    price, 
                    subtotal: price * requestedQty,
                    // 🔑 NEW: Store the available stock for display 
                    availableStock: availableStock, 
                },
            ]);

            setSearch("");
            setSearchResults([]);

        } catch (error) {
            console.error("Stock check failed:", error);
            toast.error(t.stockCheckError || "Failed to check stock.");
        } finally {
            setIsCheckingStock(false);
        }
    };

    const removeProduct = (id) =>
        setSelectedProducts((prev) => prev.filter((p) => p._id !== id));

    const updateQty = (id, qtyRaw) => {
        const qty = Number(qtyRaw) || 0;
        setSelectedProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, qty, subtotal: +(qty * p.price).toFixed(2) } : p))
        );
    };

    const updatePrice = (id, priceRaw) => {
        const price = Number(priceRaw) || 0;
        setSelectedProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, price, subtotal: +(p.qty * price).toFixed(2) } : p))
        );
    };

    // --- Derived Values (Totals) ---
    const total = selectedProducts.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
    const due = Number(total.toFixed(2)) - Number((paidAmount || 0).toFixed(2));

    // --- Save Handler ---
    const handleSave = async () => {
        if (!memoNo.trim()) {
            alert(t.saveAlertMemoNo);
            return;
        }
        if (!selectedCustomer || !selectedCustomer.name.trim()) {
            alert(t.saveAlertName);
            return;
        }
        if (selectedProducts.length === 0) {
            alert(t.saveAlertProducts);
            return;
        }
        const invalidQty = selectedProducts.some(p => p.qty <= 0);
        if (invalidQty) {
            toast.error("Please ensure all product quantities are greater than zero.");
            return;
        }

        const payload = {
            memoNo,
            date,
            customer: {
                _id: selectedCustomer._id,
                name: selectedCustomer.name,
            },
            products: selectedProducts.map((p) => ({
                _id: p._id,
                item_name: p.item_name,
                qty: p.qty,
                price: p.price,
                subtotal: p.subtotal,
            })),
            total: Number(total.toFixed(2)),
            paidAmount: Number(paidAmount.toFixed(2)),
            due: Number(due.toFixed(2)),
        };

        console.log("SAVE MEMO PAYLOAD", payload);
        try {
            const result = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
            const data = result.data;
            if (data.success) {
                toast.success(t.saveSuccess);
            } else {
                toast.error(data.message || "Not created")
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save memo. Check console for details.");
        }
    };

    // --- Render ---
    return (
        <div className="p-4 max-w-5xl mx-auto print:bg-white min-h-screen">
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-table { page-break-inside: avoid; }
                    .print-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                }
            `}</style>

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">

                <MemoHeader
                    t={t}
                    lang={lang}
                    setLang={setLang}
                    memoNo={memoNo}
                    setMemoNo={setMemoNo}
                    date={date}
                    setDate={setDate}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                />

                <ProductTable
                    t={t}
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    addProduct={addProduct}
                    selectedProducts={selectedProducts}
                    removeProduct={removeProduct}
                    updateQty={updateQty}
                    updatePrice={updatePrice}
                    isCheckingStock={isCheckingStock}
                />

                <MemoFooter
                    t={t}
                    total={total}
                    paidAmount={paidAmount}
                    setPaidAmount={setPaidAmount}
                    due={due}
                    handleSave={handleSave}
                />
            </div>
        </div>
    );
};

export default MemoForm;