import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, CreditCard, DollarSign } from 'lucide-react';
import UniversalPaymentModal from '../../components/UniversalPaymentModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PayDueManuallyModal = ({ isOpen, onClose, supplierId, supplierName, onPaymentSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        paidAmount: '',
        paymentAccountId: '',
        accountLabel: 'Select Payment Account'
    });

    const handleAccountSelection = (selection) => {
        setFormData(prev => ({
            ...prev,
            paymentAccountId: selection.accountId,
            accountLabel: selection.accountLabel || selection.paymentMethod || 'Selected Account'
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(formData.paidAmount);

        if (!amount || amount <= 0) {
            return toast.error("Please enter a valid payment amount greater than zero.");
        }
        if (!formData.paymentAccountId) {
            return toast.warn("Please select a source payment account.");
        }

        setLoading(true);
        try {
            await axios.patch(`${API_BASE_URL}/api/purchases/pay-supplier-due-manually`, {
                paidAmount: amount,
                paymentAccountId: formData.paymentAccountId,
                supplierId: supplierId
            });

            toast.success(`Distributed ৳${amount.toLocaleString()} across due purchases for ${supplierName}!`);
            if (typeof onPaymentSuccess === "function") {
                onPaymentSuccess();
            }
            onClose();
            setFormData({ paidAmount: '', paymentAccountId: '', accountLabel: 'Select Payment Account' });
        } catch (err) {
            console.error("Manual pay error:", err);
            toast.error(err.response?.data?.message || "Payment application failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 font-sans"
                onClick={onClose}
            >
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Settle Supplier Due (FIFO)</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Applies payment automatically to oldest pending invoices</p>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-sm">
                        <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl">
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Recipient Supplier</span>
                            <span className="text-base font-bold text-slate-900 mt-0.5 block">{supplierName}</span>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Payment Amount (৳) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="0.01"
                                placeholder="0.00"
                                value={formData.paidAmount}
                                onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-base font-bold text-emerald-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Funding Account <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsSourceModalOpen(true)}
                                className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 transition text-left"
                            >
                                <span className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    {formData.accountLabel}
                                </span>
                                <span className="text-blue-600">Choose Account</span>
                            </button>
                        </div>

                        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {loading ? "Distributing..." : "Apply Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <UniversalPaymentModal
                isOpen={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                onSelectPayment={handleAccountSelection}
                defaultPaymentMethod="cash"
            />
        </>
    );
};

export default PayDueManuallyModal;