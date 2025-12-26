import React from 'react';

const PurchaseDetailsModal = ({ isOpen, onClose, purchaseData }) => {
    if (!isOpen || !purchaseData) return null;

    const {
        _id,
        products = [],
        total_amount,
        paid_amount,
        payment_due,
        payment_method,
        date,
        payment_history = []
    } = purchaseData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Purchase Receipt</h2>
                        <p className="text-xs text-gray-500">ID: {_id?.$oid || _id}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Top Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-50 p-3 rounded-lg">
                            <p className="text-[10px] uppercase font-bold text-indigo-400">Date</p>
                            <p className="text-sm font-semibold">{new Date(date).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-[10px] uppercase font-bold text-green-400">Method</p>
                            <p className="text-sm font-semibold uppercase">{payment_method}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Total</p>
                            <p className="text-sm font-semibold">৳{total_amount?.toLocaleString()}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${payment_due > 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                            <p className={`text-[10px] uppercase font-bold ${payment_due > 0 ? 'text-red-400' : 'text-blue-400'}`}>Due</p>
                            <p className="text-sm font-semibold">৳{payment_due?.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 border-l-4 border-indigo-500 pl-2">Items Purchased</h3>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-4 py-2">Item</th>
                                    <th className="px-4 py-2 text-center">Qty</th>
                                    <th className="px-4 py-2 text-right">Price</th>
                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-4 py-3 text-center">{item.qty}</td>
                                        <td className="px-4 py-3 text-right">৳{item.purchase_price}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">৳{item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment History */}
                    {payment_history.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 border-l-4 border-green-500 pl-2">Transaction Logs</h3>
                            <div className="space-y-2">
                                {payment_history.map((log, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 border rounded-lg text-xs">
                                        <div>
                                            <p className="font-bold text-gray-700">{log.remarks || 'Payment Received'}</p>
                                            <p className="text-gray-400">{new Date(log.date.$date).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-600 font-bold">+ ৳{log.paid_amount}</p>
                                            <p className="text-gray-400">Balance: ৳{log.due_after_payment}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Paid to Date</p>
                        <p className="text-xl font-black">৳{paid_amount?.toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetailsModal;