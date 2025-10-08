// MemoForm.jsx - UPDATED
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// Import the sub-components
import MemoHeader from "./MemoHeader";
import ProductTable from "./ProductTable";
import MemoFooter from "./MemoFooter";
import textConstants from "./memoTexts";
import { toast } from "react-toastify";
const MemoForm = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URLLL;
  const [lang, setLang] = useState("en"); // "en" or "bn"
  const t = useMemo(() => textConstants[lang], [lang]);

  // Form State
  const [memoNo, setMemoNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState(0);

  // Customer State (New)
  const [selectedCustomer, setSelectedCustomer] = useState(null); // { _id, name, address, phone }

  // Product State
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // --- API / Side Effects (Product Search) ---
  useEffect(() => {
    const id = setTimeout(() => {
      const q = (search || "").trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      // Placeholder API call (replace with your actual logic)
      axios
        .get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (res?.data?.success) setSearchResults(res.data.data || []);
          else setSearchResults([]);
        })
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  // --- Product Manipulation Logic (Same as before) ---
  const addProduct = (product) => {
    const exists = selectedProducts.find((p) => p._id === product._id);
    if (!exists) {
      const price = Number(product.price) || 0;
      setSelectedProducts([
        ...selectedProducts,
        { ...product, qty: 1, price, subtotal: price * 1 },
      ]);
    }
    setSearch("");
    setSearchResults([]);
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
    // Updated validation to check for selectedCustomer
    if (!selectedCustomer || !selectedCustomer.name.trim()) {
      alert(t.saveAlertName);
      return;
    }
    if (selectedProducts.length === 0) {
      alert(t.saveAlertProducts);
      return;
    }

    const payload = {
      memoNo,
      date,
      // Pass selected customer details
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

    // Placeholder: replace with your backend endpoint
    console.log("SAVE MEMO PAYLOAD", payload);
    const result = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
    const data = result.data;
    console.log(data);
    if (data.success) {
      toast.success(t.saveSuccess);
    } else {
      toast.error("Not created")
    }
  };

  // --- Render ---
  return (
    <div className="p-4 max-w-5xl mx-auto print:bg-white min-h-screen">
      {/* Print CSS Styles (Same as before) */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-table { page-break-inside: avoid; }
          .print-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        }
      `}</style>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">

        <MemoHeader
          t={t}
          lang={lang}
          setLang={setLang}
          memoNo={memoNo}
          setMemoNo={setMemoNo}
          date={date}
          setDate={setDate}
          selectedCustomer={selectedCustomer} // NEW
          setSelectedCustomer={setSelectedCustomer} // NEW
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