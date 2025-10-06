// AddProductModal.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AddProductModalText from './AddProductModalText';

const initialProductData = {
    item_name: '',
    // Set mandatory defaults for fields removed from the form
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

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProductData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleNewProductSubmit = async (e) => {
        e.preventDefault();
        
        if (!newProductData.item_name || !newProductData.category_id) {
            toast.error("Please fill required fields (Item Name and Category).");
            return;
        }

        // Call the onSave function (addProduct) passed from the parent
        await onSave(newProductData); 
    };

    return (
        <AddProductModalText 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Create New Product"
        >
            <form onSubmit={handleNewProductSubmit} className="space-y-4">
                
                {/* 1. Item Name (Required) */}
                <div>
                    <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700">Item Name*</label>
                    <input
                        type="text"
                        id="newItemName"
                        name="item_name"
                        value={newProductData.item_name}
                        onChange={handleNewProductChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        required
                        disabled={apiInProgress}
                    />
                </div>

                {/* 2. Category (Required) */}
                <div>
                    <label htmlFor="newCategoryId" className="block text-sm font-medium text-gray-700">Category*</label>
                    <select
                        id="newCategoryId"
                        name="category_id"
                        value={newProductData.category_id}
                        onChange={handleNewProductChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        required
                        disabled={apiInProgress}
                    >
                        <option value="">Select Category</option>
                        {categories?.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Notes */}
                <div>
                    <label htmlFor="newNotes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        id="newNotes"
                        name="notes"
                        value={newProductData.notes}
                        onChange={handleNewProductChange}
                        rows="2"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        disabled={apiInProgress}
                    ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                        disabled={apiInProgress}
                    >
                        {apiInProgress ? 'Adding...' : 'Create Product'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose} 
                        className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                        disabled={apiInProgress}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </AddProductModalText>
    );
};

export default AddProductModal;