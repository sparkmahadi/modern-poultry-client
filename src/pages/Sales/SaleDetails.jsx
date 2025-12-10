import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_BASE_URL;

const SaleDetails = () => {
    const { saleId } = useParams();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editable, setEditable] = useState(false); // Editable state toggle

    // Fetch sale data
    const fetchSale = async () => {
        try {
            const res = await axios.get(`${API}/api/sales/${saleId}`);
            if (res.data.success) setSale(res.data.sale);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch sale data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (saleId) fetchSale();
    }, [saleId]);

    // Toggle edit mode
    const toggleEdit = () => setEditable(!editable);

    // Handle input changes for general fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSale((prev) => ({ ...prev, [name]: value }));
    };

    // Handle product changes
    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...sale.products];
        updatedProducts[index][field] = field === "item_name" ? value : Number(value);
        updatedProducts[index].subtotal = updatedProducts[index].qty * updatedProducts[index].price;

        const newTotal = updatedProducts.reduce((sum, p) => sum + p.subtotal, 0);
        const newDue = Math.max(newTotal - (sale.paidAmount || 0), 0);

        setSale((prev) => ({
            ...prev,
            products: updatedProducts,
            total: newTotal,
            due: newDue
        }));
    };

    // Handle submit update
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await axios.put(`${API}/api/sales/${saleId}`, sale);
            if (res.data.success) {
                toast.success("Sale updated successfully");
                setEditable(false); // Return to view mode
            } else {
                toast.error(res.data.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error updating sale");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="p-4">Loading sale details...</p>;
    if (!sale) return <p className="p-4 text-red-500">Sale not found.</p>;

    return (
        <div className="p-4 max-w-3xl mx-auto bg-white shadow rounded">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Sale Memo: {sale.memoNo}</h2>
                <button
                    onClick={toggleEdit}
                    className={`px-3 py-1 rounded text-white ${editable ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {editable ? "Cancel Edit" : "Edit Sale"}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Fields */}
                <div>
                    <label className="block text-sm font-medium">Date</label>
                    <input
                        type="date"
                        name="date"
                        value={new Date(sale.date).toISOString().split("T")[0]}
                        onChange={handleChange}
                        className="mt-1 block w-full border rounded p-2"
                        required
                        disabled={!editable}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Customer Name</label>
                    <input
                        type="text"
                        name="customerName"
                        value={sale.customerName}
                        onChange={handleChange}
                        className="mt-1 block w-full border rounded p-2"
                        required
                        disabled={!editable}
                    />
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse mt-2">
                        <thead>
                            <tr className="bg-gray-100 border">
                                <th className="p-2 border">Item Name</th>
                                <th className="p-2 border">Qty</th>
                                <th className="p-2 border">Price</th>
                                <th className="p-2 border">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.products.map((p, idx) => (
                                <tr key={p._id} className="border hover:bg-gray-50">
                                    <td className="p-2 border">
                                        <input
                                            type="text"
                                            value={p.item_name}
                                            onChange={(e) => handleProductChange(idx, "item_name", e.target.value)}
                                            className="w-full border rounded p-1"
                                            disabled={!editable}
                                        />
                                    </td>
                                    <td className="p-2 border">
                                        <input
                                            type="number"
                                            value={p.qty}
                                            min="0"
                                            onChange={(e) => handleProductChange(idx, "qty", e.target.value)}
                                            className="w-full border rounded p-1"
                                            disabled={!editable}
                                        />
                                    </td>
                                    <td className="p-2 border">
                                        <input
                                            type="number"
                                            value={p.price}
                                            min="0"
                                            onChange={(e) => handleProductChange(idx, "price", e.target.value)}
                                            className="w-full border rounded p-1"
                                            disabled={!editable}
                                        />
                                    </td>
                                    <td className="p-2 border">{p.subtotal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium">Total</label>
                        <input
                            type="number"
                            name="total"
                            value={sale.total}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            min="0"
                            disabled={!editable}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Paid Amount</label>
                        <input
                            type="number"
                            name="paidAmount"
                            value={sale.paidAmount}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            min="0"
                            disabled={!editable}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Due</label>
                        <input
                            type="number"
                            name="due"
                            value={sale.due}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            min="0"
                            disabled={!editable}
                        />
                    </div>
                </div>

                {editable && (
                    <button
                        type="submit"
                        className={`w-full py-2 px-4 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                        disabled={submitting}
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                )}
            </form>
        </div>
    );
};

export default SaleDetails;
