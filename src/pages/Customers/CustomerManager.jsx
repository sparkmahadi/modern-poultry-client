import React, { useEffect, useState } from "react";
import axios from "axios";

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    type: "permanent",
    due: 0,
    advance: 0,
    status: "active",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/customers/${editingId}`, form);
      } else {
        await axios.post("http://localhost:5000/api/customers", form);
      }
      setForm({
        name: "",
        address: "",
        phone: "",
        type: "permanent",
        due: 0,
        advance: 0,
        status: "active",
      });
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (customer) => {
    setForm(customer);
    setEditingId(customer._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Customer" : "Add Customer"}</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="border p-2 w-full"
          required
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="border p-2 w-full"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="border p-2 w-full"
        />
        <select name="type" value={form.type} onChange={handleChange} className="border p-2 w-full">
          <option value="permanent">Permanent</option>
          <option value="temporary">Temporary</option>
        </select>
        <input
          name="due"
          type="number"
          value={form.due}
          onChange={handleChange}
          placeholder="Due"
          className="border p-2 w-full"
        />
        <input
          name="advance"
          type="number"
          value={form.advance}
          onChange={handleChange}
          placeholder="Advance"
          className="border p-2 w-full"
        />
        <select name="status" value={form.status} onChange={handleChange} className="border p-2 w-full">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? "Update" : "Add"} Customer
        </button>
      </form>

      <h2 className="text-xl font-bold mb-2">Customer List</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Due</th>
            <th className="border p-2">Advance</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers?.map((c) => (
            <tr key={c._id}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.address}</td>
              <td className="border p-2">{c.phone}</td>
              <td className="border p-2">{c.type}</td>
              <td className="border p-2">{c.due}</td>
              <td className="border p-2">{c.advance}</td>
              <td className="border p-2">{c.status}</td>
              <td className="border p-2 space-x-2">
                <button
                  className="bg-yellow-400 text-white px-2 py-1 rounded"
                  onClick={() => handleEdit(c)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDelete(c._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerManager;
