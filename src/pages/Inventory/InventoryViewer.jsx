import React, { useState, useEffect } from 'react';
import { Package, XCircle, Loader, DollarSign, TrendingUp, Zap, Edit, Trash2, Save, X } from 'lucide-react';
import axios from 'axios';
// This assumes your API is available at '/api' relative to your frontend origin
const API_BASE_URL = import.meta.env.VITE_API_BASE_URLLL+'/api/inventory';


// --- InventoryViewer Component ---
const InventoryViewer = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Item object being edited
  const [editFormData, setEditFormData] = useState({}); // Form data for updates

  // --- Utility Functions ---

  // Standardized error handling for user feedback
  const handleApiError = (err, defaultMessage) => {
    console.error(`Failed operation:`, err);
    const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
    setError(`${defaultMessage}: ${errorMessage}.`);
    // Clear error after a short time
    setTimeout(() => setError(null), 5000); 
  };
  
  // Standardized ID extraction for MongoDB/General data
  const getItemId = (item, index) => item._id?.$oid || item._id || item.id || index;

  // --- CRUD Operations ---

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get(API_BASE_URL);
      const data = res.data?.data;
      
      // Basic validation and mapping
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
      } else {
        throw new Error("Invalid data structure received from the API. Expected an array of inventory items in the 'data' field.");
      }
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

    // Use the getItemId utility to ensure we get the correct ID
    const id = getItemId(editingItem);
    const updateUrl = `${API_BASE_URL}/${id}`;
    
    // Filter out undefined/null values and ensure numbers are parsed
    const updates = {};
    for (const key in editFormData) {
        let value = editFormData[key];
        if (value !== undefined && value !== null && value !== '') {
            // Convert numerical fields to numbers
            if (['total_stock_qty', 'sale_price', 'last_purchase_price', 'reorder_level'].includes(key)) {
                value = parseFloat(value);
                if (isNaN(value)) continue; // Skip if it's not a valid number
            }
            updates[key] = value;
        }
    }

    if (Object.keys(updates).length === 0) {
        alert("No valid changes detected.");
        return;
    }

    try {
      await axios.put(updateUrl, updates);
      
      // OPTIMISTIC UPDATE: Update local state without re-fetching everything
      setInventory(prevInventory => 
        prevInventory.map(item => 
          getItemId(item) === id ? { ...item, ...updates } : item
        )
      );

      setIsModalOpen(false);
      setEditingItem(null);
      alert('Item updated successfully!');
    } catch (err) {
      handleApiError(err, "Failed to update item");
    }
  };

  const handleDelete = async (item) => {
    // Ensure we get the correct ID
    const id = getItemId(item);
    if (!window.confirm(`Are you sure you want to delete item: ${item.item_name} (ID: ${id})? This action cannot be undone.`)) {
      return;
    }

    const deleteUrl = `${API_BASE_URL}/${id}`;

    try {
      await axios.delete(deleteUrl);
      
      // Remove item from local state
      setInventory(prevInventory => prevInventory.filter(i => getItemId(i) !== id));

      alert('Item deleted successfully!');
    } catch (err) {
      handleApiError(err, "Failed to delete item");
    }
  };

  // --- Handlers for UI ---

  const openEditModal = (item) => {
    // Prepare form data from the item
    setEditingItem(item);
    setEditFormData({
      item_name: item.item_name || '',
      total_stock_qty: item.total_stock_qty ?? 0,
      sale_price: item.sale_price ?? '',
      last_purchase_price: item.last_purchase_price ?? '',
      reorder_level: item.reorder_level ?? 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setEditFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // --- Effects ---

  useEffect(() => {
    fetchInventory();
  }, []); // Empty dependency array ensures this runs once on mount

  // --- Rendering Logic ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-lg font-medium text-gray-700">Loading inventory data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
        <XCircle className="w-10 h-10 text-red-600" />
        <p className="mt-4 text-lg font-bold text-red-800">Error</p>
        <p className="mt-2 text-red-600 text-center max-w-lg">{error}</p>
      </div>
    );
  }
  
  if (inventory.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 p-6">
            <Zap className="w-10 h-10 text-yellow-600" />
            <p className="mt-4 text-lg font-bold text-yellow-800">Inventory Empty</p>
            <p className="mt-2 text-yellow-600">The API returned no inventory items.</p>
        </div>
    );
  }

  // --- Main Render ---

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 text-center">Inventory Dashboard</h1>
      {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-6xl mx-auto mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Inventory List Grid (Responsive) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inventory.map((item, index) => {
            const id = getItemId(item, index);
            const itemName = item.item_name || `Item ${id}`;
            const stockQty = item.total_stock_qty ?? 0; // Use 0 if null/undefined
            const salePrice = item.sale_price;
            const lastPurchasePrice = item.last_purchase_price;
            const reorderLevel = item.reorder_level ?? 0;
            const isLowStock = stockQty <= reorderLevel && stockQty > 0;
            const isOutOfStock = stockQty === 0;

            return (
              <div
                key={id}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-bold text-indigo-800 truncate pr-2" title={itemName}>
                      {itemName}
                    </h2>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full min-w-[7rem] text-center whitespace-nowrap
                      ${isOutOfStock ? 'bg-red-100 text-red-800' : isLowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`
                    }>
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    
                    {/* Quantity - total_stock_qty */}
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-36">Stock Qty:</span>
                      <span className={`text-xl font-extrabold ml-2 ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {stockQty} units
                      </span>
                    </div>
                    
                    {/* Sale Price */}
                    <div className="flex items-center text-gray-700">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium w-36">Sale Price:</span>
                      <span className="text-lg font-bold text-green-700 ml-2">
                        {salePrice != null ? `$${parseFloat(salePrice).toFixed(2)}` : 'N/A'}
                      </span>
                    </div>

                    {/* Last Purchase Price */}
                    <div className="flex items-center text-gray-700">
                      <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="font-medium w-36">Last Purch. Price:</span>
                      <span className="text-md font-semibold text-orange-700 ml-2">
                        {lastPurchasePrice != null ? `$${parseFloat(lastPurchasePrice).toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Reorder Level */}
                    <div className="flex items-center text-sm text-gray-500 pt-2 border-t border-gray-100">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium w-36">Reorder Level:</span>
                        <span className="ml-2 font-semibold">
                            {reorderLevel} units
                        </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => openEditModal(item)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition duration-150"
                        title="Edit Item"
                    >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                        onClick={() => handleDelete(item)}
                        className="flex items-center text-red-600 hover:text-red-800 font-medium text-sm transition duration-150"
                        title="Delete Item"
                    >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer / Data Summary */}
      <footer className="mt-10 pt-6 border-t border-gray-300 text-center text-gray-500">
          <p className="text-sm">Total different items displayed: {inventory.length}</p>
      </footer>

      {/* --- Edit Modal Component --- */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-bold text-indigo-800">Edit Inventory: {editingItem.item_name}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body/Form */}
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              
              {/* Item Name */}
              <div>
                <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">Item Name</label>
                <input
                  type="text"
                  name="item_name"
                  id="item_name"
                  value={editFormData.item_name || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Total Stock Quantity */}
              <div>
                <label htmlFor="total_stock_qty" className="block text-sm font-medium text-gray-700">Total Stock Quantity (units)</label>
                <input
                  type="number"
                  name="total_stock_qty"
                  id="total_stock_qty"
                  value={editFormData.total_stock_qty ?? 0}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  required
                />
              </div>

              {/* Sale Price */}
              <div>
                <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">Sale Price ($)</label>
                <input
                  type="number"
                  name="sale_price"
                  id="sale_price"
                  value={editFormData.sale_price ?? ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Last Purchase Price */}
              <div>
                <label htmlFor="last_purchase_price" className="block text-sm font-medium text-gray-700">Last Purchase Price ($)</label>
                <input
                  type="number"
                  name="last_purchase_price"
                  id="last_purchase_price"
                  value={editFormData.last_purchase_price ?? ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Reorder Level */}
              <div>
                <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">Reorder Level (units)</label>
                <input
                  type="number"
                  name="reorder_level"
                  id="reorder_level"
                  value={editFormData.reorder_level ?? 0}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  required
                />
              </div>

              {/* Modal Footer/Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-150"
                >
                  <X className="w-4 h-4 inline mr-1" /> Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 flex items-center"
                >
                  <Save className="w-4 h-4 inline mr-1" /> Save Changes
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