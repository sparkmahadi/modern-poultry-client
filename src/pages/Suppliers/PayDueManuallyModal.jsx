import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { InputField } from '../Purchase/FormComponents';
import UniversalPaymentModal from '../../components/UniversalPaymentModal';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const PayDueManuallyModal = ({ isOpen, onClose, supplierId, supplierName, onPaymentSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        paidAmount: '',
        paymentAccountId: '',
        accountLabel: 'No account selected'
    });

    const handleAccountSelection = (selection) => {
        // selection contains: { paymentMethod, accountId, accountLabel }
        setFormData(prev => ({
            ...prev,
            paymentAccountId: selection.accountId,
            accountLabel: selection.accountLabel
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.paymentAccountId) return toast.warn("Please select a payment account");

        setLoading(true);
        try {
            await axios.patch(`${API_BASE_URL}/api/purchases/pay-supplier-due-manually`, {
                paidAmount: Number(formData.paidAmount),
                paymentAccountId: formData.paymentAccountId,
                supplierId: supplierId
            });

            toast.success(`Success! Distributed ৳${formData.paidAmount} to dues for ${supplierName}`);
            onPaymentSuccess();
            onClose();
            setFormData({ paidAmount: '', paymentAccountId: '', accountLabel: 'No account selected' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-800">💰 Pay Due Manually</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* supplier Info */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">supplier Name</p>
                        <p className="text-xl font-black text-indigo-900">{supplierName}</p>
                    </div>

                    {/* Amount Input */}
                    <InputField
                        label="Amount to Pay (৳)"
                        type="number"
                        placeholder="Enter payment amount"
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                        required
                    />

                    {/* Account Selection Trigger */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Payment Source</label>
                        <div
                            onClick={() => setIsSourceModalOpen(true)}
                            className="flex items-center justify-between border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                        >
                            <div>
                                <p className={`font-bold ${formData.paymentAccountId ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {formData.accountLabel}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">Click to change account</p>
                            </div>
                            <span className="text-indigo-500 group-hover:scale-125 transition-transform text-xl">💳</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-700 transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? "Distributing Payment..." : "Confirm & Apply Payment"}
                        </button>
                    </div>
                </form>

                {/* Sub-Modal: Universal Payment Selector */}
                <UniversalPaymentModal
                    isOpen={isSourceModalOpen}
                    onClose={() => setIsSourceModalOpen(false)}
                    onSelectPayment={handleAccountSelection}
                    defaultPaymentMethod="cash"
                />
            </div>
        </div>
    );
};
export default PayDueManuallyModal;