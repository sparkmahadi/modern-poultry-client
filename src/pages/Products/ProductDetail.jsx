import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, Edit3, Trash2, Save, X, 
  Package, Tag, Calendar, DollarSign, FileText, Info 
} from 'lucide-react';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productData, setProductData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // --- Logic remains the same (fetchProductDetails, updateProduct, etc.) ---
  const fetchProductDetails = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`);
      const data = response?.data?.data;
      setProductData(data);
      setCurrentProduct(data);
    } catch (error) {
      toast.error('Failed to load product details.');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
      setCategories(response?.data?.data || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (id) { fetchProductDetails(id); fetchCategories(); }
  }, [id]);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: (name === 'quantity' || name === 'price') ? Number(value) : value
    }));
  };

  const updateProduct = async () => {
    setApiInProgress(true);
    try {
      await axios.put(`${API_BASE_URL}/api/products/${id}`, currentProduct);
      toast.success('Product updated!');
      setProductData(currentProduct);
      setEditingProduct(false);
    } catch (error) {
      toast.error('Update failed.');
    } finally { setApiInProgress(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const activeCategory = categories.find(c => c.id === currentProduct?.category_id);
  const subcategories = activeCategory?.subcategories || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Actions Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft size={20} /> Back to Inventory
          </button>

          {!editingProduct && (
            <div className="flex gap-3">
              <button
                onClick={() => setEditingProduct(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
              >
                <Edit3 size={18} /> Edit
              </button>
              <button
                onClick={() => {/* Logic for delete */}}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          {/* Header Section */}
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Product ID: {id}</span>
                <h1 className="text-3xl font-bold mt-1">
                  {editingProduct ? "Editing Product" : productData.item_name}
                </h1>
              </div>
              {!editingProduct && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-white/60 text-xs uppercase font-bold">Total Valuation</p>
                  <p className="text-2xl font-black text-green-400">
                    ${(productData.price * productData.quantity).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {editingProduct ? (
              /* --- EDIT MODE --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Item Name</span>
                    <input name="item_name" value={currentProduct.item_name} onChange={handleProductChange} className="mt-1 block w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Price ($)</span>
                      <input name="price" type="number" value={currentProduct.price} onChange={handleProductChange} className="mt-1 block w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Quantity</span>
                      <input name="quantity" type="number" value={currentProduct.quantity} onChange={handleProductChange} className="mt-1 block w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Category</span>
                    <select name="category_id" value={currentProduct.category_id} onChange={handleProductChange} className="mt-1 block w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Subcategory</span>
                    <select name="subcategory_id" value={currentProduct.subcategory_id} onChange={handleProductChange} className="mt-1 block w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                      {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Internal Notes</span>
                    <textarea name="notes" rows="3" value={currentProduct.notes} onChange={handleProductChange} className="mt-1 block w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button onClick={() => setEditingProduct(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                  <button onClick={updateProduct} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Save size={18} /> {apiInProgress ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* --- VIEW MODE --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Core Info */}
                <div className="space-y-6">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</h3>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Package size={24} /></div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Stock Unit</p>
                      <p className="text-lg font-bold text-slate-800">{productData.unit || 'Standard'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Tag size={24} /></div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Classification</p>
                      <p className="text-lg font-bold text-slate-800">
                        {activeCategory?.name || 'N/A'} 
                        <span className="text-slate-300 mx-2">/</span>
                        <span className="text-slate-500">{subcategories.find(s => s.id === productData.subcategory_id)?.name || 'General'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Calendar size={24} /></div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Record Date</p>
                      <p className="text-lg font-bold text-slate-800">{productData.date}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Financials */}
                <div className="space-y-6">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest border-b border-slate-100 pb-2">Financials & Inventory</h3>
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium flex items-center gap-2"><DollarSign size={16}/> Price per Unit</span>
                      <span className="text-xl font-bold text-slate-900">${productData.price?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium flex items-center gap-2"><Info size={16}/> In Stock</span>
                      <span className="text-xl font-bold text-slate-900">{productData.quantity} Units</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-800 font-bold italic">Total Value</span>
                      <span className="text-2xl font-black text-blue-600">${(productData.price * productData.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes: Full Width */}
                {productData.notes && (
                  <div className="md:col-span-2 mt-4 p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                    <h4 className="flex items-center gap-2 text-yellow-800 font-bold text-sm mb-2">
                      <FileText size={18} /> Internal Notes
                    </h4>
                    <p className="text-slate-600 italic leading-relaxed">{productData.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;