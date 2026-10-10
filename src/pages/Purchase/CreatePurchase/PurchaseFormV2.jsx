import React, { useState, useEffect, useRef } from 'react';
import { Calendar, PackagePlus, Trash2, CreditCard, Search, MapPin, Phone, X, ShoppingBag } from 'lucide-react';
import PaymentModal from '../PaymentModal';
import AddSupplierModal from './AddSupplierModal';
import AddProductModal from '../../../components/AddProductModal/AddProductModal';

const PurchaseFormV2 = ({ 
    supplier,
    productsBlock,
    payment,
    summary,
    formActions,
    addProductModalProps,
    addSupplierModalProps
}) => {
    const { form, setForm, supplierSearchLoading, supplierSearchResults, setSupplierSearchQuery, handleSelectSupplier, handleOpenAddSupplierModal } = supplier;
    const { productSearch, handleProductSearch, productSearchLoading, searchResults, addProduct, handleOpenAddProductModal, products, updateProductField, removeProduct } = productsBlock;
    const { showPaymentModal, setShowPaymentModal, handlePaymentSelect } = payment;
    const { totalPurchase, netBalance } = summary;
    const { handleSubmit, handleChange, dateTime, setDateTime, isSubmitting } = formActions;

    const supplierRef = useRef(null);
    const productRef = useRef(null);

    const [showSupplierResults, setShowSupplierResults] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (supplierRef.current && !supplierRef.current.contains(event.target)) {
                setShowSupplierResults(false);
            }
            if (productRef.current && !productRef.current.contains(event.target)) {
                setShowProductResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const clearSupplierSearch = () => {
        setForm({ ...form, supplier_name: "", supplierId: null });
        setSupplierSearchQuery("");
        setShowSupplierResults(false);
    };

    const clearProductSearch = () => {
        handleProductSearch({ target: { value: "" } });
        setShowProductResults(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-700">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Purchase Order Entry</h1>
                        <p className="text-xs text-slate-400">Inventory Sourcing & Supplier Procurement</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none"
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Supplier & Payment */}
                    <div className="lg:col-span-4 space-y-5">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" ref={supplierRef}>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Search className="w-4 h-4 text-blue-600" /> Supplier Account
                                </span>
                                <button
                                    type="button"
                                    onClick={handleOpenAddSupplierModal}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                                >
                                    + Register New
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={form.supplier_name}
                                    onFocus={() => setShowSupplierResults(true)}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setForm({ ...form, supplier_name: value, supplierId: null });
                                        setSupplierSearchQuery(value);
                                        setShowSupplierResults(true);
                                    }}
                                    placeholder="Search supplier by name or phone..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                />
                                <div className="absolute right-3 top-2.5 flex items-center gap-2">
                                    {form.supplier_name && (
                                        <button type="button" onClick={clearSupplierSearch} className="text-slate-400 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {supplierSearchLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>}
                                </div>

                                {showSupplierResults && supplierSearchResults.length > 0 && (
                                    <ul className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                                        {supplierSearchResults.map((s) => (
                                            <li
                                                key={s._id}
                                                onClick={() => { handleSelectSupplier(s); setShowSupplierResults(false); }}
                                                className="p-3 hover:bg-blue-50/70 cursor-pointer transition flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                                    <p className="text-slate-400">{s.phone || 'No phone'}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                                    Due: ৳{Number(s.due || 0).toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className={`p-4 rounded-xl border text-xs ${form.supplierId ? 'bg-blue-50/60 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                                {form.supplierId ? (
                                    <div className="space-y-1.5">
                                        <p className="font-bold text-slate-900 text-sm">{form.supplier_name}</p>
                                        <p className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {form.phone || 'N/A'}</p>
                                        <p className="flex items-center gap-1.5 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {form.address || 'N/A'}</p>
                                    </div>
                                ) : (
                                    <p className="text-center py-2 text-slate-400 italic">No supplier selected</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                <CreditCard className="w-4 h-4 text-blue-600" /> Payment & Disbursement
                            </span>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Paying Channel</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 transition"
                                >
                                    <span className="uppercase">{form.payment_method || 'Select Account'}</span>
                                    <span className="text-blue-600">Change</span>
                                </button>
                            </div>

                            <InputField
                                label="Paid In Advance / At Purchase (৳)"
                                name="paid_amount"
                                type="number"
                                value={form.paid_amount || ""}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Right: Products List */}
                    <div className="lg:col-span-8 space-y-5">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Purchased SKUs</h2>
                                <button
                                    type="button"
                                    onClick={handleOpenAddProductModal}
                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                                >
                                    <PackagePlus className="w-4 h-4" /> Add New SKU
                                </button>
                            </div>

                            {/* Product Search */}
                            <div className="relative mb-5" ref={productRef}>
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onFocus={() => setShowProductResults(true)}
                                    onChange={(e) => { handleProductSearch(e); setShowProductResults(true); }}
                                    placeholder="Search product by name or barcode..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                />
                                {productSearch && (
                                    <button type="button" onClick={clearProductSearch} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}

                                {showProductResults && searchResults.length > 0 && (
                                    <ul className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                                        {searchResults.map((p) => (
                                            <li
                                                key={p._id}
                                                onClick={() => { addProduct(p); setShowProductResults(false); }}
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
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Item Description</th>
                                            <th className="px-3 py-3 text-center w-24">Unit</th>
                                            <th className="px-3 py-3 text-right w-24">Qty</th>
                                            <th className="px-3 py-3 text-right w-32">Rate (৳)</th>
                                            <th className="px-4 py-3 text-right w-36">Subtotal (৳)</th>
                                            <th className="px-3 py-3 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-400 italic text-xs">
                                                    No products selected. Search item above.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((p, index) => (
                                                <tr key={p._id || index} className="hover:bg-slate-50/60 transition">
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{p.item_name}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded font-semibold uppercase">
                                                            {p.unit || 'pcs'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={p.qty}
                                                            onChange={(e) => updateProductField(index, 'qty', e.target.value)}
                                                            className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:bg-white outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={p.purchase_price}
                                                            onChange={(e) => updateProductField(index, 'purchase_price', e.target.value)}
                                                            className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:bg-white outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                                                        ৳{(Number(p.qty || 0) * Number(p.purchase_price || 0)).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProduct(index)}
                                                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                            <div className="flex gap-8 items-center">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Order Total</p>
                                    <p className="text-2xl font-black font-mono tracking-tight text-white">
                                        ৳{totalPurchase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="border-l border-slate-700 pl-8">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Net Settlement Balance</p>
                                    <p className={`text-base font-bold font-mono ${netBalance >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {netBalance >= 0 ? `Payable Due: ৳${netBalance.toFixed(2)}` : `Advance: ৳${Math.abs(netBalance).toFixed(2)}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || products.length === 0 || !form.supplierId}
                                className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-md"
                            >
                                {isSubmitting ? 'Finalizing...' : 'Save Purchase Memo'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <AddProductModal {...addProductModalProps} />
            <AddSupplierModal {...addSupplierModalProps} />
            <PaymentModal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)} 
                onSelectPayment={handlePaymentSelect} 
                defaultPaymentMethod={form.payment_method} 
            />
        </div>
    );
};

export const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            required={required}
        />
    </div>
);

export default PurchaseFormV2;