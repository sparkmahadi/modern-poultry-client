// AddSupplierModal.jsx

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { UserPlus, X, Phone, MapPin, Building2 } from 'lucide-react';

const initialSupplierData = {
    name: '',
    phone: '',
    address: '',
    type: 'regular',
    due: 0,
    advance: 0,
};

const AddSupplierModal = ({ isOpen, onClose, apiInProgress, onSave }) => {
    const [supplierData, setSupplierData] = useState(initialSupplierData);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;
        setSupplierData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleNewSupplierSubmit = async (e) => {
        e.preventDefault();

        if (!supplierData.name.trim() || !supplierData.phone.trim()) {
            toast.error("Supplier Name and Phone are required.");
            return;
        }

        try {
            await onSave(supplierData);
            setSupplierData(initialSupplierData);
            onClose();
        } catch (error) {
            // Toast handling is managed in parent
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" /> Register Supplier
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">Add feed mill, chick hatchery, or medicine vendor</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleNewSupplierSubmit} className="space-y-4 mt-4 text-sm">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Supplier Company / Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={supplierData.name}
                                onChange={handleChange}
                                placeholder="e.g., Aftab Feed Mills Ltd."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                required
                                disabled={apiInProgress}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={supplierData.phone}
                                    onChange={handleChange}
                                    placeholder="01xxxxxxxxx"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    required
                                    disabled={apiInProgress}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Supplier Type
                                </label>
                                <select
                                    name="type"
                                    value={supplierData.type}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    disabled={apiInProgress}
                                >
                                    <option value="regular">Regular Vendor</option>
                                    <option value="corporate">Corporate / Manufacturer</option>
                                    <option value="occasional">Occasional</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Office / Mill Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={supplierData.address}
                                onChange={handleChange}
                                placeholder="Factory depot or office location"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                disabled={apiInProgress}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Initial Due (৳)
                                </label>
                                <input
                                    type="number"
                                    name="due"
                                    min="0"
                                    value={supplierData.due || ""}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-none"
                                    disabled={apiInProgress}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Initial Advance (৳)
                                </label>
                                <input
                                    type="number"
                                    name="advance"
                                    min="0"
                                    value={supplierData.advance || ""}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-none"
                                    disabled={apiInProgress}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition"
                                disabled={apiInProgress}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                                disabled={apiInProgress || !supplierData.name.trim() || !supplierData.phone.trim()}
                            >
                                {apiInProgress ? 'Saving...' : 'Create Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddSupplierModal;