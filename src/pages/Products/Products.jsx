// src/components/ProductCards.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import AddProductForm from './AddProductForm';
import ProductCard from './ProductCard';

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // To populate category dropdowns
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // --- API Call Functions ---

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response?.data?.data || []);
      toast.success('Products loaded successfully!');
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
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Products Overview</h2>
          <button
            onClick={() => navigate('/categories')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
            disabled={apiInProgress}
          >
            ← Back to Categories
          </button>
        </div>

        {/* Add New Product Button / Form */}
        <AddProductForm
          apiInProgress={apiInProgress}
          fetchProducts={fetchProducts}
          setApiInProgress={setApiInProgress}
          categories={categories}
        />

        {/* Product Cards Grid */}
        {products.length === 0 ? (
          <p className="text-center text-gray-600">No products found. Add a new one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map(product => (
              <ProductCard
                product={product} categories={categories}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
