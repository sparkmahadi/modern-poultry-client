import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, NotebookText, AlertTriangle, Loader, XCircle, Plus, Minus, Send, X } from 'lucide-react';
import axios from 'axios';

// API Endpoint for the specific account
// Assuming this base URL and structure is correct for your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URLLL; 
const ACCOUNT_FETCH_URL = API_BASE_URL + '/api/cash';
const ADD_CASH_URL = API_BASE_URL + '/api/cash/add';
const WITHDRAW_CASH_URL = API_BASE_URL + '/api/cash/withdraw';

const CashData = () => {
  // --- State Management ---
  const [accountData, setAccountData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the transaction modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState(null); // 'add' or 'withdraw'
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionRemarks, setTransactionRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Data Fetching Logic ---
  const fetchAccountData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(ACCOUNT_FETCH_URL);
      // Ensure we handle the array of data and pick the first item as expected
      setAccountData(response.data.data?.[0] || null);
    } catch (err) {
      console.error("Failed to fetch account data:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to load account details: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []); // Runs only once on mount

  // --- Transaction Handlers ---
  const openModal = (type) => {
    setTransactionType(type);
    setTransactionAmount('');
    setTransactionRemarks('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTransactionType(null);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    const url = transactionType === 'add' ? ADD_CASH_URL : WITHDRAW_CASH_URL;
    const amount = parseFloat(transactionAmount);

    if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount greater than zero.");
        setIsProcessing(false);
        return;
    }

    const payload = {
        amount,
        remarks: transactionRemarks || (transactionType === 'add' ? "Manual Deposit" : "Manual Withdrawal"),
        created_by: "CashDataComponentUser" // Default user for component
    };

    try {
        const res = await axios.post(url, payload);
        
        // Success: Refetch data to show updated balance
        await fetchAccountData();
        
        alert(res.data.message);
        closeModal();
    } catch (err) {
        console.error("Transaction failed:", err);
        const errorMessage = err.response?.data?.message || err.message;
        setError(`Transaction failed: ${errorMessage}`);
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Utility Functions for Rendering ---
  const { name, currency, last_updated, remarks, balance, current_balance } = accountData || {};

  const formattedDate = last_updated 
    ? new Date(last_updated).toLocaleString() 
    : 'N/A';

  const formattedBalance = balance?.toLocaleString('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) || 'N/A';

  const isBalanceInvalid = current_balance?.$numberDouble === "NaN";


  // --- Helper Component for Data Rows ---
  const DataRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-center text-gray-700 ${className}`}>
      <Icon className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />
      <span className="font-medium w-32 text-sm truncate">{label}:</span>
      <span className="text-sm font-semibold text-gray-800 ml-auto text-right">{value}</span>
    </div>
  );

  // --- Rendering Logic for Loading/Error States ---
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 flex flex-col items-center bg-white rounded-xl shadow-lg">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-indigo-700 font-medium">Loading account data...</p>
      </div>
    );
  }

  if (!accountData) {
      return (
          <div className="max-w-md mx-auto mt-10 p-6 text-center bg-yellow-50 rounded-xl shadow-lg border-t-4 border-yellow-500">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto" />
              <p className="mt-2 text-yellow-800 font-semibold">No account data available.</p>
          </div>
      );
  }

  // --- Main Render ---
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600 font-sans">
      
      {/* Error Alert for Transactions */}
      {error && (
        <div className="flex items-start p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 mr-3" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h1 className="text-2xl font-extrabold text-indigo-900 truncate" title={name}>
          {name}
        </h1>
        <div className={`px-3 py-1 text-xs font-bold rounded-full text-white ${currency === 'BDT' ? 'bg-green-600' : 'bg-gray-600'}`}>
            {currency}
        </div>
      </div>

      {/* Main Balance */}
      <div className="text-center mb-6 py-4 bg-indigo-50 rounded-lg">
        <p className="text-lg text-indigo-700 font-medium">Account Balance</p>
        <p className="text-5xl font-black text-indigo-800 mt-1">
          {formattedBalance}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => openModal('add')}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition duration-150 shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Cash
        </button>
        <button
          onClick={() => openModal('withdraw')}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition duration-150 shadow-md"
        >
          <Minus className="w-5 h-5 mr-2" /> Withdraw
        </button>
      </div>

      {/* Details Section */}
      <div className="space-y-3">
        
        <DataRow 
          icon={DollarSign} 
          label="Primary Balance" 
          value={balance?.toLocaleString() || 'N/A'} 
        />
        
        <DataRow 
          icon={Clock} 
          label="Last Updated" 
          value={formattedDate} 
        />
        
        {/* Remarks/Description Row */}
        <div className="text-gray-700 pt-2 border-t border-gray-100">
            <div className="flex items-start">
                <NotebookText className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
                <div className='flex flex-col'>
                    <span className="font-medium text-sm">Remarks:</span>
                    <span className="text-sm italic text-gray-600 mt-1">{remarks || 'No remarks provided.'}</span>
                </div>
            </div>
        </div>

        {/* Invalid Balance Alert */}
        {isBalanceInvalid && (
          <div className="flex items-start p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md mt-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 mr-3" />
            <p className="text-sm font-medium">
              **Current Balance Warning:** The secondary `current_balance` field reported an invalid value (NaN).
            </p>
          </div>
        )}
      </div>

      {/* --- Transaction Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleTransactionSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-auto">
            
            {/* Modal Header */}
            <div className={`flex justify-between items-center border-b p-4 rounded-t-lg 
                            ${transactionType === 'add' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              <h3 className="text-xl font-bold">
                {transactionType === 'add' ? 'Add Cash (Deposit)' : 'Withdraw Cash'}
              </h3>
              <button type="button" onClick={closeModal} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body/Form */}
            <div className="p-6 space-y-4">
              
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount ({currency || 'USD'})</label>
                <input
                  type="number"
                  id="amount"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  step="any"
                  min="0.01"
                  required
                />
              </div>

              {/* Remarks Input */}
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                <input
                  type="text"
                  id="remarks"
                  value={transactionRemarks}
                  onChange={(e) => setTransactionRemarks(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

            </div>

            {/* Modal Footer/Actions */}
            <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-150"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-md transition duration-150 flex items-center ${
                    transactionType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                    <Send className="w-5 h-5 mr-2" />
                )}
                {isProcessing ? 'Processing...' : (transactionType === 'add' ? 'Confirm Deposit' : 'Confirm Withdrawal')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CashData;