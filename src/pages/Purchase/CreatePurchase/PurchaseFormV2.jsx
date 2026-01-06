import React, { useState, useEffect, useRef } from 'react';
import { Calendar, UserPlus, PackagePlus, Trash2, CreditCard, Search, MapPin, Phone, X } from 'lucide-react';
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
    const { productSearch, setProductSearch, handleProductSearch, productSearchLoading, searchResults, setProductSearchResults, addProduct, handleOpenAddProductModal, products, updateProductField, removeProduct } = productsBlock;
    const { showPaymentModal, setShowPaymentModal, handlePaymentSelect } = payment;
    const { totalPurchase, netBalance } = summary;
    const { handleSubmit, handleChange, dateTime, setDateTime, isSubmitting } = formActions;
    const { showAddProductModal, handleCloseAddProductModal, addProductApiInProgress, categories, saveNewProduct } = addProductModalProps;
    const { showAddSupplierModal, handleCloseAddSupplierModal, addSupplierApiInProgress, saveNewSupplier } = addSupplierModalProps;

    // Refs for outside click detection
    const supplierRef = useRef(null);
    const productRef = useRef(null);

    // Visibility States
    const [showSupplierResults, setShowSupplierResults] = useState(false);
    const [showProductResults, setShowProductResults] = useState(false);

    // Handle Outside Clicks
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

    // Clear Functions
    const clearSupplierSearch = () => {
        setForm({ ...form, supplier_name: "", supplierId: null });
        setSupplierSearchQuery("");
        setShowSupplierResults(false);
    };

    const clearProductSearch = () => {
        handleProductSearch({ target: { value: "" } }); // Assuming your handler updates state
        setShowProductResults(false);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-5 font-sans antialiased text-slate-700">
            {/* --- TOP HEADER BAR --- */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Order</h1>
                    <p className="text-slate-500 text-sm">Inventory Acquisition & Supplier Management</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        className="bg-transparent text-base font-medium text-slate-600 focus:outline-none"
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* --- LEFT SIDEBAR --- */}
                    <div className="lg:col-span-4 space-y-5">
                        
                        {/* Supplier Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 relative" ref={supplierRef}>
                            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center rounded-t-lg">
                                <h2 className="text-slate-800 text-base font-bold flex items-center gap-2">
                                    <Search className="w-4 h-4 text-slate-400" /> Supplier Information
                                </h2>
                                <button type="button" onClick={handleOpenAddSupplierModal} className="text-xs text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider">
                                    + Register New
                                </button>
                            </div>
                            
                            <div className="p-5 space-y-4">
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
                                        placeholder="Search supplier..."
                                        className="w-full pl-4 pr-12 py-2.5 text-base bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition"
                                    />
                                    <div className="absolute right-3 top-3 flex items-center gap-2">
                                        {form.supplier_name && (
                                            <button type="button" onClick={clearSupplierSearch} className="text-slate-400 hover:text-slate-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        {supplierSearchLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>}
                                    </div>
                                    
                                    {showSupplierResults && supplierSearchResults.length > 0 && (
                                        <ul className="absolute left-0 right-0 z-[100] bg-white border border-slate-300 rounded-md shadow-2xl mt-1 max-h-80 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black ring-opacity-5">
                                            {supplierSearchResults.map((s) => (
                                                <li key={s._id} onClick={() => { handleSelectSupplier(s); setShowSupplierResults(false); }} className="p-4 hover:bg-blue-50 cursor-pointer transition-colors">
                                                    <p className="text-base font-semibold text-slate-900">{s.name}</p>
                                                    <p className="text-sm text-slate-500">{s.phone}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className={`p-4 rounded border ${form.supplierId ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                                    {form.supplierId ? (
                                        <div className="space-y-2">
                                            <p className="text-base font-bold text-slate-800">{form.supplier_name}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500"><Phone className="w-4 h-4" /> {form.phone}</div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4" /> {form.address}</div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3 text-slate-400 text-sm italic">Selection required</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-slate-400" /> Terms & Payment
                            </h2>
                            <button type="button" onClick={() => setShowPaymentModal(true)} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded text-base font-medium text-slate-700 hover:bg-slate-100 transition flex justify-between items-center">
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-tight">Method</span>
                                <span className="text-base text-slate-900 font-semibold">{form.payment_method ? form.payment_method.toUpperCase() : 'Not Selected'}</span>
                            </button>
                            <InputField label="Amount Paid (৳)" name="paid_amount" type="number" value={form.paid_amount || ""} onChange={handleChange} placeholder="0.00" />
                        </div>
                    </div>

                    {/* --- RIGHT CONTENT --- */}
                    <div className="lg:col-span-8 space-y-5">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 overflow-visible">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Line Items</h2>
                                <button type="button" onClick={handleOpenAddProductModal} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition font-bold text-sm">
                                    <PackagePlus className="w-4 h-4" /> ADD NEW SKU
                                </button>
                            </div>

                            <div className="relative mb-6" ref={productRef}>
                                <div className="flex flex-col">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Search Product</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onFocus={() => setShowProductResults(true)}
                                            onChange={(e) => { handleProductSearch(e); setShowProductResults(true); }}
                                            placeholder="Enter item name or SKU..."
                                            className="bg-white border border-slate-300 rounded py-2.5 pl-4 pr-12 text-base w-full focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition"
                                        />
                                        <div className="absolute right-3 top-3 flex items-center gap-2">
                                            {productSearch && (
                                                <button type="button" onClick={clearProductSearch} className="text-slate-400 hover:text-slate-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {productSearchLoading && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
                                        </div>
                                    </div>
                                </div>
                                
                                {showProductResults && searchResults.length > 0 && (
                                    <ul className="absolute left-0 right-0 z-[100] bg-white border border-slate-300 rounded-md shadow-2xl mt-1 max-h-80 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black ring-opacity-5">
                                        {searchResults.map((p) => (
                                            <li key={p._id} onClick={() => { addProduct(p); setShowProductResults(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors">
                                                <div>
                                                    <span className="text-base font-semibold text-slate-800 block">{p.item_name}</span>
                                                    <span className="text-xs text-slate-500 uppercase tracking-wider">SKU: {p.sku || 'N/A'}</span>
                                                </div>
                                                <span className="text-lg font-bold text-blue-600">৳{Number(p.purchase_price || 0).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="px-5 py-3.5">Product Description</th>
                                            <th className="px-5 py-3.5 text-center w-28">Qty</th>
                                            <th className="px-5 py-3.5 text-right w-36">Unit Price</th>
                                            <th className="px-5 py-3.5 text-right w-36">Subtotal</th>
                                            <th className="px-5 py-3.5 text-center w-14"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.map((p, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-4 text-base font-medium text-slate-800">{p.item_name}</td>
                                                <td className="px-5 py-4">
                                                    <input type="number" value={p.qty} onChange={(e) => updateProductField(index, 'qty', e.target.value)} className="w-full bg-white border border-slate-200 rounded py-2 px-2 text-center text-base focus:border-slate-400 outline-none" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <input type="number" value={p.purchase_price} onChange={(e) => updateProductField(index, 'purchase_price', e.target.value)} className="w-full bg-white border border-slate-200 rounded py-2 px-2 text-right text-base focus:border-slate-400 outline-none" />
                                                </td>
                                                <td className="px-5 py-4 text-right text-base font-bold text-slate-900">
                                                    {(Number(p.qty || 0) * Number(p.purchase_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button type="button" onClick={() => removeProduct(index)} className="text-slate-300 hover:text-red-600 transition">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- TOTALS BAR --- */}
                        <div className="bg-slate-800 rounded-lg p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Payable</p>
                                    <p className="text-3xl font-bold tracking-tight">৳{totalPurchase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="border-l border-slate-700 pl-12">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                                    <p className={`text-xl font-semibold ${netBalance >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                                        {netBalance >= 0 ? `Due: ৳${netBalance.toFixed(2)}` : `Credit: ৳${Math.abs(netBalance).toFixed(2)}`}
                                    </p>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting || products.length === 0 || !form.supplierId} className="w-full md:w-auto px-12 bg-white text-slate-900 hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 py-4 rounded text-base font-bold transition-all uppercase tracking-widest shadow-lg">
                                {isSubmitting ? 'Finalizing...' : 'Submit Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <AddProductModal isOpen={showAddProductModal} onClose={handleCloseAddProductModal} apiInProgress={addProductApiInProgress} categories={categories} onSave={saveNewProduct} />
            <AddSupplierModal isOpen={showAddSupplierModal} onClose={handleCloseAddSupplierModal} apiInProgress={addSupplierApiInProgress} onSave={saveNewSupplier} />
            <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSelectPayment={handlePaymentSelect} defaultPaymentMethod={form.payment_method} />
        </div>
    );
};

export const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-white border border-slate-300 rounded py-2.5 px-4 text-base w-full focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition duration-200 placeholder:text-slate-300"
            required={required}
        />
    </div>
);

export default PurchaseFormV2;