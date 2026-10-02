import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import {
    Search,
    Filter,
    Plus,
    ChevronLeft,
    Eye,
    Package,
    ChevronRight
} from 'lucide-react';

import AddProductModal from './../../components/AddProductModal/AddProductModal';

function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiInProgress, setApiInProgress] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/products`);
            setProducts(response?.data?.data || response?.data || []);
        } catch (error) {
            toast.error('Failed to load products.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
            setCategories(response?.data?.data || response?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    // Save product handler for AddProductModal
    const handleSaveNewProduct = async (productData) => {
        setApiInProgress(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/products`, productData);
            if (res.data?.success) {
                toast.success(res.data?.message || 'Product created successfully');
                setShowAddProductModal(false);
                await fetchProducts();
            } else {
                toast.error(res.data?.message || 'Failed to create product');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to save product');
        } finally {
            setApiInProgress(false);
        }
    };

    const handleUpdatePrices = async () => {
        if (apiInProgress) return;
        setApiInProgress(true);

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/products/update-all-products-price`
            );

            if (response.data?.success) {
                const summary = response.data.summary || { updated: 0, skipped: 0 };
                toast.success(
                    `Prices Updated Successfully!\nUpdated: ${summary.updated}\nSkipped: ${summary.skipped}`
                );
                await fetchProducts();
            } else {
                toast.error(response.data?.message || 'Failed to update prices');
            }
        } catch (error) {
            console.error('❌ Update Prices Error:', error);
            toast.error(
                error?.response?.data?.message || 'Something went wrong while updating prices'
            );
        } finally {
            setApiInProgress(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Safe Filter and Search Logic
    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return products.filter((product) => {
            const productId = String(product._id || product.id || '');
            const itemName = (product.item_name || product.name || '').toLowerCase();
            const productCatId = String(product.category_id || product.category?._id || product.category || '');

            const matchesSearch = !query || itemName.includes(query) || productId.includes(query);
            const matchesCategory = selectedCategory === 'all' || productCatId === String(selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Loading Inventory...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Product Inventory</h1>
                        <p className="text-gray-500 text-sm">Manage {products.length} items in your catalog</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleUpdatePrices}
                            disabled={apiInProgress}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            <ChevronRight size={18} />
                            {apiInProgress ? 'Updating...' : 'Update Prices'}
                        </button>
                        <button
                            onClick={() => navigate('/categories')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                        >
                            <ChevronLeft size={18} /> Categories
                        </button>
                        <button
                            onClick={() => setShowAddProductModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                        >
                            <Plus size={18} /> Add Product
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="text-gray-400" size={18} />
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white text-gray-600"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map((cat) => {
                                const catId = cat._id || cat.id;
                                return (
                                    <option key={catId} value={catId}>
                                        {cat.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* List View / Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Unit</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product, idx) => {
                                        const pId = product._id || product.id;
                                        const category = categories.find(
                                            (c) => String(c._id || c.id) === String(product.category_id || product.category?._id || product.category)
                                        );

                                        return (
                                            <tr key={pId || idx} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{idx + 1}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{product.item_name || product.name || 'Unnamed Product'}</div>
                                                    <div className="text-xs text-gray-400 font-mono">ID: {pId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                                                        {category?.name || product.category_name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {product.unit || 'pcs'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        ৳{Number(product.price || product.selling_price || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/products/${pId}`)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1 text-sm font-medium"
                                                    >
                                                        <Eye size={16} /> Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                            <Package size={40} className="mx-auto mb-2 opacity-20" />
                                            No products match your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AddProductModal
                    isOpen={showAddProductModal}
                    onClose={() => setShowAddProductModal(false)}
                    categories={categories}
                    onSave={handleSaveNewProduct}
                    apiInProgress={apiInProgress}
                />
            </div>
        </div>
    );
}

export default Products;