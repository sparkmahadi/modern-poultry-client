import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
  ChevronLeft, Edit3, Trash2, Plus, 
  Save, X, Target, Palette, Tag, 
  Layers, AlertCircle 
} from 'lucide-react';

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);

  // States for editing
  const [editingMainCategory, setEditingMainCategory] = useState(false);
  const [currentMainCategory, setCurrentMainCategory] = useState({ name: '', color: '', icon: '' });
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);

  // State for Add New Subcategory Form
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false);
  const [newSubcategoryData, setNewSubcategoryData] = useState({
    name: '',
    icon: 'package',
    color: '#94a3b8',
    monthly_limit: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchCategoryDetails = async (categoryId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories/${categoryId}`);
      const data = response?.data?.data;
      setCategoryData(data);
      setCurrentMainCategory({
        name: data?.name,
        color: data?.color,
        icon: data?.icon
      });
    } catch (error) {
      toast.error("Could not load category details.");
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMainCategory = async () => {
    setApiInProgress(true);
    try {
      await axios.put(`${API_BASE_URL}/api/utilities/categories/${id}`, currentMainCategory);
      toast.success('Category updated!');
      await fetchCategoryDetails(id);
      setEditingMainCategory(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed.");
    } finally {
      setApiInProgress(false);
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    setApiInProgress(true);
    try {
      await axios.post(`${API_BASE_URL}/api/utilities/categories/${id}/subcategories`, newSubcategoryData);
      toast.success('Subcategory added!');
      await fetchCategoryDetails(id);
      setShowAddSubcategoryForm(false);
      setNewSubcategoryData({ name: '', icon: 'package', color: '#94a3b8', monthly_limit: 0 });
    } catch (error) {
      toast.error("Failed to add subcategory.");
    } finally {
      setApiInProgress(false);
    }
  };

  const handleDeleteSubcategory = async (subId) => {
    if (window.confirm("Are you sure you want to remove this subcategory?")) {
      setApiInProgress(true);
      try {
        await axios.delete(`${API_BASE_URL}/api/utilities/categories/${id}/subcategories/${subId}`);
        toast.success('Subcategory deleted');
        await fetchCategoryDetails(id);
      } catch (error) {
        toast.error("Delete failed.");
      } finally {
        setApiInProgress(false);
      }
    }
  };

  useEffect(() => { if (id) fetchCategoryDetails(id); }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
        <p className="font-bold">Loading details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Header */}
        <button
          onClick={() => navigate('/categories')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-8 transition-colors"
        >
          <ChevronLeft size={20} /> Back to Categories
        </button>

        {/* Main Category Hero Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 overflow-hidden relative">
          <div 
            className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 opacity-10 rounded-full"
            style={{ backgroundColor: categoryData?.color }}
          />
          
          {editingMainCategory ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="p-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none"
                  value={currentMainCategory.name}
                  onChange={(e) => setCurrentMainCategory({...currentMainCategory, name: e.target.value})}
                  placeholder="Category Name"
                />
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <Palette size={18} className="text-slate-400 ml-2" />
                  <input
                    type="color"
                    className="w-12 h-8 rounded cursor-pointer border-none bg-transparent"
                    value={currentMainCategory.color}
                    onChange={(e) => setCurrentMainCategory({...currentMainCategory, color: e.target.value})}
                  />
                  <span className="font-mono text-sm text-slate-500">{currentMainCategory.color}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveMainCategory} disabled={apiInProgress} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                  <Save size={18} /> Save Changes
                </button>
                <button onClick={() => setEditingMainCategory(false)} className="text-slate-500 px-6 py-2 font-bold hover:bg-slate-100 rounded-xl transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: `${categoryData?.color}15`, color: categoryData?.color }}
                >
                  <Layers size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">{categoryData?.name}</h2>
                  <p className="text-slate-400 font-medium">Main Category ID: {categoryData?.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingMainCategory(true)}
                className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all shadow-sm"
              >
                <Edit3 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Subcategories Section */}
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Tag size={20} className="text-blue-500" /> Subcategories
          </h3>
          {!showAddSubcategoryForm && (
            <button
              onClick={() => setShowAddSubcategoryForm(true)}
              className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={18} /> Add Subcategory
            </button>
          )}
        </div>

        {/* Add Subcategory Form */}
        {showAddSubcategoryForm && (
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between mb-6">
              <h4 className="font-bold text-lg">New Subcategory for {categoryData?.name}</h4>
              <button onClick={() => setShowAddSubcategoryForm(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Name</label>
                <input
                  required
                  className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubcategoryData.name}
                  onChange={e => setNewSubcategoryData({...newSubcategoryData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Monthly Limit ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border-none rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSubcategoryData.monthly_limit}
                    onChange={e => setNewSubcategoryData({...newSubcategoryData, monthly_limit: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={apiInProgress} className="flex-1 bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl transition-all">
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcategories List */}
        <div className="grid gap-4">
          {categoryData?.subcategories?.length > 0 ? (
            categoryData.subcategories.map(sub => (
              <div 
                key={sub.id}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Tag size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">{sub.name}</h5>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">ID: {sub.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase">Monthly Budget</span>
                    <div className="flex items-center gap-2 text-slate-700 font-black">
                      <Target size={14} className="text-blue-500" />
                      ${sub.monthly_limit?.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteSubcategory(sub.id)}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-slate-500 font-medium">No subcategories linked to this group.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryDetail;