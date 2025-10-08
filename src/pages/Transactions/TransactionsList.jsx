import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Loader,
  XCircle,
  Trash2,
  Edit,
  Send,
  X,
} from 'lucide-react';

// Define the API URL based on your environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URLLL;
const TRANSACTIONS_API_URL = API_BASE_URL + '/api/transactions';

const TransactionsList = () => {
  // --- State Management ---
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for Modals (Update and Delete)
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({});

  // --- Data Fetching Logic ---
  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(TRANSACTIONS_API_URL);
      setTransactions(response.data.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(
        `Failed to load transactions: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // --- Utility Functions ---

  const extractAmount = (data) => {
    if (data === null || data === undefined) return null;

    if (typeof data === 'object') {
        if (data.$numberDouble && data.$numberDouble !== 'NaN') {
            return parseFloat(data.$numberDouble);
        }
        if (data.amount !== undefined) {
            data = data.amount;
        } else {
            return null; 
        }
    }
    
    const amount = parseFloat(data);
    return isNaN(amount) ? null : amount;
  };

  const formatAmount = (data) => {
    const amount = extractAmount(data);

    if (amount === null || isNaN(amount)) return 'N/A';
    
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getTransactionId = (tx) => {
    return tx._id?.$oid || tx._id || 'N/A';
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    const date = dateObj.$date ? new Date(dateObj.$date) : new Date(dateObj);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatTime = (timeStr) => {
      if (!timeStr) return 'N/A';
      try {
          const [h, m, s] = timeStr.split(':');
          const date = new Date();
          date.setHours(parseInt(h));
          date.setMinutes(parseInt(m));
          date.setSeconds(parseInt(s));
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      } catch {
          return timeStr;
      }
  };

  // --- Delete Handler ---
  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    setIsProcessing(true);
    setError(null);
    
    const txId = getTransactionId(deletingTransaction);

    try {
      await axios.delete(`${TRANSACTIONS_API_URL}/${txId}`);
      setDeletingTransaction(null);
      await fetchTransactions();
      alert('Transaction deleted successfully!');
    } catch (err) {
      console.error('Delete failed:', err);
      setError(`Delete failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Update Handlers ---
  const openUpdateModal = (transaction) => {
    setEditingTransaction(transaction);
    
    const rawAmount = extractAmount(transaction.amount);

    setUpdateFormData({
      particulars: transaction.particulars,
      amount: rawAmount === null ? '' : rawAmount, 
      remarks: transaction.remarks,
    });
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setIsProcessing(true);
    setError(null);
    
    const txId = getTransactionId(editingTransaction);
    
    let parsedAmount = parseFloat(updateFormData.amount);
    
    const payload = {
      particulars: updateFormData.particulars,
      amount: isNaN(parsedAmount) ? null : parsedAmount, 
      remarks: updateFormData.remarks || undefined,
    };

    try {
      const response = await axios.put(`${TRANSACTIONS_API_URL}/${txId}`, payload);
      
      setEditingTransaction(null);
      await fetchTransactions();
      alert(response.data.message || 'Transaction updated successfully!');
    } catch (err) {
      console.error('Update failed:', err);
      setError(`Update failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Rendering States ---
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 flex flex-col items-center bg-white rounded-xl shadow-lg">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-indigo-700 font-medium">Loading transactions...</p>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-2xl font-sans">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
        Cash Transactions History
      </h2>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 mr-3" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Transaction Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Particulars / Source
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance After
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={getTransactionId(tx)} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="block text-indigo-700 font-semibold">{formatDate(tx.date)}</span>
                    <span className="block text-gray-500 text-xs">{formatTime(tx.time)}</span>
                  </td>
                  <td className="px-4 py-3 max-w-sm whitespace-normal text-sm text-gray-700">
                    <p className="font-medium">{tx.particulars || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Source: {tx.entry_source}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        tx.transaction_type === 'credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.transaction_type.toUpperCase()}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-right text-sm font-bold ${
                      tx.transaction_type === 'credit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {tx.transaction_type === 'credit' ? '+' : '-'} {formatAmount(tx.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                    {formatAmount(tx.balance_after_transaction)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => openUpdateModal(tx)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 mr-2 rounded-full hover:bg-indigo-50"
                      title="Edit Transaction"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingTransaction(tx)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-base">
                  No cash transactions found for this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Delete Confirmation Modal (Omitted for brevity) --- */}
      {deletingTransaction && (
        <Modal
          title="Confirm Deletion"
          onClose={() => setDeletingTransaction(null)}
          onConfirm={handleDeleteTransaction}
          isProcessing={isProcessing}
          buttonClass="bg-red-600 hover:bg-red-700"
          buttonText="Delete Permanently"
        >
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this transaction? This action **cannot be undone** and may affect the cash balance calculation.
          </p>
          <p className="font-semibold text-sm">
            Transaction: {deletingTransaction.particulars} ({deletingTransaction.transaction_type.toUpperCase()})
          </p>
        </Modal>
      )}

      {/* --- Update Modal (FIXED) --- */}
      {editingTransaction && (
        <Modal
          title="Update Transaction"
          onClose={() => setEditingTransaction(null)}
          onConfirm={handleUpdateSubmit}
          isProcessing={isProcessing}
          buttonClass="bg-indigo-600 hover:bg-indigo-700"
          buttonText="Save Changes"
          isForm={true}
          formId="update-transaction-form" // <-- NEW PROP
        >
          <form id="update-transaction-form" onSubmit={handleUpdateSubmit} className="space-y-4"> {/* <-- NEW ID */}
            <div className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50 text-sm">
                <span className="font-medium text-gray-600">ID:</span>
                <span className="text-gray-800 break-all">{getTransactionId(editingTransaction)}</span>
            </div>
            
            {/* Particulars */}
            <div>
              <label htmlFor="particulars" className="block text-sm font-medium text-gray-700">Particulars</label>
              <input
                type="text"
                id="particulars"
                name="particulars"
                value={updateFormData.particulars}
                onChange={handleUpdateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={updateFormData.amount}
                onChange={handleUpdateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                step="any"
                min="0"
              />
            </div>
            
            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
              <input
                type="text"
                id="remarks"
                name="remarks"
                value={updateFormData.remarks || ''}
                onChange={handleUpdateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};


// --- Generic Modal Component for Reusability (FIXED) ---
const Modal = ({ title, children, onClose, onConfirm, isProcessing, buttonText, buttonClass, isForm = false, formId }) => {
    // If it's a form, the button action is already attached to the form's onSubmit
    const handleAction = isForm ? undefined : onConfirm; 

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {children}
                </div>

                {/* Modal Footer/Actions */}
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        type={isForm ? "submit" : "button"}
                        onClick={handleAction}
                        className={`px-4 py-2 text-white rounded-lg transition duration-150 flex items-center ${buttonClass}`}
                        disabled={isProcessing}
                        form={isForm ? formId : undefined} // <--- CRITICAL FIX APPLIED HERE
                    >
                        {isProcessing ? (
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 mr-2" />
                        )}
                        {isProcessing ? 'Processing...' : buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default TransactionsList;