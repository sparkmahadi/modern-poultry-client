import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper components for consistency and readability
const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500 transition duration-150"
      required={required}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-blue-500 focus:border-blue-500 transition duration-150"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const CustomerManager = () => {
  const API_BASE_URL = "http://localhost:5000/api/customers";
  const initialFormState = {
    name: "",
    address: "",
    phone: "",
    type: "permanent",
    due: 0,
    advance: 0,
    status: "active",
  };

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_BASE_URL);
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch customers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Ensure numerical inputs are parsed correctly
    const newValue = type === 'number' ? Number(value) : value;
    setForm({ ...form, [name]: newValue });
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/${editingId}`, form);
      } else {
        await axios.post(API_BASE_URL, form);
      }
      resetForm();
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setError(`Failed to ${editingId ? 'update' : 'add'} customer.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setForm(customer);
    setEditingId(customer._id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the form
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete customer.");
    }
  };

  const getStatusBadge = (status) => {
    const color = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color} capitalize`}>{status}</span>;
  };

  const getBalanceStyle = (due, advance) => {
    const balance = due - advance;
    if (balance > 0) return { className: 'text-red-600 font-bold', label: `Due: ৳${balance.toFixed(2)}` };
    if (balance < 0) return { className: 'text-green-600 font-bold', label: `Credit: ৳${Math.abs(balance).toFixed(2)}` };
    return { className: 'text-gray-500', label: 'Settled' };
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b pb-2">👥 Customer Management</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === Customer Form Card === */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            {editingId ? "✏️ Edit Customer" : "➕ Add New Customer"}
          </h2>
          <hr className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
              />
              <SelectField
                label="Customer Type"
                name="type"
                value={form.type}
                onChange={handleChange}
                options={[
                  { value: "permanent", label: "Permanent" },
                  { value: "temporary", label: "Temporary" },
                ]}
              />
            </div>
            <InputField
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address / Location"
            />
            
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              {/* Note: due/advance should ideally be managed by transactions, but for UI, we show the input */}
              <InputField
                label="Current Due (৳)"
                name="due"
                type="number"
                value={form.due}
                onChange={handleChange}
                placeholder="0"
              />
              <InputField
                label="Current Advance (৳)"
                name="advance"
                type="number"
                value={form.advance}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <SelectField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-150 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : editingId ? "Update Customer" : "Add Customer"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* === Customer List Table === */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer List ({customers.length})</h2>
          <hr className="mb-4" />

          {isLoading && !customers.length ? (
            <div className="text-center py-10 text-gray-500">Loading data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((c) => {
                    const balanceInfo = getBalanceStyle(c.due, c.advance);
                    return (
                      <tr key={c._id} className="hover:bg-yellow-50/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.phone}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{c.address}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700 capitalize">{c.type}</span>
                          <div className="mt-1">{getStatusBadge(c.status)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className={`text-sm ${balanceInfo.className}`}>{balanceInfo.label}</div>
                          <div className="text-xs text-gray-400 mt-1">(D: ৳{c.due.toFixed(2)} / A: ৳{c.advance.toFixed(2)})</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-yellow-600 transition"
                              onClick={() => handleEdit(c)}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition"
                              onClick={() => handleDelete(c._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && customers.length === 0 && (
            <div className="text-center py-10 text-gray-500">No customers recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;