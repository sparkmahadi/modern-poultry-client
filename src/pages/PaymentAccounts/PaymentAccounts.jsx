import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Clock,
  NotebookText,
  AlertTriangle,
  Loader,
  XCircle,
  Plus,
  Minus,
  Send,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Trash2, // Updated icon for delete
  ChevronsUpDown, // Updated icon for dropdown/selector
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ACCOUNTS_URL = `${API_BASE_URL}/api/payment_accounts`;
const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;

const getAccountIcon = (type) => {
  switch (type) {
    case "bank":
      return CreditCard;
    case "cash":
      return Banknote;
    case "mobile":
      return Smartphone;
    default:
      return DollarSign;
  }
};

const PaymentAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionRemarks, setTransactionRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // dropdown state

  // --- Fetch Accounts ---
  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(ACCOUNTS_URL);
      const fetchedAccounts = res.data.data || [];
      setAccounts(fetchedAccounts);

      // Re-select the previously selected account if it still exists
      if (selectedAccount && fetchedAccounts.find(acc => acc._id === selectedAccount._id)) {
        // Keep selectedAccount as is (will trigger re-render with updated data)
      } else {
        // Select the first account or null
        setSelectedAccount(fetchedAccounts[0] || null);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // --- Modal handlers ---
  const openModal = (type) => {
    setTransactionType(type);
    setTransactionAmount("");
    setTransactionRemarks("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTransactionType(null);
  };

  // --- Transaction ---
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount?._id) return;

    setIsProcessing(true);
    setError(null);

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      setIsProcessing(false);
      return;
    }
    
    // Check for sufficient balance on withdrawal
    if (transactionType === "withdraw" && amount > selectedAccount.balance) {
      setError("Insufficient balance for this withdrawal.");
      setIsProcessing(false);
      return;
    }

    try {
      const updatedBalance =
        transactionType === "add"
          ? selectedAccount.balance + amount
          : selectedAccount.balance - amount;

      // Update account balance
      await axios.put(`${ACCOUNTS_URL}/${selectedAccount._id}`, {
        balance: updatedBalance,
      });

      let transaction_type;
      if(transactionType === "add"){transaction_type = "credit"}
      if(transactionType === "withdraw"){transaction_type = "debit"}

      // Log transaction
      await axios.post(TRANSACTIONS_URL, {
        account_id: selectedAccount._id,
        type: transactionType,
        transaction_type,
        amount,
        remarks:
          transactionRemarks ||
          (transactionType === "add"
            ? "Manual Deposit"
            : "Manual Withdrawal"),
        created_at: new Date(),
      });

      toast.success("Transaction successful");
      await fetchAccounts();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CRUD: Create Account ---
  const handleCreateAccount = async (type) => {
    let payload = {};
    if (type === "cash") {
      const name = prompt("Enter a name for the Cash Account (e.g., Shop Cash Register)");
      if (!name) return toast.error("Cash Account Name is required");
      payload = { type, name, balance: 0 };
    } else if (type === "bank") {
      const bank_name = prompt("Enter Bank Name");
      const account_number = prompt("Enter Account Number");
      const routing_number = prompt("Enter Routing Number (Optional)");
      const branch_name = prompt("Enter Branch Name (Optional)");
      if (!bank_name || !account_number)
        return toast.error("Bank Name & Account Number required");
      payload = {
        type,
        bank_name,
        account_number,
        routing_number,
        branch_name,
        balance: 0,
      };
    } else if (type === "mobile") {
      const method = prompt("Enter Mobile Banking Method (e.g., bKash, Nagad)");
      const number = prompt("Enter Mobile Number");
      const owner_name = prompt("Enter Owner Name");
      if (!method || !number || !owner_name)
        return toast.error("Method, Number & Owner Name required");
      payload = { type, method, number, owner_name, balance: 0 };
    } else {
      return; // Should not happen
    }

    try {
      const res = await axios.post(ACCOUNTS_URL, payload);
      if (res.data.success) {
        toast.success(`${type} account created successfully`);
        setIsDropdownOpen(false);
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // --- CRUD: Delete Account ---
  const handleDeleteAccount = async (accountId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this account? This action cannot be undone."
    );
    if (!confirm) return;
    try {
      await axios.delete(`${ACCOUNTS_URL}/${accountId}`);
      toast.success("Account deleted successfully");
      // Check if the deleted account was the currently selected one
      if (selectedAccount?._id === accountId) {
        setSelectedAccount(null);
      }
      await fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const formattedBalance =
    typeof selectedAccount?.balance === "number"
      ? selectedAccount.balance.toLocaleString("en-US", {
          style: "currency",
          currency: "BDT",
        })
      : "N/A";

  // New DataRow component with subtle hover effect
  const DataRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition duration-100">
      {Icon && <Icon className="w-5 h-5 text-indigo-500 mr-4 flex-shrink-0" />}
      <span className="font-medium text-gray-600 text-sm w-36 truncate">{label}</span>
      <span className="text-base font-semibold text-gray-800 ml-auto text-right">{value}</span>
    </div>
  );
  
  // Custom Account Selector Item
  const AccountPill = ({ acc, isSelected, onClick, onDelete }) => {
    const Icon = getAccountIcon(acc.type);
    const displayName = acc.name || acc.bank_name || acc.method;

    return (
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={onClick}
          className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out border ${
            isSelected
              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
              : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          <Icon className="w-4 h-4 mr-2" />
          {displayName}
        </button>
        <button
          onClick={onDelete}
          className={`p-1 rounded-full ${isSelected ? 'text-red-300 hover:text-red-100' : 'text-red-500 hover:text-red-700'} transition duration-150`}
          title={`Delete ${displayName}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 flex flex-col items-center bg-white rounded-xl shadow-lg">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-indigo-700 font-medium">Loading financial accounts...</p>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 text-center bg-yellow-50 rounded-xl shadow-2xl border-t-4 border-yellow-500">
        <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto" />
        <p className="mt-4 text-xl text-yellow-800 font-bold">No Accounts Found</p>
        <p className="mt-2 text-yellow-700">Get started by creating your first payment account.</p>
        <div className="mt-6 space-y-3">
            {["cash", "bank", "mobile"].map((type) => (
                <button
                    key={type}
                    onClick={() => handleCreateAccount(type)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md"
                >
                    <Plus className="w-5 h-5 mr-2" /> Create {type.charAt(0).toUpperCase() + type.slice(1)} Account
                </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-2xl border-t-8 border-indigo-600 font-sans">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
        <DollarSign className="w-7 h-7 inline-block text-indigo-600 mr-2" />
        Payment Accounts
      </h2>
      
      {error && (
        <div className="flex items-start p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 mr-3" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* --- Account Selector --- */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {accounts.map((acc) => (
          <AccountPill
            key={acc._id}
            acc={acc}
            isSelected={selectedAccount?._id === acc._id}
            onClick={() => setSelectedAccount(acc)}
            onDelete={() => handleDeleteAccount(acc._id)}
          />
        ))}

        {/* --- Add Account Dropdown --- */}
        <div className="relative inline-block text-left ml-auto">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 transition duration-150 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Account
            <ChevronsUpDown className="w-4 h-4 ml-1" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 origin-top-right">
              <div className="py-1">
                {["cash", "bank", "mobile"].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleCreateAccount(type)}
                    className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition duration-100"
                  >
                    {type === 'cash' && <Banknote className="w-4 h-4 mr-2" />}
                    {type === 'bank' && <CreditCard className="w-4 h-4 mr-2" />}
                    {type === 'mobile' && <Smartphone className="w-4 h-4 mr-2" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {selectedAccount && (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="p-2 bg-indigo-100 rounded-full mr-3">
                        {React.createElement(getAccountIcon(selectedAccount.type), { className: "w-5 h-5 text-indigo-600" })}
                    </span>
                    {selectedAccount?.name || selectedAccount?.bank_name || selectedAccount?.method}
                </h3>
                <span className="text-sm font-medium text-indigo-500 capitalize px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                    {selectedAccount.type}
                </span>
            </div>

            {/* --- Account Balance Card --- */}
            <div className="text-center p-6 mb-6 bg-indigo-600 text-white rounded-xl shadow-lg">
                <p className="text-lg font-light opacity-80">Current Balance</p>
                <p className="text-6xl font-extrabold mt-1 tracking-tight">
                    {formattedBalance}
                </p>
            </div>

            {/* --- Action Buttons --- */}
            <div className="flex justify-center space-x-6 mb-8">
                <button
                    onClick={() => openModal("add")}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition duration-150 shadow-md transform hover:scale-[1.02]"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Funds
                </button>
                <button
                    onClick={() => openModal("withdraw")}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition duration-150 shadow-md transform hover:scale-[1.02]"
                >
                    <Minus className="w-5 h-5 mr-2" /> Withdraw
                </button>
            </div>

            {/* --- Account Details --- */}
            <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 ml-2">Account Details</h4>
                <div className="space-y-1">
                    <DataRow icon={DollarSign} label="Initial Balance" value={formattedBalance} />
                    <DataRow icon={Clock} label="Account Type" value={selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)} />
                    
                    {selectedAccount?.type === "bank" && (
                        <>
                            <DataRow icon={CreditCard} label="Account Number" value={selectedAccount.account_number} />
                            <DataRow icon={NotebookText} label="Branch Name" value={selectedAccount.branch_name || 'N/A'} />
                            {selectedAccount.routing_number && (
                                <DataRow icon={NotebookText} label="Routing Number" value={selectedAccount.routing_number} />
                            )}
                        </>
                    )}
                    {selectedAccount?.type === "mobile" && (
                        <>
                            <DataRow icon={Smartphone} label="Mobile Number" value={selectedAccount.number} />
                            <DataRow icon={NotebookText} label="Owner Name" value={selectedAccount.owner_name} />
                            <DataRow icon={NotebookText} label="Method" value={selectedAccount.method} />
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- Transaction Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleTransactionSubmit}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto transform transition-all duration-300 scale-100"
          >
            <div
              className={`flex justify-between items-center p-5 rounded-t-xl ${
                transactionType === "add"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              <h3 className="text-2xl font-extrabold">
                {transactionType === "add" ? "Add Funds" : "Withdraw Funds"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-full text-white hover:bg-white hover:text-gray-800 transition duration-150"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (BDT)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </span>
                  <input
                    type="number"
                    id="amount"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-semibold"
                    placeholder="0.00"
                    step="any"
                    min="0.01"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  id="remarks"
                  value={transactionRemarks}
                  onChange={(e) => setTransactionRemarks(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Initial Deposit, Cash Withdrawal"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-5 border-t bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition duration-150"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-lg transition duration-150 flex items-center font-semibold shadow-md ${
                  transactionType === "add"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {isProcessing
                  ? "Processing..."
                  : transactionType === "add"
                  ? "Confirm Add"
                  : "Confirm Withdraw"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentAccounts;