import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DISPOSAL_REASONS = [
  { value: 'EXPIRED', label: 'Expired Product (Medicine / Vaccine)' },
  { value: 'DAMAGE_WAREHOUSE', label: 'Warehouse Damage (Broken Bag / Leaking)' },
  { value: 'TRANSIT_DAMAGE', label: 'Transit / Unloading Damage' },
  { value: 'MORTALITY_DOA', label: 'Dead on Arrival / Holding Mortality (Chicks / Birds)' },
  { value: 'PEST_SPOILAGE', label: 'Pest / Moisture Spoilage (Feed)' },
  { value: 'SCRAP_EQUIPMENT', label: 'Defective / Scrapped Equipment' },
  { value: 'OTHER', label: 'Other Operational Loss' }
];

const DISPOSAL_METHODS = [
  'Deep Burial / Sanitary Dump',
  'Incineration',
  'Return to Manufacturer for Scrap',
  'Disinfect & Destroy',
  'Recycled as Fertilizer / Composted'
];

const DisposeProducts = () => {
  const [disposalLogs, setDisposalLogs] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterReason, setFilterReason] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form State
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    unit: 'BAG',
    current_stock: 0,
    unit_cost: 0,
    dispose_qty: '',
    reason: 'EXPIRED',
    disposal_method: DISPOSAL_METHODS[0],
    disposal_date: new Date().toISOString().split('T')[0],
    authorized_by: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDisposalLogs();
    fetchInventory();
  }, [filterMonth, filterReason]);

  const fetchDisposalLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterReason) params.reason = filterReason;

      const res = await axios.get(`${API_BASE_URL}/api/inventory/disposals`, { params });
      setDisposalLogs(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load disposal records', err);
      toast.error('Failed to load product disposal records');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/inventory`);
      const items = res.data.data || res.data || [];
      // Filter out items that currently have zero or negative stock
      setInventoryList(items.filter((item) => Number(item.stock_qty || 0) > 0));
    } catch (err) {
      console.error('Failed to fetch inventory stock', err);
    }
  };

  const openCreateModal = () => {
    setFormData({
      product_id: '',
      product_name: '',
      unit: 'BAG',
      current_stock: 0,
      unit_cost: 0,
      dispose_qty: '',
      reason: 'EXPIRED',
      disposal_method: DISPOSAL_METHODS[0],
      disposal_date: new Date().toISOString().split('T')[0],
      authorized_by: '',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleProductSelect = (productId) => {
    const item = inventoryList.find((p) => (p.product_id || p._id) === productId);
    if (!item) return;

    setFormData((prev) => ({
      ...prev,
      product_id: item.product_id || item._id,
      product_name: item.item_name || item.name || 'Unknown Item',
      unit: item.unit || 'BAG',
      current_stock: Number(item.stock_qty || 0),
      unit_cost: Number(item.average_purchase_price || item.last_purchase_price || 0),
      dispose_qty: ''
    }));
  };

  const calculatedLoss = useMemo(() => {
    const qty = Number(formData.dispose_qty || 0);
    const cost = Number(formData.unit_cost || 0);
    return Math.round(qty * cost * 100) / 100;
  }, [formData.dispose_qty, formData.unit_cost]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = Number(formData.dispose_qty);
    if (!qty || qty <= 0) {
      return toast.warn('Please enter a valid disposal quantity');
    }

    if (qty > formData.current_stock) {
      return toast.error(`Disposal quantity cannot exceed current available stock (${formData.current_stock} ${formData.unit})`);
    }

    const payload = {
      product_id: formData.product_id,
      product_name: formData.product_name,
      qty,
      unit: formData.unit,
      unit_cost: formData.unit_cost,
      total_financial_loss: calculatedLoss,
      reason: formData.reason,
      disposal_method: formData.disposal_method,
      disposal_date: formData.disposal_date,
      authorized_by: formData.authorized_by,
      remarks: formData.remarks
    };

    try {
      await axios.post(`${API_BASE_URL}/api/inventory/dispose`, payload);
      toast.success('Product stock successfully written off & logged!');
      setShowModal(false);
      fetchDisposalLogs();
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record disposal');
    }
  };

  // KPI Metrics
  const totalFinancialLoss = useMemo(() => {
    return disposalLogs.reduce((acc, curr) => acc + (Number(curr.total_financial_loss) || 0), 0);
  }, [disposalLogs]);

  const totalQuantityDisposed = useMemo(() => {
    return disposalLogs.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  }, [disposalLogs]);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Product <span className="font-bold">Disposal & Loss Ledger</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Write off expired vaccines, damaged feeds, holding mortality, and defective inventory
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md flex items-center gap-2"
        >
          <span>🗑️</span> Record Product Disposal
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Financial Loss</span>
          <p className="text-2xl font-bold text-red-600 font-mono mt-1">৳{totalFinancialLoss.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Accumulated cost of goods written off</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Units Disposed</span>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{totalQuantityDisposed.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Total units/bags removed from stock</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Disposal Incidents</span>
          <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{disposalLogs.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Audited write-off vouchers logged</span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Month:</span>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Reason:</span>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">All Reasons</option>
              {DISPOSAL_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filterMonth || filterReason) && (
          <button
            onClick={() => {
              setFilterMonth('');
              setFilterReason('');
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Disposal History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">SL</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Disposal Reason</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4 text-right">Unit Cost</th>
              <th className="px-6 py-4 text-right">Total Loss</th>
              <th className="px-6 py-4">Disposal Method</th>
              <th className="px-6 py-4">Authorized By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400 text-sm">
                  Loading disposal audit logs...
                </td>
              </tr>
            ) : disposalLogs.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400 text-sm">
                  No product disposals recorded for this filter.
                </td>
              </tr>
            ) : (
              disposalLogs.map((log, index) => (
                <tr key={log._id || index} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {log.disposal_date ? new Date(log.disposal_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {log.product_name}
                    {log.remarks && (
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">{log.remarks}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 border border-red-100 inline-block">
                      {DISPOSAL_REASONS.find((r) => r.value === log.reason)?.label || log.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                    {log.qty} <span className="text-xs font-normal text-slate-400">{log.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-600">
                    ৳{Number(log.unit_cost || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                    ৳{Number(log.total_financial_loss || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{log.disposal_method || 'Scrapped'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{log.authorized_by || 'Admin'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Product Disposal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <span className="text-2xl p-2 bg-red-50 text-red-600 rounded-xl">🗑️</span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Record Product Disposal</h3>
                <p className="text-xs text-slate-400">Writes off physical stock and updates financial loss</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Damaged / Expired Product</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                >
                  <option value="">-- Choose Inventory Item --</option>
                  {inventoryList.map((item) => (
                    <option key={item.product_id || item._id} value={item.product_id || item._id}>
                      {item.item_name || item.name} (Stock: {item.stock_qty} {item.unit || 'BAG'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock and Cost Reference Display */}
              {formData.product_id && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Available Salable Stock:</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {formData.current_stock} {formData.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Average Unit Cost:</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      ৳{Number(formData.unit_cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Quantity to Dispose</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="0.00"
                    value={formData.dispose_qty}
                    onChange={(e) => setFormData({ ...formData, dispose_qty: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none font-mono font-bold text-slate-900 text-base"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Disposal Date</label>
                  <input
                    type="date"
                    required
                    value={formData.disposal_date}
                    onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Primary Reason for Write-Off</label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm font-medium"
                >
                  {DISPOSAL_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disposal Method */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Destruction / Disposal Method</label>
                <select
                  required
                  value={formData.disposal_method}
                  onChange={(e) => setFormData({ ...formData, disposal_method: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                >
                  {DISPOSAL_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Computed Financial Loss Banner */}
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
                    Calculated Loss to COGS
                  </span>
                  <span className="text-xs text-red-500 font-medium">Automatic balance adjustment</span>
                </div>
                <span className="text-xl font-bold font-mono text-red-700">৳{calculatedLoss.toLocaleString()}</span>
              </div>

              {/* Authorized By */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Authorized Supervisor / Witness</label>
                <input
                  type="text"
                  placeholder="e.g. Farm Manager / Quality Inspector"
                  value={formData.authorized_by}
                  onChange={(e) => setFormData({ ...formData, authorized_by: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none text-sm"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Disposal Notes / Incident Description</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Broken packaging due to rain leak in shed 2"
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none h-18 resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md transition"
                >
                  Confirm & Write Off Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisposeProducts;