import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/purchases`;

// Product row editor
const ProductRowEditor = ({ product, index, onChange, onRemove }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onChange(index, name, value);
    };

    return (
        <tr className="border-b">
            <td className="p-2 text-sm text-gray-700">{product.name}</td>
            <td className="p-2">
                <input
                    type="number"
                    name="qty"
                    value={product.qty}
                    onChange={handleInputChange}
                    className="w-full border p-1 rounded text-center"
                />
            </td>
            <td className="p-2">
                <input
                    type="number"
                    name="purchase_price"
                    value={product.purchase_price}
                    onChange={handleInputChange}
                    className="w-full border p-1 rounded text-right"
                />
            </td>
            <td className="p-2 text-right text-sm font-semibold">
                ৳{(product.qty * product.purchase_price).toFixed(2)}
            </td>
            <td className="p-2 text-center">
                <button type="button" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700">&times;</button>
            </td>
        </tr>
    );
};

const PurchaseEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPurchase = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/${id}`);
                const data = response.data.data;

                // Map API fields to local state
                setPurchase({
                    ...data,
                    totalAmount: data.total_amount,
                    paidAmount: data.paid_amount,
                    paymentMethod: data.payment_method,
                    supplierId: data.supplier_id,
                });
            } catch (err) {
                console.error('Failed to fetch purchase:', err);
                toast.error('Failed to load purchase details.');
            } finally {
                setLoading(false);
            }
        };
        fetchPurchase();
    }, [id]);

    const updateProductField = (index, field, value) => {
        const newProducts = [...purchase.products];
        const numericValue = ['qty', 'purchase_price'].includes(field) ? Number(value || 0) : value;

        newProducts[index][field] = numericValue;
        newProducts[index].subtotal = newProducts[index].qty * newProducts[index].purchase_price;

        const newTotalAmount = newProducts.reduce((sum, p) => sum + p.subtotal, 0);

        setPurchase({
            ...purchase,
            products: newProducts,
            totalAmount: newTotalAmount,
        });
    };

    const removeProduct = (index) => {
        const newProducts = purchase.products.filter((_, i) => i !== index);
        const newTotalAmount = newProducts.reduce((sum, p) => sum + p.subtotal, 0);

        setPurchase({ ...purchase, products: newProducts, totalAmount: newTotalAmount });
    };

    const handleFormChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;
        setPurchase({ ...purchase, [name]: newValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!purchase.products || !purchase.products.length) {
            toast.error('Purchase must contain at least one product.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                products: purchase.products.map(p => ({
                    product_id: p.product_id,
                    name: p.name,
                    qty: p.qty,
                    purchase_price: p.purchase_price,
                    subtotal: p.subtotal,
                })),
                total_amount: purchase.totalAmount,
                paid_amount: purchase.paidAmount,
                payment_method: purchase.paymentMethod,
                account_id: purchase.accountId || null,
                supplier_id: purchase.supplierId || null,
            };

            console.log("payload", payload);
            return;
            await axios.put(`${API_BASE_URL}/${id}`, payload);
            toast.success('Purchase updated successfully! Inventory adjusted.');
            navigate('/purchases');
        } catch (err) {
            console.error('Update failed:', err);
            toast.error(err.response?.data?.message || 'Failed to update purchase.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl">Loading Purchase Details... 🔄</div>;
    if (!purchase) return <div className="p-8 text-center text-red-600 font-semibold">Purchase not found.</div>;

    return (
        <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-indigo-700">Edit Purchase #{id.substring(18)}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Table */}
                <div className="border p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-3">Product Items ({purchase.products.length})</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                    <th className="p-2 w-24 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="p-2 w-32 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="p-2 w-32 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                    <th className="p-2 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase.products.map((p, index) => (
                                    <ProductRowEditor
                                        key={p.product_id || index}
                                        product={p}
                                        index={index}
                                        onChange={updateProductField}
                                        onRemove={removeProduct}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier ID</label>
                        <input
                            type="text"
                            name="supplierId"
                            value={purchase.supplierId || ''}
                            onChange={handleFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                            name="paymentMethod"
                            value={purchase.paymentMethod}
                            onChange={handleFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="credit">On Credit</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Paid Amount (৳)</label>
                        <input
                            type="number"
                            name="paidAmount"
                            value={purchase.paidAmount}
                            onChange={handleFormChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xl font-bold"
                        />
                    </div>
                </div>

                {/* Total Summary */}
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                    <span className="text-xl font-bold text-indigo-800">New Total Purchase Amount:</span>
                    <span className="text-3xl font-extrabold text-indigo-900">৳{Number(purchase.totalAmount || 0).toFixed(2)}</span>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || purchase.products.length === 0}
                    className="w-full bg-indigo-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {isSubmitting ? 'Updating...' : 'Save Purchase Changes'}
                </button>
            </form>
        </div>
    );
};

export default PurchaseEdit;
