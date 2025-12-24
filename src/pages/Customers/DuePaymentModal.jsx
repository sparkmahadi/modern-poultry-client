import React from 'react';

const DuePaymentModal = ({ isOpen, onClose, memo }) => {
  if (!isOpen || !memo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-2 text-green-700">Receive Due Payment</h2>
        <p className="text-sm text-gray-500 mb-4">Paying for Memo: <span className="font-bold">{memo.memoId}</span></p>
        
        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="text-sm">Current Outstanding: <b>${memo.amount}</b></p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Payment Amount</label>
            <input 
              type="number" 
              defaultValue={memo.amount} 
              className="w-full border p-2 rounded mt-1 font-bold text-green-600" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Payment Method</label>
            <select className="w-full border p-2 rounded mt-1">
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onClose} type="button" className="px-4 py-2 text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DuePaymentModal;