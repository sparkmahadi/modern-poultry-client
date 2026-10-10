// AddProductModal.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, PackagePlus } from 'lucide-react';

const COMMON_UNITS = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'bag', label: 'Bag / Sack (bag)' },
    { value: 'liter', label: 'Liter (L)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'gram', label: 'Gram (g)' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'strip', label: 'Strip' },
    { value: 'box', label: 'Box' },
];

const initialProductData = {
    item_name: '',
    unit: 'pcs',
    quantity: 1, 
    price: 0,
    date: new Date().toISOString().slice(0, 10), 
    category_id: '',
    notes: '',
};

const AddProductModal = ({ isOpen, onClose, apiInProgress, categories, onSave }) => {
    const [newProductData, setNewProductData] = useState(initialProductData);

    useEffect(() => {
        if (isOpen) {
            setNewProductData(initialProductData);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProductData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleNewProductSubmit = async (e) => {
        e.preventDefault();
        
        if (!newProductData.item_name?.trim() || !newProductData.category_id || !newProductData.unit) {
            toast.error("Please fill all required fields (Item Name, Category, and Unit).");
            return;
        }

        await onSave(newProductData); 
    };

    return (
        /* 1. Modal Overlay Backdrop */
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans"
            onClick={onClose}
        >
            {/* 2. Modal Card Container */}
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <PackagePlus className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Create New Product</h2>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleNewProductSubmit} className="p-6 space-y-4">
                    {/* Item Name */}
                    <div>
                        <label htmlFor="newItemName" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Item Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="newItemName"
                            name="item_name"
                            value={newProductData.item_name}
                            onChange={handleNewProductChange}
                            placeholder="e.g., Broiler Starter Feed, Live Chicken, Vaccine X"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            required
                            disabled={apiInProgress}
                        />
                    </div>

                    {/* Category & Unit Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label htmlFor="newCategoryId" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="newCategoryId"
                                name="category_id"
                                value={newProductData.category_id}
                                onChange={handleNewProductChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                required
                                disabled={apiInProgress}
                            >
                                <option value="">Select Category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Unit */}
                        <div>
                            <label htmlFor="newUnit" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Unit <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="newUnit"
                                name="unit"
                                value={newProductData.unit}
                                onChange={handleNewProductChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                required
                                disabled={apiInProgress}
                            >
                                {COMMON_UNITS.map(u => (
                                    <option key={u.value} value={u.value}>
                                        {u.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="newNotes" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Notes / Specifications (Optional)
                        </label>
                        <textarea
                            id="newNotes"
                            name="notes"
                            value={newProductData.notes}
                            onChange={handleNewProductChange}
                            placeholder="Add dosage instructions, brand, or shelf details..."
                            rows="3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            disabled={apiInProgress}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose} 
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                            disabled={apiInProgress}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                            disabled={apiInProgress}
                        >
                            {apiInProgress ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductModal;