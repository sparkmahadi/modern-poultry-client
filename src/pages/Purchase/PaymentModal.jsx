import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PaymentModal = ({ isOpen, onClose, onSelectPayment, defaultPaymentMethod, defaultSelectedAccount }) => {
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod || "");
  const [accountList, setAccountList] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(defaultSelectedAccount);

  useEffect(() => {
    if (isOpen) fetchAccounts();
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
      setAccountList(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
      toast.error("Failed to fetch accounts");
    }
  };

  useEffect(() => {
    if (!paymentMethod || accountList.length === 0) return;

    const defaultAccount = accountList.find(
      (acc) => acc.type === paymentMethod && acc.is_default
    );

    if (defaultAccount) setSelectedAccount(defaultAccount._id);
  }, [paymentMethod, accountList]);

  const handleSave = () => {
    if (!paymentMethod) return toast.warn("Select a payment method");
    if (!selectedAccount) return toast.warn("Select an account");
    onSelectPayment({ paymentMethod, accountId: selectedAccount });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Select Payment</h2>

        <label className="block mb-2 font-medium text-gray-700">Payment Method</label>
        <div className="flex gap-3 mb-4">
          {[
            { key: "cash", label: "Cash" },
            { key: "bank", label: "Bank" },
            { key: "mobile", label: "Mobile Wallet" },
          ].map((method) => (
            <button
              key={method.key}
              type="button"
              className={`p-2 border rounded ${
                paymentMethod === method.key
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
              }`}
              onClick={() => {
                setPaymentMethod(method.key);
                setSelectedAccount(""); // reset account selection
              }}
            >
              {method.label}
            </button>
          ))}
        </div>

        {paymentMethod && (
          <>
            <label className="block mb-2 font-medium text-gray-700">Select Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">-- Select Account --</option>
              {accountList
                .filter((a) => a.type === paymentMethod)
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {paymentMethod === "cash"
                      ? `${a.name} (Balance: ${a.balance})`
                      : paymentMethod === "bank"
                      ? `${a.bank_name} - ${a.account_number} (Balance: ${a.balance})`
                      : `${a.method?.toUpperCase()} - ${a.number} (Balance: ${a.balance})`}
                  </option>
                ))}
            </select>
          </>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
