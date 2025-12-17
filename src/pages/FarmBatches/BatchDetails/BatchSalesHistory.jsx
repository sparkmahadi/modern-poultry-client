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
            console.log(res.data.sales);
            if (res.data.success) {
                setSales(res.data.sales);
            }
        } catch (err) {
            console.error("Sales fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteSale = async (memoId) => {
        if (!window.confirm("Remove this sale from batch history?")) return;

        try {
            const res = await axios.post(`${API}/api/batches/remove-a-sell-history`, {
                batchId,
                memoId
            });

            if (res.data.success) {
                // remove from UI instantly
                setSales((prev) => prev.filter(s => s._id !== memoId));
            } else {
                alert(res.data.message || "Delete failed");
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    if (loading) return <p className="p-4">Loading sales history...</p>;

    if (sales.length === 0)
        return <p className="p-4 text-gray-600">No sales recorded for this batch.</p>;

    // --- Summary ---
    const totalAmount = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
    const totalDue = sales.reduce((sum, s) => sum + (s.due_amount || 0), 0);

    return (
        <div className="p-4 border rounded-lg mt-6 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Sales History</h2>

            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-100 border">
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Memo No</th>
                        <th className="p-2 border">Total</th>
                        <th className="p-2 border">Paid</th>
                        <th className="p-2 border">Due</th>
                        <th className="p-2 border">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {sales.map((sale) => (
                        <tr key={sale._id} className="border hover:bg-gray-50">
                            <td className="p-2 border">
                                {new Date(sale.date).toLocaleDateString()}
                            </td>
                            <td className="p-2 border">{sale.memoNo}</td>
                            <td className="p-2 border">{sale.total_amount}</td>
                            <td className="p-2 border">{sale.paid_amount}</td>
                            <td className="p-2 border">{sale.due_amount}</td>
                            <td className="p-2 border text-center">
                                <button
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                                    onClick={() => navigate(`/sales/${sale._id}`)}
                                >
                                    View Details
                                </button>
                                <button
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                                    onClick={() => deleteSale(sale._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="font-semibold">Summary:</p>
                <p>Total Sale Amount: {totalAmount}</p>
                <p>Total Paid: {totalPaid}</p>
                <p>Total Due: {totalDue}</p>
            </div>
        </div>
    );
};

export default BatchSalesHistory;
