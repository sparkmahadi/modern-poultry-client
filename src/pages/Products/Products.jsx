// src/components/ProductCards.jsx

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

import ProductCard from './ProductCard'; 
import AddProductModal from './../../components/AddProductModal/AddProductModal';

function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [apiInProgress, setApiInProgress] = useState(false);

    const [showAddProductModal, setShowAddProductModal] = useState(false); 

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // --- API Call Functions ---

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/products`);
            setProducts(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error(error.response?.data?.message || 'Failed to load products. Please try again.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
            setCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories for dropdowns:', error);
            toast.error('Failed to load categories for forms. Please check your backend.');
        }
    };

    // Add Product API logic
    const addProduct = async (productData) => {
        setApiInProgress(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/products`, productData);
            console.log(response)
            if(response?.data.success){
                toast.success(response.data.message);
                await fetchProducts(); 
                setShowAddProductModal(false); 
                return { success: true };
            } else{
                toast.info(response.data.message)
                return {success: false};
            }
        } catch (error) {
            console.error('Failed to add product:', error);
            toast.error(error.response?.data?.message || 'Failed to add product. Please try again.');
            throw error;
        } finally {
            setApiInProgress(false);
        }
    };
    
    // --- Modal Handlers ---
    const handleOpenAddProductModal = () => {
        setShowAddProductModal(true);
    };

    const handleCloseAddProductModal = () => {
        setShowAddProductModal(false);
    };

    // --- Data Fetch on Mount ---
    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-gray-700 text-xl">
                Loading products...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-4xl">
                <div className="mb-6 flex justify-between items-center border-b pb-4">
                    <h2 className="text-3xl font-extrabold text-gray-800">Products Overview</h2>
                    <div className="flex gap-4">
                        {/* Button to open the Modal */}
                        <button
                            onClick={handleOpenAddProductModal}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                            disabled={apiInProgress}
                        >
                            Add New Product
                        </button>
                        <button
                            onClick={() => navigate('/categories')}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                            disabled={apiInProgress}
                        >
                            ← Back to Categories
                        </button>
                    </div>
                </div>

                {/* Integration of the Slimmed-Down Add Product Modal */}
                <AddProductModal
                    isOpen={showAddProductModal}
                    onClose={handleCloseAddProductModal}
                    apiInProgress={apiInProgress}
                    categories={categories}
                    onSave={addProduct}
                />

                {/* Product Cards Grid */}
                {products.length === 0 ? (
                    <p className="text-center text-gray-600 mt-6">No products found. Add a new one!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {products?.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product} 
                                categories={categories}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Products;