import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreatePaymentAccount = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: "",
    name: "",
    bank_name: "",
    account_number: "",
    routing_number: "",
    branch_name: "",
    method: "bkash",
    number: "",
    owner_name: "",
    is_default: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ----------------------------------------------------
  // SUBMIT HANDLER (100% BACKEND ALIGNED)
  // ----------------------------------------------------
  const handleSubmit = async () => {
    const payload = {
      type: form.type,
      is_default: form.is_default,
    };

    // -------- CASH --------
    if (form.type === "cash") {
      if (!form.name) return toast.error("Cash account name is required");
      payload.name = form.name;
    }

    // -------- BANK --------
    else if (form.type === "bank") {
      if (!form.bank_name || !form.account_number)
        return toast.error("Bank name & account number are required");

      payload.bank_name = form.bank_name;
      payload.account_number = form.account_number;
      payload.routing_number = form.routing_number || "";
      payload.branch_name = form.branch_name || "";
    }

    // -------- MOBILE --------
    else if (form.type === "mobile") {
      if (!form.number || !form.owner_name)
        return toast.error("Mobile number & owner name are required");

      payload.method = form.method || "bkash";
      payload.number = form.number;
      payload.owner_name = form.owner_name;
    }

    else {
      return toast.error("Please select account type");
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/payment_accounts`, payload);
      toast.success("Account created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-6 relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create Payment Account</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Account Type */}
        <div className="mb-3">
          <label className="block text-sm font-medium">Account Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Select type</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        {/* CASH */}
        {form.type === "cash" && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Cash Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Shop Cash"
            />
          </div>
        )}

        {/* BANK */}
        {form.type === "bank" && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium">Bank Name</label>
              <input
                name="bank_name"
                value={form.bank_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Account Number</label>
              <input
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Routing Number</label>
              <input
                name="routing_number"
                value={form.routing_number}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Branch Name</label>
              <input
                name="branch_name"
                value={form.branch_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </>
        )}

        {/* MOBILE */}
        {form.type === "mobile" && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium">Method</label>
              <select
                name="method"
                value={form.method}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Mobile Number</label>
              <input
                name="number"
                value={form.number}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Owner Name</label>
              <input
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </>
        )}

        {/* Default */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            name="is_default"
            checked={form.is_default}
            onChange={handleChange}
          />
          <span className="text-sm">Set as default</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePaymentAccount;
