// 🧩 AddSupplierModal.jsx

import React, { useState } from 'react';
// Assuming you have a generic Modal component and InputField/SelectField
// import Modal from './Modal'; 
// import { InputField, SelectField } from '../FormComponents'; 


// NOTE: For this example, I'll use a functional, inline-styled approach 
// assuming a generic Modal component exists (or you can use a library).

const initialSupplierData = {
    name: '',
    phone: '',
    address: '',
    type: 'regular', // Default type
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
        e.preventDefault(); // 🛑 Essential: Prevents page reload!

        if (!supplierData.name.trim() || !supplierData.phone.trim()) {
            alert("Supplier Name and Phone are required.");
            return;
        }

        try {
            await onSave(supplierData);
            setSupplierData(initialSupplierData); // Reset form on success
            onClose();
        } catch (error) {
            // Error handling is done in the parent (PurchaseForm)
        }
    };
    
    // Minimal Tailwind Modal/Overlay structure
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-indigo-600 mb-4 border-b pb-2">➕ Create New Supplier</h2>
                <form onSubmit={handleNewSupplierSubmit} className="space-y-4">
                    
                    {/* Supplier Name (Required) */}
                    <label className="block">
                        <span className="text-gray-700">Supplier Name <span className="text-red-500">*</span></span>
                        <input
                            type="text"
                            name="name"
                            value={supplierData.name}
                            onChange={handleChange}
                            placeholder="Enter supplier's name"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        />
                    </label>

                    {/* Phone (Required) */}
                    <label className="block">
                        <span className="text-gray-700">Phone Number <span className="text-red-500">*</span></span>
                        <input
                            type="text"
                            name="phone"
                            value={supplierData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        />
                    </label>

                    {/* Address */}
                    <label className="block">
                        <span className="text-gray-700">Address</span>
                        <input
                            type="text"
                            name="address"
                            value={supplierData.address}
                            onChange={handleChange}
                            placeholder="Enter address"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        />
                    </label>
                    
                    {/* Financial Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-gray-700">Initial Due (৳)</span>
                            <input
                                type="number"
                                name="due"
                                value={supplierData.due}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700">Initial Advance (৳)</span>
                            <input
                                type="number"
                                name="advance"
                                value={supplierData.advance}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                            />
                        </label>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            disabled={apiInProgress}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            disabled={apiInProgress || !supplierData.name.trim() || !supplierData.phone.trim()}
                        >
                            {apiInProgress ? 'Creating...' : 'Create Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplierModal;