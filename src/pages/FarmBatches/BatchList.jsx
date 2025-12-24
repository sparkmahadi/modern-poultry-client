import React, { useEffect, useState, useMemo } from 'react';
import DashboardSummaryCards from './Dash';
import { Link } from 'react-router'; 
import axios from 'axios';
import { toast } from 'react-toastify';
import CreateBatchForm from './CreateBatchForm';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const statusColors = {
    'Active': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'High Mortality': 'bg-red-100 text-red-800',
  };

  // --- CALCULATION LOGIC ---
  const stats = useMemo(() => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return batches.reduce((acc, batch) => {
      const qty = Number(batch.chicksQuantity) || 0;
      
      if (batch.active) {
        acc.activeBatches += 1;
        acc.activeChicks += qty;

        // Check if ready in next 3 days
        if (batch.expectedEndDate) {
          const expDate = new Date(batch.expectedEndDate);
          if (expDate >= today && expDate <= threeDaysFromNow) {
            acc.readyChicks += qty;
          }
        }
      } else {
        acc.completedBatches += 1;
        acc.completedChicks += qty;
      }
      
      return acc;
    }, {
      activeBatches: 0,
      activeChicks: 0,
      completedBatches: 0,
      completedChicks: 0,
      readyChicks: 0
    });
  }, [batches]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/batches`);
      if (response?.data?.success) {
        setBatches(response?.data?.batches || []);
      }
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Handlers...
  const handleOpenCreate = () => { setEditingBatch(null); setIsModalOpen(true); };
  const handleOpenEdit = (batch) => { setEditingBatch(batch); setIsModalOpen(true); };
  const handleFormSuccess = () => { setIsModalOpen(false); fetchBatches(); };

  const deleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/batches/${batchId}`);
      toast.success('Batch deleted successfully!');
      fetchBatches();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {isModalOpen && (
        <CreateBatchForm
          batchData={editingBatch}
          onSuccess={handleFormSuccess}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Batch Management Dashboard</h1>
      
      {/* Pass the calculated stats to your Summary Cards component */}
      <DashboardSummaryCards stats={stats} />

      <hr className="my-8" />

      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">All Batches</h2>
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition"
          >
            ➕ Add New Batch
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Batch ID', 'Farmer', 'Start Date', 'Status', "Chicks", 'Expected End Date', "Breed", 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{batch._id.slice(-6)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{batch.farmer}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(batch.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${batch.active ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {batch.active ? 'Active' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{batch.chicksQuantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{batch.expectedEndDate || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{batch.chicksBreed}</td>
                  <td className="px-6 py-4 text-sm font-medium space-x-3">
                    <button onClick={() => handleOpenEdit(batch)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <Link to={batch._id} className="text-indigo-600 hover:text-indigo-900">Details</Link>
                    <button onClick={() => deleteBatch(batch._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchList;