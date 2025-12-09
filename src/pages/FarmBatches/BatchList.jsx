import React, { useEffect, useState } from 'react';
import DashboardSummaryCards from './Dash';
import { Link } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';


const BatchList = () => {
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEndBatch = (batchId) => {
    // Placeholder for End Batch Flow logic
    alert(`Starting End Batch Flow for Batch ID: ${batchId}`);
  };

  const statusColors = {
    'Active': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'High Mortality': 'bg-red-100 text-red-800',
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // --- API Call Functions ---

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/batches`);
      if (response?.data?.success) {
        setBatches(response?.data?.batches || []);
        console.log(response?.data?.batches);
      } else {
        toast.error('Batch Data Not Loaded!');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error(error.response?.data?.message || 'Failed to load products. Please try again.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);


    const handleDeleteBatch = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this product?")) { // Using confirm for quick demo
      await deleteBatch(batchId);
    }
  };

    const deleteBatch = async (batchId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/batches/${batchId}`);
      toast.success('Product deleted successfully!');
      await fetchBatches(); // Re-fetch to update the list
      return { success: true };
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Batch Management Dashboard</h1>

      {/* A. Top Summary Cards */}
      <DashboardSummaryCards />

      <hr className="my-8" />

      {/* 2. Batch List / Table Screen */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">All Batches</h2>
          <Link to='create-batch'
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150"
          >
            ➕ Add New Batch
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex space-x-4 mb-6">
          <input
            type="text"
            placeholder="Search by Batch ID or Farmer Name"
            className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select className="p-2 border border-gray-300 rounded-lg">
            <option>All Batches</option>
            <option>Active</option>
            <option>Completed</option>
            <option>High Mortality</option>
          </select>
        </div>

        {/* Batch Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Batch ID', 'Farmer', 'Start Date', 'Feed Used (kg)', 'Mortality (%)', 'Hens Ready', 'Status', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.farmer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.feedAssigned}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${batch.mortality > 10 ? 'text-red-600' : batch.mortality > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {batch.mortality}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.expectedEndDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[batch.status]}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link to={batch._id} className="text-indigo-600 hover:text-indigo-900">View Details</Link>
                    {batch.status !== 'Completed' && (
                      <button onClick={() => handleEndBatch(batch._id)} className="text-red-600 hover:text-red-900">End Batch</button>
                    )}
                    <button onClick={()=>handleDeleteBatch(batch._id)} className="text-yellow-600 hover:text-yellow-900">Delete</button>
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