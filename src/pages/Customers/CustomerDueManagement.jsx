import React, { useState } from 'react';
import { Plus, CreditCard, Receipt, Calendar } from 'lucide-react';
import ManualDueModal from './ManualDueModal';
import DuePaymentModal from './DuePaymentModal';

const CustomerDueManagement = ({ customerId }) => {
  const [isManualModalOpen, setManualModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);

  // Mock data - replace with your API call
  const [dues, setDues] = useState([
    { id: '1', memoId: 'MEMO-101', amount: 500, date: '2023-12-01', status: 'Pending' },
    { id: '2', memoId: 'MEMO-105', amount: 1200, date: '2023-12-15', status: 'Partial' },
  ]);

  const handleOpenPayment = (memo) => {
    setSelectedMemo(memo);
    setPaymentModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Dues Management</h1>
        <button 
          onClick={() => setManualModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Add Manual Due
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Memo ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dues.map((due) => (
              <tr key={due.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{due.memoId}</td>
                <td className="p-4 text-gray-600">{due.date}</td>
                <td className="p-4 text-red-600 font-semibold">${due.amount}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {due.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleOpenPayment(due)}
                    className="text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                  >
                    <CreditCard size={16} /> Pay Due
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ManualDueModal 
        isOpen={isManualModalOpen} 
        onClose={() => setManualModalOpen(false)} 
      />
      <DuePaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        memo={selectedMemo}
      />
    </div>
  );
};

export default CustomerDueManagement;