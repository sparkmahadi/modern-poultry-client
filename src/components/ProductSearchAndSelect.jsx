import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react'; 
import { toast } from 'react-toastify';
import axios from 'axios';

// Assuming these imports are correct based on your file structure
import { InputField } from '../pages/Purchase/FormComponents';
import AddProductModal from './AddProductModal/AddProductModal'; 

// IMPORTANT: Define API_BASE_URL (use environment variable or default)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const ProductSearchAndSelect = ({
    productSearch,
    handleProductSearch,
    productSearchLoading,
    searchResults,
    // This prop likely adds the selected product to the purchase form
    addProduct, 
    // newProductName and setNewProductName are now redundant for modal flow, 
    // but kept as props in the signature just in case
    newProductName,
    setNewProductName,
    // addNewProduct function is replaced by the saveNewProduct function below
    addNewProduct // This prop is now unused
}) => {

    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [apiInProgress, setApiInProgress] = useState(false);
    const [categories, setCategories] = useState([]);

    // --- Data Fetch on Mount (for categories) ---
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
            setCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories for dropdowns:', error);
            // toast.error('Failed to load categories for forms. Please check your backend.');
        }
    };

    // --- Modal Handlers ---
    const handleOpenAddProductModal = () => {
        setShowAddProductModal(true);
    };

    const handleCloseAddProductModal = () => {
        setShowAddProductModal(false);
    };

    // --- API Function for Modal (Add New Product) ---
    const saveNewProduct = async (productData) => {
        setApiInProgress(true);
        try {
            // 1. Post the new product to the backend
            const response = await axios.post(`${API_BASE_URL}/api/products`, productData);
            const newProduct = response.data.data;
            
            toast.success(`Product "${newProduct.item_name}" created successfully!`);
            
            // 2. Add the newly created product to the current purchase form list 
            //    (assuming the 'addProduct' prop handles this step)
            addProduct(newProduct);
            
            setShowAddProductModal(false); // Close the modal on success
            return { success: true };
        } catch (error) {
            console.error('Failed to add product:', error);
            toast.error(error.response?.data?.message || 'Failed to create and add product. Please try again.');
            throw error;
        } finally {
            setApiInProgress(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Add Products</h2>

            {/* Product Search Input */}
            <div className="relative mb-4">
                <InputField
                    label="Search Existing Product"
                    name="product_search"
                    value={productSearch}
                    onChange={handleProductSearch}
                    placeholder="Search by name..."
                    className="relative"
                />
                {productSearchLoading && (
                    <div className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500">
                        <Loader className="w-5 h-5 animate-spin" /> 
                    </div>
                )}
                {searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white text-gray-800 border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                        {searchResults.map((p) => (
                            <li
                                key={p._id}
                                className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                                onClick={() => addProduct(p)}
                            >
                                <span className="font-medium">{p.item_name}</span>
                                <span className="text-sm text-gray-600">Buy Rate: ৳{Number(p.purchase_price || 0).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add New Product Button */}
            <div className="flex justify-start pt-2 border-t mt-4">
                <button
                    type="button"
                    onClick={handleOpenAddProductModal}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
                >
                    Create New Product
                </button>
            </div>

            {/* Integrated Add Product Modal */}
            <AddProductModal
                isOpen={showAddProductModal}
                onClose={handleCloseAddProductModal}
                apiInProgress={apiInProgress}
                categories={categories}
                onSave={saveNewProduct} // Pass the API function
            />
        </div>
    );
};

export default ProductSearchAndSelect;