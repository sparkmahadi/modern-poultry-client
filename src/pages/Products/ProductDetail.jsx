// src/components/ProductDetail.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';

function ProductDetail() {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();

  const [productData, setProductData] = useState(null);
  const [categories, setCategories] = useState([]); // For dropdowns
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false); // State for edit mode
  const [currentProduct, setCurrentProduct] = useState(null); // Data for editing

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // --- API Call Functions ---

  const fetchProductDetails = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`);
      const data = response?.data?.data;
      setProductData(data);
      setCurrentProduct(data); // Initialize currentProduct for editing
      toast.success('Product details loaded!');
    } catch (error) {
      console.error(`Failed to fetch product ${productId} details:`, error);
      toast.error(error.response?.data?.message || `Failed to load details for product ID: ${productId}.`);
      setProductData(null);
      navigate('/products'); // Redirect back to products list on error
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

  const updateProduct = async (productId, updatedData) => {
    setApiInProgress(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/products/${productId}`, updatedData);
      toast.success('Product updated successfully!');
      setProductData(updatedData); // Update main product data
      setCurrentProduct(response.data.data); // Update currentProduct for consistency
      setEditingProduct(false); // Exit edit mode
      return { success: true };
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product. Please try again.');
      throw error;
    } finally {
      setApiInProgress(false);
    }
  };

  const deleteProduct = async (productId) => {
    setApiInProgress(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/products/${productId}`);
      toast.success('Product deleted successfully!');
      navigate('/products'); // Go back to products list after deletion
      return { success: true };
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product. Please try again.');
      throw error;
    } finally {
      setApiInProgress(false);
    }
  };

  // --- Data Fetch on Mount ---
  useEffect(() => {
    if (id) {
      fetchProductDetails(id);
      fetchCategories(); // Fetch categories for dropdowns in edit mode
    }
  }, [id]);

  // --- Event Handlers for Edit/Delete ---
  const handleEditClick = () => {
    setEditingProduct(true);
  };

  const handleSaveClick = async () => {
    if (currentProduct && id) {
      await updateProduct(id, currentProduct);
    } else {
      toast.error("Error: Product data missing for save.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(false);
    setCurrentProduct(productData); // Revert to original data
  };

  const handleDeleteClick = async () => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      if (id) {
        await deleteProduct(id);
      } else {
        toast.error("Error: Product ID missing for deletion.");
      }
    }
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prevState => ({
      ...prevState,
      [name]: (name === 'quantity' || name === 'price') ? Number(value) : value
    }));
  };

  // Filter subcategories based on selected category for forms
  const getFilteredSubcategories = (categoryId) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-gray-700 text-xl">
        Loading product details...
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-red-500 text-xl text-center">
        Product not found or an error occurred.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl">
        <div className="mb-4">
          <button
            onClick={() => navigate('/products')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out mb-4"
            disabled={apiInProgress}
          >
            ← Back to Products
          </button>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-4">
          Product Details: {productData.item_name}
        </h2>

        {editingProduct ? (
          // Edit Form
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Item Name</label>
                <input
                  type="text"
                  id="editItemName"
                  name="item_name"
                  value={currentProduct?.item_name || ''}
                  onChange={handleProductChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  disabled={apiInProgress}
                />
              </div>
              <div>
                <label htmlFor="editUnit" className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  id="editUnit"
                  name="unit"
                  value={currentProduct?.unit || ''}
                  onChange={handleProductChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  disabled={apiInProgress}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  id="editQuantity"
                  name="quantity"
                  value={currentProduct?.quantity || 0}
                  onChange={handleProductChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  min="0"
                  disabled={apiInProgress}
                />
              </div>
              <div>
                <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700">Price per Unit ($)</label>
                <input
                  type="number"
                  id="editPrice"
                  name="price"
                  value={currentProduct?.price || 0}
                  onChange={handleProductChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  min="0"
                  step="0.01"
                  disabled={apiInProgress}
                />
              </div>
            </div>
            <div>
              <label htmlFor="editDate" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="editDate"
                name="date"
                value={currentProduct?.date || ''}
                onChange={handleProductChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                disabled={apiInProgress}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editCategoryId" className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  id="editCategoryId"
                  name="category_id"
                  value={currentProduct?.category_id || ''}
                  onChange={handleProductChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  disabled={apiInProgress}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editSubcategoryId" className="block text-sm font-medium text-gray-700">Subcategory</label>
                <select
                  id="editSubcategoryId"
                  name="subcategory_id"
                  value={currentProduct?.subcategory_id || ''}
                  onChange={handleProductChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  disabled={apiInProgress || !currentProduct?.category_id}
                >
                  <option value="">Select Subcategory</option>
                  {getFilteredSubcategories(currentProduct?.category_id || '').map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                id="editNotes"
                name="notes"
                value={currentProduct?.notes || ''}
                onChange={handleProductChange}
                rows="3"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                disabled={apiInProgress}
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleSaveClick}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                disabled={apiInProgress}
              >
                {apiInProgress ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                disabled={apiInProgress}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-3 text-gray-700">
            <p className="text-lg">
              <span className="font-semibold">Item Name:</span> {productData.item_name}
            </p>
            <p>
              <span className="font-semibold">ID:</span> {productData.id}
            </p>
            <p>
              <span className="font-semibold">Unit:</span> {productData.unit}
            </p>
            <p>
              <span className="font-semibold">Quantity:</span> {productData.quantity}
            </p>
            <p>
              <span className="font-semibold">Price per Unit:</span> ${productData.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xl text-green-700 font-bold">
              <span className="font-semibold">Total Cost:</span> ${productData.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {productData.date}
            </p>
            <p>
              <span className="font-semibold">Category:</span> {categories.find(c => c.id === productData.category_id)?.name || productData.category_id}
            </p>
            <p>
              <span className="font-semibold">Subcategory:</span> {getFilteredSubcategories(productData.category_id).find(s => s.id === productData.subcategory_id)?.name || productData.subcategory_id}
            </p>
            {productData.notes && (
              <p>
                <span className="font-semibold">Notes:</span> {productData.notes}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleEditClick}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                disabled={apiInProgress}
              >
                Edit Product
              </button>
              <button
                onClick={handleDeleteClick}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                disabled={apiInProgress}
              >
                Delete Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
