import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search, UserPlus, X, Store, Truck, User } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CUSTOMER_TYPES = [
  { value: "permanent", label: "Permanent Farmer", icon: User },
  { value: "distributor", label: "Wholesale Distributor", icon: Truck },
  { value: "sales_center", label: "Retail / Sales Center", icon: Store },
  { value: "temporary", label: "Temporary Retail Buyer", icon: User },
];

const CustomerFormModal = ({
  isOpen,
  onClose,
  form,
  editingId,
  isLoading,
  error,
  handleChange,
  handleSubmit,
  resetForm,
  onCustomerSelected, // Callback if an existing customer is selected from search
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for checking existing parties
  useEffect(() => {
    const delay = setTimeout(async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/customers/search?q=${encodeURIComponent(q)}`
        );
        setSearchResults(res.data?.data || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                {editingId ? "Edit Account Profile" : "Register Distributor / Customer"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add chicken distributors, wholesale dealer hubs, or contract farmers
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search for Existing Records (Only in Add mode) */}
          {!editingId && (
            <div className="mt-4 relative" ref={searchContainerRef}>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Verify / Select Existing Account First
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search by name, dealer center, or phone..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
                {searchLoading && (
                  <span className="absolute right-3 top-2.5 text-[11px] text-blue-600 font-bold animate-pulse">
                    Searching...
                  </span>
                )}
              </div>

              {showResults && searchResults.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {searchResults.map((c) => (
                    <li
                      key={c._id}
                      onClick={() => {
                        if (typeof onCustomerSelected === "function") {
                          onCustomerSelected(c);
                          onClose();
                        }
                      }}
                      className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {c.name}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {c.phone || "No phone"} • {c.address || "No address"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {c.type || "permanent"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 my-3 text-xs rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <InputField
              label="Account / Business Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Al-Madina Chicken Center, Rahim Distributor"
              required
            />

            {/* Customer Classification Pills / Select */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Account Classification
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {CUSTOMER_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      handleChange({ target: { name: "type", value } })
                    }
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                      form.type === value
                        ? "bg-blue-50/80 border-blue-500 text-blue-900 font-bold"
                        : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Contact Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="017xxxxxxxx"
              />
              <SelectField
                label="Operating Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>

            <InputField
              label="Sales Center Address / Location"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Pahartali Wholesale Market, Shed 4"
            />

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <InputField
                label="Opening Balance Due (৳)"
                name="manual_due"
                type="number"
                value={form.manual_due || ""}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
              />
              <InputField
                label="Opening Advance (৳)"
                name="manual_advance"
                type="number"
                value={form.manual_advance || ""}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition"
                disabled={isLoading}
              >
                {editingId ? "Cancel Edit" : "Cancel"}
              </button>
              <button
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving Record..."
                  : editingId
                  ? "Update Account"
                  : "Save Customer / Dealer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;

export const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  className = "",
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
      required={required}
    />
  </div>
);

export const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  className = "",
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value ?? ""}
      onChange={onChange}
      className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);