import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/constant';
import { useParams } from 'react-router';
import { Info, Loader2, Store, Tag, AlertCircle, History, DollarSign } from 'lucide-react';

const InventoryDetail = () => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/inventory/${id}`);
        // Navigating the nested data structure: response.data (Axios) -> .data (Server) -> .data (Item)
        setInventory(response.data.data);
      } catch (err) {
        setError(err.message || "Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
      <Loader2 className="animate-spin mb-2" size={32} />
      <p className="font-medium">Fetching inventory details...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto mt-10 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
      <AlertCircle />
      <p>Error: {error}</p>
    </div>
  );

  if (!inventory) return null;

  const item = inventory;
  const mainSupplier = item.suppliers?.[0]; // Taking the first supplier from the array

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 mb-10 overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
      {/* Header Section */}
      <div className="bg-slate-900 p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.item_name}</h1>
            <div className="flex items-center gap-2 mt-2 text-slate-400">
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded">ID: {item._id}</span>
              {item.reorder_level >= item.stock_qty && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/50 font-bold uppercase">Low Stock</span>
              )}
            </div>
          </div>
          <div className="bg-white/10 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 text-center min-w-[140px]">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Stock</p>
            <p className="text-4xl font-black text-white">{item.stock_qty}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Tag size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">Selling Price</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {item.sale_price ? `$${item.sale_price}` : <span className="text-slate-400 italic text-lg">Not Set</span>}
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <DollarSign size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">Avg. Cost</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">${item.average_purchase_price?.toFixed(2)}</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Store size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">Main Supplier</span>
            </div>
            <p className="text-lg font-bold text-slate-800 truncate">{mainSupplier?.name || "None"}</p>
            <p className="text-xs text-slate-500">{mainSupplier?.phone}</p>
          </div>
        </div>

        {/* Purchase History Table */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History size={20} className="text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800">Recent Purchase History</h2>
          </div>
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {item.purchase_history?.length > 0 ? (
                  item.purchase_history.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600">{formatDate(record.date)}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-900">{record.qty}</td>
                      <td className="px-4 py-3 text-slate-600">${record.purchase_price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">${record.subtotal?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">No purchase history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${item.stock_qty > item.reorder_level ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className="text-sm font-semibold text-slate-600">
            {item.stock_qty > item.reorder_level ? 'Stock Healthy' : 'Low Stock Warning'}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all">
            Edit Item
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
            New Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetail;