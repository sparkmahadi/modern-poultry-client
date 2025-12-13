import React, { useEffect, useState } from "react";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  Trash2,
  Star,
  Loader,
  Edit, // Import the Edit icon
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import CreatePaymentAccount from "./CreatePaymentAccount";
import EditPaymentAccount from "./EditPaymentAccount"; 


// --- Config ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCOUNTS_URL = `${API_BASE_URL}/api/payment_accounts`;
const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;
// ----------------

const getAccountIcon = (type) => {
  if (type === "bank") return CreditCard;
  if (type === "cash") return Banknote;
  if (type === "mobile") return Smartphone;
  return DollarSign;
};

// Reusable Modal Component (defined previously)
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


const PaymentAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [activeTxAccount, setActiveTxAccount] = useState(null); 
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  // NEW STATE: For Edit Modal
  const [accountToEdit, setAccountToEdit] = useState(null); 

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState(null);
  const [txAmount, setTxAmount] = useState("");
  const [txRemarks, setTxRemarks] = useState("");
  const [txLoading, setTxLoading] = useState(false);

  // --------------------------------------------------
  // FETCH ACCOUNTS (Unchanged)
  // --------------------------------------------------
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(ACCOUNTS_URL);
      const data = res.data.data || [];
      setAccounts(data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // --------------------------------------------------
  // TRANSACTION HANDLER (Unchanged logic, using activeTxAccount)
  // --------------------------------------------------
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!activeTxAccount) return toast.error("No account selected for transaction.");
    // ... rest of transaction logic (omitted for brevity) ...

    const amount = Number(txAmount);
    if (!amount || amount <= 0)
      return toast.error("Invalid transaction amount");

    if (txType === "withdraw" && amount > activeTxAccount.balance)
      return toast.error("Insufficient balance");

    try {
      setTxLoading(true);

      const newBalance =
        txType === "add"
          ? activeTxAccount.balance + amount
          : activeTxAccount.balance - amount;

      await axios.put(`${ACCOUNTS_URL}/${activeTxAccount._id}`, {
        balance: newBalance,
      });

      console.log(newBalance);

      await axios.post(TRANSACTIONS_URL, {
        account_id: activeTxAccount._id,
        type: txType,
        transaction_type: txType === "add" ? "credit" : "debit",
        amount,
        remarks:
          txRemarks ||
          (txType === "add" ? "Manual Deposit" : "Manual Withdrawal"),
      });

      toast.success("Transaction successful");
      setTxModalOpen(false);
      setTxAmount("");
      setTxRemarks("");
      setActiveTxAccount(null);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setTxLoading(false);
    }
  };
  
  const openTxModal = (type, account) => {
      setActiveTxAccount(account);
      setTxType(type);
      setTxAmount("");
      setTxRemarks("");
      setTxModalOpen(true);
  };
  
  // --------------------------------------------------
  // EDIT HANDLERS (New)
  // --------------------------------------------------
  const handleEditClick = (account) => {
      setAccountToEdit(account);
  };

  const handleEditSuccess = () => {
      setAccountToEdit(null); // Close modal
      fetchAccounts(); // Refresh list to show updates
  };


  // --------------------------------------------------
  // DELETE ACCOUNT (Unchanged)
  // --------------------------------------------------
  const handleDeleteAccount = async (acc) => {
    if (acc.is_default)
      return toast.error("Default account cannot be deleted");

    if (!window.confirm(`Are you sure you want to delete the account: ${acc.name || acc.bank_name || acc.method}? This action is permanent.`)) return;

    try {
      await axios.delete(`${ACCOUNTS_URL}/${acc._id}`);
      toast.success("Account deleted successfully");
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };
  
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchAccounts();
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-6">
        <div className="p-6 text-center">
          <Loader className="animate-spin mx-auto w-8 h-8 text-indigo-600" />
          <p className="mt-2 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-2xl p-8">
      {/* HEADER AND ADD ACCOUNT BUTTON */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-3xl font-extrabold text-indigo-700 flex items-center">
          <DollarSign className="w-6 h-6 mr-3" /> All Payment Accounts
        </h2>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-150"
        >
          <Plus className="w-5 h-5 mr-1" /> Add New Account
        </button>
      </div>

      {/* ACCOUNTS DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.length > 0 ? (
          accounts.map((acc) => {
            const Icon = getAccountIcon(acc.type);
            const accountName = acc.name || acc.bank_name || acc.method;
            
            return (
              // Individual Account Card
              <div 
                key={acc._id} 
                className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition duration-300 flex flex-col"
              >
                {/* Account Header */}
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                  <div className="flex items-center">
                    <Icon className="w-6 h-6 mr-3 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-800">
                      {accountName}
                    </h3>
                    {acc.is_default && (
                      <Star className="w-4 h-4 ml-3 text-yellow-500 fill-yellow-500" title="Default Account" />
                    )}
                  </div>
                  
                  {/* Actions (Edit & Delete) */}
                  <div className="flex space-x-2">
                    {/* NEW EDIT BUTTON */}
                    <button
                        onClick={() => handleEditClick(acc)}
                        className="p-1 text-blue-500 hover:text-blue-700 transition duration-150"
                        title="Edit Account"
                    >
                        <Edit className="w-5 h-5" />
                    </button>

                    {/* Delete Button */}
                    {!acc.is_default && (
                      <button
                        onClick={() => handleDeleteAccount(acc)}
                        className="p-1 text-red-500 hover:text-red-700 transition duration-150"
                        title="Delete Account"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Balance Display */}
                <div className="text-center py-4 bg-white border border-dashed rounded-lg mb-6">
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="text-3xl font-extrabold text-indigo-600">
                    ৳ {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Transaction Buttons */}
                <div className="flex gap-4 mt-auto">
                  <button
                    onClick={() => openTxModal("add", acc)}
                    className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 font-semibold rounded-lg transition duration-150 shadow-md text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Deposit
                  </button>

                  <button
                    onClick={() => openTxModal("withdraw", acc)}
                    className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 font-semibold rounded-lg transition duration-150 shadow-md text-sm"
                  >
                    <Banknote className="w-4 h-4 mr-2" /> Withdraw
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 p-5 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 font-medium">No payment accounts found. Click "Add New Account" to get started.</p>
          </div>
        )}
      </div>

      {/* TRANSACTION MODAL (Unchanged) */}
      <Modal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setActiveTxAccount(null);
        }}
        title={txType === "add" ? 
               `Deposit to ${activeTxAccount?.name || activeTxAccount?.bank_name || 'Account'}` : 
               `Withdraw from ${activeTxAccount?.name || activeTxAccount?.bank_name || 'Account'}`
              }
      >
        <form onSubmit={handleTransactionSubmit}>
          {/* ... Transaction form fields ... */}
          <input
            type="number"
            className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Amount"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
          />

          <input
            type="text"
            className="w-full border border-gray-300 p-3 mb-6 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Remarks (Optional)"
            value={txRemarks}
            onChange={(e) => setTxRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setTxModalOpen(false);
                setActiveTxAccount(null);
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-150"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={txLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50"
            >
              {txLoading ? (
                <Loader className="animate-spin w-5 h-5 inline mr-1" />
              ) : (
                "Confirm Transaction"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE ACCOUNT MODAL (Unchanged) */}
      {showCreateModal && (
        <CreatePaymentAccount
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      
      {/* NEW EDIT ACCOUNT MODAL */}
      {accountToEdit && (
        <EditPaymentAccount
            account={accountToEdit}
            onClose={() => setAccountToEdit(null)}
            onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default PaymentAccounts;