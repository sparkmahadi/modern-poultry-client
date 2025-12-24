import React from 'react';

const ManualDueModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Manual Due</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input type="number" className="w-full border p-2 rounded mt-1" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description/Reason</label>
            <textarea className="w-full border p-2 rounded mt-1" rows="3"></textarea>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} type="button" className="px-4 py-2 text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Due</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualDueModal;