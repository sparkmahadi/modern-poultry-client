import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const ExpenseThreads = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedThread, setSelectedThread] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Form State
  const [formData, setFormData] = useState({ name: '', total_cost: '', description: '' });

  // 1. Fetch all threads (Mocking data from Image 2 categories)
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/expense-threads`)
      const data = res.data.data;
      console.log(data);
      setThreads(data);
    } catch (err) {
      toast.error("Failed to sync with database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchThreads(); }, []);

  // 2. CRUD Handlers
  const handleOpenModal = (mode, thread = null) => {
    setModalMode(mode);
    setSelectedThread(thread);
    setFormData(thread ? { name: thread.name, total_cost: thread.total_cost, description: thread.description } : { name: '', total_cost: '', description: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this thread?")) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/api/expense-threads/${id}`);
        const data = (res.data);
        if(data.success){
          setThreads(threads.filter(t => t._id !== id));
          toast.success(data.message);
        } else{
          toast.info(data.message);
        }
      } catch (err) {
        toast.error("Delete operation failed");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE_URL}/api/expense-threads`, formData);
        console.log(formData);
        toast.success("New thread added!");
    } else if (modalMode === 'edit') {
        await axios.put(`${API_BASE_URL}/api/expense-threads/${selectedThread._id}`, formData);
        toast.success("Thread updated!");
        console.log(formData);
      }
      setIsModalOpen(false);
      fetchThreads();
    } catch (err) {
      toast.error("Process failed");
    }
  };

  if (loading) return <div className="p-10 text-center font-light text-gray-400">Loading Expense Threads...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Expense <span className="font-bold">Threads</span></h1>
          <p className="text-sm text-slate-400 mt-1 italic">Manage Bills, Rents, and Operations</p>
        </div>
        <button 
          onClick={() => navigate(`/bills`)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-lg"
        >
          Bills
        </button>
        <button 
          onClick={() => handleOpenModal('add')}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-lg"
        >
          + Add New Thread
        </button>
      </div>

      {/* Modern CRUD Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-widest">
              <th className="px-6 py-4">SL</th>
              <th className="px-6 py-4">Expense Name</th>
              <th className="px-6 py-4">Total Cost</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {threads.map((thread, index) => (
              <tr key={thread._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-400 font-medium">{index + 1}</td>
                <td className="px-6 py-4 text-slate-900 font-semibold">{thread.name}</td>
                <td className="px-6 py-4 text-slate-600 font-mono">${thread.total_cost}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal('view', thread)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition">Details</button>
                  <button onClick={() => handleOpenModal('edit', thread)} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition">Edit</button>
                  <button onClick={() => handleDelete(thread._id)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Multi-Purpose Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8">
            <h2 className="text-xl font-bold mb-6 text-slate-800">
              {modalMode === 'add' ? 'New Thread' : modalMode === 'edit' ? 'Update Thread' : 'Thread Overview'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expense Name</label>
                <input 
                  type="text" required disabled={modalMode === 'view'}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cost ($)</label>
                <input 
                  type="number" required disabled={modalMode === 'view'}
                  value={formData.total_cost}
                  onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes/Description</label>
                <textarea 
                  disabled={modalMode === 'view'}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-lg h-24 outline-none disabled:bg-slate-50"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 font-medium">
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-black transition">
                    Save Changes
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

export default ExpenseThreads;