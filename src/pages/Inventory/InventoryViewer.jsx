import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, XCircle, Loader, DollarSign, TrendingUp, Zap, Edit,
  Trash2, Save, X, AlertTriangle, CheckCircle, Search, Filter, FileText,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import TruckLoader from '../../components/Spinner/TruckLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/inventory';

const InventoryViewer = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const navigate = useNavigate();

  const [isPIModalOpen, setIsPIModalOpen] = useState(false); // PI Details Modal
  const [selectedPIItem, setSelectedPIItem] = useState(null);
  // --- Search and Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');


  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    const dateStr = dateObj.$date || dateObj;
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Utility Functions ---
  const handleApiError = (err, defaultMessage) => {
    console.error(`Failed operation:`, err);
    const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
    setError(`${defaultMessage}: ${errorMessage}.`);
    setTimeout(() => setError(null), 5000);
  };

  const getItemId = (item, index) => item._id?.$oid || item._id || item.id || index;

  // --- Search & Filter Logic ---
  // --- Search, Filter, and Sort Logic ---
  const filteredInventory = useMemo(() => {
    const result = inventory.filter(item => {
      const matchesSearch = (item.item_name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const stock = item.stock_qty ?? 0;
      const reorder = item.reorder_level ?? 0;
      const isOutOfStock = stock === 0;
      const isLowStock = stock <= reorder && stock > 0;

      let matchesFilter = true;
      if (statusFilter === 'Healthy') matchesFilter = !isOutOfStock && !isLowStock;
      if (statusFilter === 'Low Stock') matchesFilter = isLowStock;
      if (statusFilter === 'Out of Stock') matchesFilter = isOutOfStock;

      return matchesSearch && matchesFilter;
    });

    // --- Added Ascending Sort by Item Name ---
    return result.sort((a, b) => {
      const nameA = a.item_name || "";
      const nameB = b.item_name || "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [inventory, searchQuery, statusFilter]);

  // --- CRUD Operations ---
  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_BASE_URL);
      const data = res.data?.data;
      let items = Array.isArray(data) ? data : (data?.items || []);
      setInventory(items);
    } catch (err) {
      handleApiError(err, "Could not load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const id = getItemId(editingItem);
    const updates = Object.fromEntries(
      Object.entries(editFormData).map(([k, v]) =>
        ['stock_qty', 'sale_price', 'last_purchase_price', 'reorder_level'].includes(k)
          ? [k, parseFloat(v)] : [k, v]
      )
    );

    try {
      await axios.put(`${API_BASE_URL}/${id}`, updates);
      setInventory(prev => prev.map(item => getItemId(item) === id ? { ...item, ...updates } : item));
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to update item");
    }
  };

  const handleDelete = async (item) => {
    const id = getItemId(item);
    if (!window.confirm(`Delete ${item.item_name}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      setInventory(prev => prev.filter(i => getItemId(i) !== id));
    } catch (err) {
      handleApiError(err, "Failed to delete item");
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditFormData({
      item_name: item.item_name || '',
      stock_qty: item.stock_qty ?? 0,
      sale_price: item.sale_price ?? '',
      last_purchase_price: item.last_purchase_price ?? '',
      reorder_level: item.reorder_level ?? 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // --- PI Modal Handlers ---
  const handleShowPI = (item) => {
    setSelectedPIItem(item);
    setIsPIModalOpen(true);
  };

  const closePIModal = () => {
    setIsPIModalOpen(false);
    setSelectedPIItem(null);
  };

  useEffect(() => { fetchInventory(); }, []);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-indigo-600 font-medium">
      <TruckLoader/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* --- Header --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-500">Track stock and generate invoices</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-gray-500 text-sm">Total Items: </span>
            <span className="font-bold text-indigo-600">{inventory.length}</span>
          </div>
        </header>

        {/* --- Search and Filter Bar --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-gray-400 w-5 h-5 hidden md:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded">
            <XCircle className="w-5 h-5 mr-2" /> {error}
          </div>
        )}

        {/* --- Table Section --- */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">SL</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Item Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-center">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Prices</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map((item, index) => {
                  const id = getItemId(item, index);
                  const isOutOfStock = (item.stock_qty ?? 0) === 0;
                  const isLowStock = (item.stock_qty ?? 0) <= (item.reorder_level ?? 0) && !isOutOfStock;

                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{index + 1}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-xs text-gray-400">ID: {id.toString().slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-gray-700'}`}>
                          {item.stock_qty ?? 0}
                        </span>
                        <div className="text-[10px] text-gray-400">Min: {item.reorder_level}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-green-700">Sale: ${parseFloat(item.sale_price || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400 font-normal underline">Last Cost: ${parseFloat(item.last_purchase_price || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400 font-normal underline">Avg Purchase Cost: ${parseFloat(item.average_purchase_price || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => navigate(`${item._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1">
                            Details
                          </button>
                          <button onClick={() => handleShowPI(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1">
                            <FileText size={16} /> PI
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                      No items found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* --- Detailed PI Modal --- */}
      {isPIModalOpen && selectedPIItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPIItem.item_name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Proforma Details & History</p>
                </div>
              </div>
              <button onClick={closePIModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-blue-600 text-xs font-bold uppercase mb-1">Current Stock</p>
                  <p className="text-2xl font-black text-blue-900">{selectedPIItem.stock_qty} <span className="text-sm font-normal text-blue-700">Units</span></p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-green-600 text-xs font-bold uppercase mb-1">Avg. Purchase Price</p>
                  <p className="text-2xl font-black text-green-900">${selectedPIItem.average_purchase_price || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-purple-600 text-xs font-bold uppercase mb-1">Last Updated</p>
                  <p className="text-sm font-bold text-purple-900 mt-2">{formatDate(selectedPIItem.last_updated)}</p>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-800 border-b pb-2">
                  <ArrowDownLeft className="w-5 h-5 text-green-500" />
                  <h4 className="font-bold">Purchase History</h4>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Qty</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Unit Price</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPIItem.purchase_history?.length > 0 ? (
                        selectedPIItem.purchase_history.map((log, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500">{formatDate(log.date)}</td>
                            <td className="px-4 py-3 text-center font-medium">{log.qty}</td>
                            <td className="px-4 py-3 text-right">${log.purchase_price}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">${log.subtotal}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">No purchase records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sale History */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-800 border-b pb-2">
                  <ArrowUpRight className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold">Recent Sale History</h4>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Qty Sold</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPIItem.sale_history?.length > 0 ? (
                        selectedPIItem.sale_history.map((log, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500">{formatDate(log.date)}</td>
                            <td className="px-4 py-3 text-center font-medium">{log.qty}</td>
                            <td className="px-4 py-3 text-right">${log.sale_price}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">No sale records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={closePIModal}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Edit Inventory Item</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  value={editFormData.item_name}
                  onChange={(e) => setEditFormData({ ...editFormData, item_name: e.target.value })}
                  className="w-full border-gray-300 rounded-lg p-2.5 border outline-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    value={editFormData.stock_qty}
                    onChange={(e) => setEditFormData({ ...editFormData, stock_qty: e.target.value })}
                    className="w-full border-gray-300 rounded-lg p-2.5 border outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={editFormData.reorder_level}
                    onChange={(e) => setEditFormData({ ...editFormData, reorder_level: e.target.value })}
                    className="w-full border-gray-300 rounded-lg p-2.5 border outline-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryViewer;