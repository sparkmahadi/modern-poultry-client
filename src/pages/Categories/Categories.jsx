import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
  Plus, Trash2, Folder, ChevronRight, 
  X, Palette, Type, AlertCircle, LayoutGrid 
} from 'lucide-react';

function Categories() {
  const navigate = useNavigate();
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  
  const [newCategoryData, setNewCategoryData] = useState({
    id: '',
    name: '',
    color: '#3b82f6', // Default blue
    icon: 'folder',
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAllCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
      setAllCategories(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewCategorySubmit = async (e) => {
    e.preventDefault();
    setApiInProgress(true);
    try {
      await axios.post(`${API_BASE_URL}/api/utilities/categories`, newCategoryData);
      toast.success("Category created!");
      fetchAllCategories();
      setShowAddCategoryForm(false);
      setNewCategoryData({ id: '', name: '', color: '#3b82f6', icon: 'folder' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create category.");
    } finally {
      setApiInProgress(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevents navigating to details when clicking delete
    if (window.confirm("Delete this category and its associations?")) {
      setApiInProgress(true);
      try {
        await axios.delete(`${API_BASE_URL}/api/utilities/categories/${id}`);
        toast.success("Category removed.");
        fetchAllCategories();
      } catch (error) {
        toast.error("Failed to delete.");
      } finally {
        setApiInProgress(false);
      }
    }
  };

  useEffect(() => { fetchAllCategories(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold tracking-tight">Loading Categories...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <LayoutGrid className="text-blue-600" /> Categories
            </h2>
            <p className="text-slate-500">Manage your product organization levels</p>
          </div>
          <button
            onClick={() => setShowAddCategoryForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Add New
          </button>
        </div>

        {/* Floating Add Form */}
        {showAddCategoryForm && (
          <div className="mb-10 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">New Category Details</h3>
              <button onClick={() => setShowAddCategoryForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleNewCategorySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <Type size={16} /> Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electronics"
                  className="w-full p-3 rounded-xl border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={newCategoryData.name}
                  onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <Palette size={16} /> Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-12 w-20 rounded-lg cursor-pointer border-none bg-transparent"
                    value={newCategoryData.color}
                    onChange={(e) => setNewCategoryData({...newCategoryData, color: e.target.value})}
                  />
                  <span className="font-mono text-sm text-slate-500 uppercase">{newCategoryData.color}</span>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={apiInProgress}
                  className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {apiInProgress ? "Processing..." : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryForm(false)}
                  className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCategories.length > 0 ? (
            allCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/categories/${cat.id}`)}
                className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
              >
                {/* Visual Decoration */}
                <div 
                  className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 rounded-full transition-transform group-hover:scale-150"
                  style={{ backgroundColor: cat.color }}
                />

                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    {/* Fallback for FontAwesome vs Lucide Icons */}
                    <Folder size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800 truncate">{cat.name}</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Category ID: {cat.id}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Subcategories <ChevronRight size={16} />
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, cat.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Category"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <AlertCircle className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No categories yet</h3>
              <p className="text-slate-500 mb-6">Organize your inventory by creating your first category.</p>
              <button 
                onClick={() => setShowAddCategoryForm(true)}
                className="text-blue-600 font-bold hover:underline"
              >
                + Add Category Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categories;