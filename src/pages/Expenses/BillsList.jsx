import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BillsList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [currentBill, setCurrentBill] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    billId: '',
    billName: '',
    amount: '',
    paymentAc: '',
    remarks: ''
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      // Replace with your MERN backend URL: axios.get('http://localhost:5000/api/bills')
      const response = await axios.get('https://jsonplaceholder.typicode.com/todos?_limit=5');
      
      // Mocking data based on your specific requirements
      const mockData = [
        { id: 1, billId: 'B-001', billName: 'Shop Rent', amount: 5000, paymentAc: 'Bank Transfer', remarks: 'Main branch' },
        { id: 2, billId: 'B-002', billName: 'Electric Bill A', amount: 120, paymentAc: 'Cash', remarks: 'Ground floor' },
      ];
      setBills(mockData);
    } catch (error) {
      toast.error("Failed to load bill data.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, bill = null) => {
    setModalMode(mode);
    setCurrentBill(bill);
    setFormData(bill || { billId: '', billName: '', amount: '', paymentAc: '', remarks: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this bill record?")) {
      try {
        // await axios.delete(`/api/bills/${id}`);
        setBills(bills.filter(b => b.id !== id));
        toast.success("Record deleted successfully.");
      } catch (err) {
        toast.error("Error deleting record.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        // await axios.post('/api/bills', formData);
        toast.success("New bill added!");
      } else {
        // await axios.put(`/api/bills/${currentBill.id}`, formData);
        toast.success("Bill updated successfully!");
      }
      setShowModal(false);
      fetchBills();
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading records...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ToastContainer position="bottom-right" />
      
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
          <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">Financial Ledger</h2>
          <button 
            onClick={() => openModal('add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-blue-100"
          >
            + Create New Entry
          </button>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr className="text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">SL</th>
                <th className="px-6 py-4">Bill ID</th>
                <th className="px-6 py-4">Bill Name</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment A/C</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.map((bill, index) => (
                <tr key={bill.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 text-gray-400 text-sm font-medium">{index + 1}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm font-mono">{bill.billId}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{bill.billName}</td>
                  <td className="px-6 py-4 text-blue-600 font-bold">${bill.amount}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{bill.paymentAc}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm truncate max-w-[150px]">{bill.remarks}</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => openModal('view', bill)} className="text-xs px-3 py-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Details</button>
                    <button onClick={() => openModal('edit', bill)} className="text-xs px-3 py-1 bg-blue-50 rounded text-blue-600 hover:bg-blue-100">Edit</button>
                    <button onClick={() => handleDelete(bill.id)} className="text-xs px-3 py-1 bg-red-50 rounded text-red-600 hover:bg-red-100">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {modalMode === 'add' ? 'New Bill Entry' : modalMode === 'edit' ? 'Update Bill' : 'Record Details'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Bill ID</label>
                  <input 
                    type="text" required disabled={modalMode === 'view'}
                    value={formData.billId}
                    onChange={(e) => setFormData({...formData, billId: e.target.value})}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Amount ($)</label>
                  <input 
                    type="number" required disabled={modalMode === 'view'}
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Bill Name</label>
                <input 
                  type="text" required disabled={modalMode === 'view'}
                  value={formData.billName}
                  onChange={(e) => setFormData({...formData, billName: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Payment A/C</label>
                <select 
                  disabled={modalMode === 'view'}
                  value={formData.paymentAc}
                  onChange={(e) => setFormData({...formData, paymentAc: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="">Select Account</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card Payment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Remarks</label>
                <textarea 
                  disabled={modalMode === 'view'}
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none h-24 disabled:bg-gray-50"
                />
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-400 hover:text-gray-600">
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-semibold shadow-lg shadow-blue-100">
                    {modalMode === 'add' ? 'Save Record' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsList;