import React from 'react';
import { format } from 'date-fns';
import { X, Printer, RotateCcw, Building2, Calendar, FileText } from 'lucide-react';

const PurchaseReturnDetailsModal = ({ isOpen, onClose, returnData }) => {
    if (!isOpen || !returnData) return null;

    const {
        _id,
        supplier_name,
        date,
        total_return_amount = 0,
        refund_received = 0,
        payment_method,
        account_id,
        note,
        products = []
    } = returnData;

    const netCredit = Number(total_return_amount) - Number(refund_received);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-100">
                {/* Modal Top Bar */}
                <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center no-print">
                    <div className="flex items-center gap-3">
                        <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                            <RotateCcw className="w-5 h-5" />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold">Purchase Return Voucher</h2>
                            <p className="text-xs text-slate-400 font-mono">Ref #{String(_id).slice(-8)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Print Voucher"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Content Body */}
                <div className="p-8 overflow-y-auto space-y-6 print:p-0">
                    {/* Voucher Header Info */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" /> Supplier Name
                            </span>
                            <p className="text-base font-bold text-slate-800">{supplier_name || 'N/A'}</p>
                            {returnData.supplier_phone && (
                                <p className="text-xs text-slate-500">Phone: {returnData.supplier_phone}</p>
                            )}
                        </div>
                        <div className="space-y-1.5 text-right">
                            <span className="text-xs font-bold text-slate-400 uppercase flex items-center justify-end gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Return Date
                            </span>
                            <p className="text-base font-bold text-slate-800">
                                {date ? format(new Date(date), "dd MMMM yyyy, p") : "N/A"}
                            </p>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Returned Line Items</h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 text-center w-24">Qty</th>
                                        <th className="px-4 py-3 text-right w-28">Rate</th>
                                        <th className="px-4 py-3 text-left w-36">Return Reason</th>
                                        <th className="px-4 py-3 text-right w-32">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map((p, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-semibold text-slate-800">
                                                {p.name || p.item_name}
                                                <span className="text-xs text-slate-400 block font-normal">Unit: {p.unit || 'pcs'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-slate-700">{p.qty}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                ৳{Number(p.return_price || p.purchase_price || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-rose-600 font-medium">
                                                {p.reason || 'Not Specified'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                ৳{Number(p.subtotal || (p.qty * (p.return_price || p.purchase_price || 0))).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Notes */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                            <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1 mb-2">
                                <FileText className="w-3.5 h-3.5" /> Note / Memo Remarks
                            </p>
                            <p className="text-slate-600 italic">
                                {note || "No additional remarks attached to this return voucher."}
                            </p>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2.5 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between text-slate-600">
                                <span>Gross Return Value:</span>
                                <span className="font-bold text-slate-900">৳{Number(total_return_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Cash / Bank Refund Recv:</span>
                                <span className="font-bold text-emerald-600">৳{Number(refund_received).toFixed(2)}</span>
                            </div>
                            {payment_method && (
                                <div className="text-xs text-slate-400 text-right">
                                    Method: <span className="uppercase font-semibold text-slate-600">{payment_method}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
                                <span>Net Due Deduction:</span>
                                <span className="text-blue-600">৳{netCredit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3 no-print">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition text-sm"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition text-sm flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReturnDetailsModal;