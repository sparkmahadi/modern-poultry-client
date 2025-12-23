import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UniversalPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSelectPayment, 
  defaultPaymentMethod, 
  defaultSelectedAccount 
}) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountList, setAccountList] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");

  // Sync internal state with props whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(defaultPaymentMethod || "");
      setSelectedAccount(defaultSelectedAccount || "");
      fetchAccounts();
    }
  }, [isOpen, defaultPaymentMethod, defaultSelectedAccount]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
      setAccountList(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
      toast.error("Failed to fetch accounts");
    }
  };

  // Auto-select default account when method changes
  useEffect(() => {
    if (!paymentMethod || accountList.length === 0) return;

    // Only auto-select if there isn't already a valid selection for this method
    const currentAccount = accountList.find(a => a._id === selectedAccount);
    if (currentAccount && currentAccount.type === paymentMethod) return;

    const defaultAccount = accountList.find(
      (acc) => acc.type === paymentMethod && acc.is_default
    );

    if (defaultAccount) setSelectedAccount(defaultAccount._id);
    else setSelectedAccount(""); 
  }, [paymentMethod, accountList]);

  const handleSave = () => {
    if (!paymentMethod) return toast.warn("Select a payment method");
    if (!selectedAccount) return toast.warn("Select an account");
    
    const accountDetails = accountList.find(a => a._id === selectedAccount);
    onSelectPayment({ 
      paymentMethod, 
      accountId: selectedAccount,
      accountLabel: accountDetails?.bank_name || accountDetails?.name || "Selected Account"
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Select Payment Source</h2>

        <label className="block mb-2 font-medium text-gray-700">Payment Method</label>
        <div className="flex gap-2 mb-6">
          {["cash", "bank", "mobile"].map((key) => (
            <button
              key={key}
              type="button"
              className={`flex-1 py-2 px-3 border rounded-lg capitalize transition-all ${
                paymentMethod === key
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                  : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
              }`}
              onClick={() => setPaymentMethod(key)}
            >
              {key}
            </button>
          ))}
        </div>

        {paymentMethod && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block mb-2 font-medium text-gray-700">Select Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Choose Account --</option>
              {accountList
                .filter((a) => a.type === paymentMethod)
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.bank_name || a.name} - {a.account_number || a.number} (৳{a.balance})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md">
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalPaymentModal;