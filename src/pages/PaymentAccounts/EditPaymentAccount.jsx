// EditPaymentAccount Component (Example Implementation)

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCOUNTS_URL = `${API_BASE_URL}/api/payment_accounts`;

// Reusable Modal Component (defined in PaymentAccounts, but repeated here for completeness)
const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-sm relative">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">{title}</h3>
          {children}
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
      </div>
    );
};

const EditPaymentAccount = ({ account, onClose, onSuccess }) => {
    // Initialize state with existing account data
    const [formData, setFormData] = useState({
        name: account.name || "",
        owner_name: account.owner_name || "",
        is_default: account.is_default || false,
        // Fields specific to types
        bank_name: account.bank_name || "",
        account_number: account.account_number || "",
        routing_number: account.routing_number || "",
        branch_name: account.branch_name || "",
        method: account.method || "", // e.g., 'bkash', 'rocket' for mobile
        number: account.number || "", // mobile number
    });
    const [loading, setLoading] = useState(false);
    const accountType = account.type; // bank, cash, mobile

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Filter updateData to only include non-undefined fields
        const updateData = {};
        for (const key in formData) {
            if (formData[key] !== undefined && (formData[key] !== '' || typeof formData[key] === 'boolean')) {
                 // Only send fields that are actually editable (matching the controller's allowedFields)
                if (['name', 'owner_name', 'is_default', 'bank_name', 'account_number', 'routing_number', 'branch_name', 'method', 'number'].includes(key)) {
                    updateData[key] = formData[key];
                }
            }
        }
        
        // Note: We deliberately exclude 'balance' as editing balance directly should be done via deposit/withdraw transactions.

        // If trying to remove default status from the currently default account
        if (account.is_default === true && updateData.is_default === false) {
             setLoading(false);
             return toast.error("Cannot remove default status from the current default account. Set another account as default first.");
        }

        try {
            await axios.put(`${ACCOUNTS_URL}/${account._id}`, updateData);
            toast.success("Account updated successfully!");
            onSuccess(); // Close modal and refresh accounts
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper to render bank specific fields
    const renderBankFields = () => (
        <>
            <input type="text" name="bank_name" placeholder="Bank Name" value={formData.bank_name} onChange={handleChange} required className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="account_number" placeholder="Account Number" value={formData.account_number} onChange={handleChange} required className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="routing_number" placeholder="Routing Number (Optional)" value={formData.routing_number} onChange={handleChange} className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="branch_name" placeholder="Branch Name (Optional)" value={formData.branch_name} onChange={handleChange} className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
        </>
    );

    // Helper to render mobile specific fields
    const renderMobileFields = () => (
        <>
            <input type="text" name="method" placeholder="Mobile Method (e.g. Bkash, Rocket)" value={formData.method} onChange={handleChange} required className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            <input type="text" name="number" placeholder="Mobile Account Number" value={formData.number} onChange={handleChange} required className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
        </>
    );

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={`Edit ${account.name || account.method} Account`}
        >
            <form onSubmit={handleSubmit}>
                {/* Common Fields */}
                <input 
                    type="text" 
                    name="name" 
                    placeholder="Account Nickname" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                />
                
                {(accountType === 'bank' || accountType === 'mobile') && (
                    <input 
                        type="text" 
                        name="owner_name" 
                        placeholder="Owner Name (Optional)" 
                        value={formData.owner_name} 
                        onChange={handleChange} 
                        className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                )}

                {/* Type-Specific Fields */}
                {accountType === 'bank' && renderBankFields()}
                {accountType === 'mobile' && renderMobileFields()}
                {/* 'cash' accounts typically only have name and owner_name */}

                {/* Default Toggle */}
                <div className="flex items-center mb-6 justify-between">
                    <label htmlFor="is_default" className="text-gray-700">Set as Default Account?</label>
                    <input 
                        type="checkbox" 
                        id="is_default" 
                        name="is_default" 
                        checked={formData.is_default} 
                        onChange={handleChange} 
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-150"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader className="animate-spin w-5 h-5 inline mr-1" />
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditPaymentAccount;