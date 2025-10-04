import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import AddProductForm from '../Products/AddProductForm';

function ProductList() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // To populate category dropdowns
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);

  // State for Add New Product Form
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductData, setNewProductData] = useState({
    id: '',
    item_name: '',
    unit: '',
    quantity: 0,
    price: 0,
    date: new Date().toISOString().slice(0, 10), // Default to current date
    category_id: '',
    subcategory_id: '',
    notes: '',
  });

  // State for Editing Product
  const [editingProductId, setEditingProductId] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null); // Holds data of product being edited

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

  const addProduct = async (productData) => {
    setApiInProgress(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products`, productData);
      toast.success('Product added successfully!');
      await fetchProducts(); // Re-fetch to update the list
      setShowAddProductForm(false); // Hide the form on success
      setNewProductData({ // Reset form
        id: '', item_name: '', unit: '', quantity: 0, price: 0,
        date: new Date().toISOString().slice(0, 10), category_id: '', subcategory_id: '', notes: ''
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product. Please try again.');
      throw error;
    } finally {
      setApiInProgress(false);
    }
  };

  const updateProduct = async (productId, updatedData) => {
    setApiInProgress(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/products/${productId}`, updatedData);
      toast.success('Product updated successfully!');
      await fetchProducts(); // Re-fetch to update the list
      setEditingProductId(null); // Exit edit mode
      setCurrentProduct(null); // Clear current product in edit
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
      await fetchProducts(); // Re-fetch to update the list
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
    fetchProducts();
    fetchCategories();
  }, []);

  // --- Synchronize Edit States ---
  useEffect(() => {
    if (editingProductId && products.length > 0) {
      const product = products.find(p => p.id === editingProductId);
      if (product) {
        setCurrentProduct({ ...product });
      }
    } else {
      setCurrentProduct(null);
    }
  }, [editingProductId, products]);

  // --- Event Handlers for Add Form ---
  const handleAddProductClick = () => {
    setShowAddProductForm(true);
    setNewProductData({
      id: '', item_name: '', unit: '', quantity: 0, price: 0,
      date: new Date().toISOString().slice(0, 10), category_id: '', subcategory_id: '', notes: ''
    });
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProductData(prevState => ({
      ...prevState,
      [name]: (name === 'quantity' || name === 'price') ? Number(value) : value
    }));
  };

  const handleNewProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductData.id || !newProductData.item_name || !newProductData.unit ||
      newProductData.quantity < 0 || newProductData.price < 0 || !newProductData.date ||
      !newProductData.category_id || !newProductData.subcategory_id) {
      toast.error("Please fill all required fields and ensure quantity/price are valid numbers.");
      return;
    }
    await addProduct(newProductData);
  };

  const handleCancelAddProduct = () => {
    setShowAddProductForm(false);
  };

  // --- Event Handlers for Edit/Delete ---
  const handleEditProduct = (productId) => {
    setEditingProductId(productId);
  };

  const handleSaveProduct = async () => {
    if (currentProduct && editingProductId) {
      await updateProduct(editingProductId, currentProduct);
    } else {
      toast.error("Error: Product data missing for save.");
    }
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setCurrentProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) { // Using confirm for quick demo
      await deleteProduct(productId);
    }
  };

  const handleCurrentProductChange = (e) => {
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
        Loading products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-4xl">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Product List</h2>
          <button
            onClick={() => navigate('/categories')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
            disabled={apiInProgress}
          >
            ← Back to Categories
          </button>
        </div>

        {/* Add New Product Button / Form */}
        <div className="mb-6 border-b pb-4">
          <AddProductForm
            apiInProgress={apiInProgress}
            fetchProducts={fetchProducts}
            setApiInProgress={setApiInProgress}
            getFilteredSubcategories={getFilteredSubcategories}
            categories={categories}
          />
        </div>

        {/* Product List */}
        {products.length === 0 ? (
          <p className="text-center text-gray-600">No products found. Add a new one!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Qty ({products[0]?.unit || 'Unit'})</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {editingProductId === product.id ? (
                      // Edit Mode
                      <>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            name="item_name"
                            value={currentProduct?.item_name || ''}
                            onChange={handleCurrentProductChange}
                            className="p-2 border border-gray-300 rounded-md w-full"
                            disabled={apiInProgress}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            name="category_id"
                            value={currentProduct?.category_id || ''}
                            onChange={handleCurrentProductChange}
                            className="p-2 border border-gray-300 rounded-md w-full"
                            disabled={apiInProgress}
                          >
                            <option value="">Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          <select
                            name="subcategory_id"
                            value={currentProduct?.subcategory_id || ''}
                            onChange={handleCurrentProductChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            disabled={apiInProgress || !currentProduct?.category_id}
                          >
                            <option value="">Subcategory</option>
                            {getFilteredSubcategories(currentProduct?.category_id || '').map(sub => (
                              <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 flex items-center">
                          <input
                            type="number"
                            name="quantity"
                            value={currentProduct?.quantity || 0}
                            onChange={handleCurrentProductChange}
                            className="p-2 border border-gray-300 rounded-md w-20"
                            disabled={apiInProgress}
                            min="0"
                          />
                          <span className="ml-1 text-sm text-gray-500"> {currentProduct?.unit || product.unit}</span>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            name="price"
                            value={currentProduct?.price || 0}
                            onChange={handleCurrentProductChange}
                            className="p-2 border border-gray-300 rounded-md w-20"
                            disabled={apiInProgress}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          ${(currentProduct?.quantity * currentProduct?.price)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            name="date"
                            value={currentProduct?.date || ''}
                            onChange={handleCurrentProductChange}
                            className="p-2 border border-gray-300 rounded-md w-32"
                            disabled={apiInProgress}
                          />
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <button
                            onClick={handleSaveProduct}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditProduct}
                            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="py-3 px-4 font-medium text-gray-900">{product.item_name}</td>
                        <td className="py-3 px-4 text-gray-700">
                          <span className="block">{categories.find(c => c.id === product.category_id)?.name || product.category_id}</span>
                          <span className="text-sm text-gray-500">
                            ({getFilteredSubcategories(product.category_id).find(s => s.id === product.subcategory_id)?.name || product.subcategory_id})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{product.quantity} {product.unit}</td>
                        <td className="py-3 px-4 text-gray-700">{product.date}</td>
                        <td className="py-3 px-4 flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
