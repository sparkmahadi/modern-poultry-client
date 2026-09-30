import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";

const API = import.meta.env.VITE_API_BASE_URL;

const BatchSalesHistory = ({ batchId }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (batchId) fetchSales();
  }, [batchId]);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API}/api/batches/${batchId}/sales`);
      if (res.data.success) {
        setSales(res.data.sales);
      }
    } catch (err) {
      console.error("Sales fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete Sale Deletion:
   * Reverts inventory stock, refunds payment accounts, and updates customer dues.
   */
  const handleDeleteFullSale = async (memoId) => {
    const confirmed = window.confirm(
      "Are you sure you want to completely DELETE this sale?\nThis will revert inventory stock and restore customer balances."
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API}/api/sales/${memoId}`);
      if (res.data.success) {
        setSales((prev) => prev.filter((s) => s._id !== memoId));
      } else {
        alert(res.data.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete sale");
    }
  };

  if (loading) return <p className="p-4">Loading sales history...</p>;

  if (sales.length === 0) {
    return <p className="p-4 text-gray-600">No sales recorded for this batch.</p>;
  }

  const totalAmount = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const totalPaid = sales.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0);
  const totalDue = sales.reduce((sum, s) => sum + (Number(s.due_amount) || 0), 0);

  return (
    <div className="p-4 border rounded-lg mt-6 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Batch Sales History</h2>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 border">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Memo No</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">Paid</th>
            <th className="p-2 border">Due</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale._id} className="border hover:bg-gray-50">
              <td className="p-2 border">
                {new Date(sale.date).toLocaleDateString()}
              </td>
              <td className="p-2 border font-medium">{sale.memoNo || "N/A"}</td>
              <td className="p-2 border">৳{sale.total_amount}</td>
              <td className="p-2 border text-green-700">৳{sale.paid_amount}</td>
              <td className="p-2 border text-red-600">৳{sale.due_amount}</td>
              <td className="p-2 border text-center space-x-2">
                <button
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                  onClick={() => navigate(`/sales/${sale._id}`)}
                >
                  View Memo
                </button>
                <button
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                  onClick={() => handleDeleteFullSale(sale._id)}
                >
                  Delete Sale
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 p-3 bg-gray-50 border rounded-md grid grid-cols-3 text-center">
        <div>
          <span className="text-gray-500 text-xs block">Total Sold</span>
          <span className="font-bold text-gray-800">৳{totalAmount.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500 text-xs block">Total Collected</span>
          <span className="font-bold text-green-600">৳{totalPaid.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500 text-xs block">Total Outstanding Due</span>
          <span className="font-bold text-red-600">৳{totalDue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default BatchSalesHistory;