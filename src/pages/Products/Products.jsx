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
    ArrowUpDown 
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
            setProducts(response?.data?.data || []);
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
            setCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Logic: Filter and Search Products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 product.id.toString().includes(searchQuery);
            const matchesCategory = selectedCategory === 'all' || product.category_id.toString() === selectedCategory;
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
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
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
                                    filteredProducts.map((product, idx) => (
                                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{idx + 1}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{product.item_name}</div>
                                                <div className="text-xs text-gray-400 font-mono">ID: {product.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                                                    {categories.find(c => String(c.id) === String(product.category_id))?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {product.unit}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    ${product.price?.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => navigate(`/products/${product._id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1 text-sm font-medium"
                                                >
                                                    <Eye size={16} /> Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
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
                    onSave={fetchProducts} // Refresh after add
                    apiInProgress={apiInProgress}
                />
            </div>
        </div>
    );
}

export default Products;