import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Shop Assistant',
    wage_type: 'DAILY', // 'DAILY', 'MONTHLY'
    base_salary: ''
  });
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Replaced jsonplaceholder with your actual server endpoint
      const response = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(response.data.data || []);
    } catch (err) {
      // Fallback sample data if the backend endpoint is not yet seeded
      setEmployees([
        { _id: '1', name: 'Karim Ullah', role: 'Store Keeper', wage_type: 'MONTHLY', base_salary: 15000, joined_date: '2025-01-10' },
        { _id: '2', name: 'Rafiqul Islam', role: 'Feed Loader', wage_type: 'DAILY', base_salary: 600, joined_date: '2025-04-01' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handlePayWage = (employee) => {
    // Navigates directly to the bill register with pre-populated parameters
    navigate('/bills', {
      state: {
        payeeName: employee.name,
        amount: employee.base_salary,
        remarks: `Salary payment for ${employee.name} (${employee.role})`
      }
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/employees`, {
        ...formData,
        base_salary: Number(formData.base_salary)
      });
      toast.success('Staff added successfully');
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to create employee profile');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-medium">Loading Shop Staff...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Shop <span className="font-bold">Staff & Wages</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage shopkeepers, loading staff, and wage disbursements</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition shadow-md"
          >
            + Add New Employee
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-white">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">SL</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Wage Structure</th>
                <th className="px-6 py-4 text-right">Base Pay (৳)</th>
                <th className="px-6 py-4 text-center">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp, index) => (
                <tr key={emp._id || index} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {emp.name}
                    {emp.phone && <span className="block text-xs font-normal text-slate-400">{emp.phone}</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                        emp.wage_type === 'DAILY' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {emp.wage_type === 'DAILY' ? 'Daily Wage' : 'Monthly Salary'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                    ৳{Number(emp.base_salary).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handlePayWage(emp)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-lg transition"
                    >
                      Disburse Wage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800">New Staff Profile</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Wage Type</label>
                  <select
                    value={formData.wage_type}
                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="DAILY">Daily Wage</option>
                    <option value="MONTHLY">Monthly Salary</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Wage Amount (৳)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 500 or 15000"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    className="w-full mt-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-black transition"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;