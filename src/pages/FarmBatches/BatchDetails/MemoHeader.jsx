// MemoHeader.jsx - UPDATED
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar } from "lucide-react";



const inputClass =
  "border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-150 ease-in-out print:border-none print:bg-white";

const MemoHeader = ({
  t,
  lang,
  setLang,
  memoNo,
  setMemoNo,
  dateTime,
  setDateTime,
  selectedCustomer, // New prop
  setSelectedCustomer // New prop
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);



  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;
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


  // Modified to close the modal as well
  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setIsModalOpen(false); // Close the modal
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
    } catch (err) {
      console.error(err);
      // Ensure numerical fields are not empty strings before sending
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(`Failed to ${editingId ? 'update' : 'add'} customer.`);
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>

      {/* Header - Modern Look (same as before) */}
      <div className="bg-blue-600 text-white p-6 flex flex-col md:flex-row items-center justify-between print-header">
        {/* Shop Info */}
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-3xl font-extrabold tracking-tight">{t.headerTitle}</h1>
          <h2 className="text-xl font-semibold mt-1">{t.shopLine1}</h2>
          <p className="text-sm opacity-90 mt-1">{t.shopLine2}</p>
        </div>

        {/* Controls: Toggle, Memo No, Date */}
        <div className="text-right space-y-3">
          <button
            onClick={() => setLang((s) => (s === "en" ? "bn" : "en"))}
            className="no-print bg-blue-500 text-white text-sm px-4 py-1 rounded-full shadow hover:bg-blue-400 transition-colors"
            title="Toggle language"
          >
            {lang === "en" ? "বাংলা 🇧🇩" : "ENGLISH 🇺🇸"}
          </button>

          <div className="grid grid-cols-2 gap-4 text-sm bg-white text-gray-800 p-3 rounded-lg shadow-inner">
            <div className="font-medium">{t.memoNo}</div>
            <input
              value={memoNo}
              onChange={(e) => setMemoNo(e.target.value)}
              placeholder="001/2024"
              className="p-1 border-b text-right font-bold focus:outline-none"
            />

            {/* <div className="font-medium">{t.date}</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-1 border-b text-right focus:outline-none"
            /> */}

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded border border-slate-200">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="bg-transparent text-base font-medium text-slate-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info (Search/Select) */}
      <div className="p-6 border-b bg-gray-50 relative">
        <label className="text-sm font-semibold block mb-1 text-gray-700">
          {t.name} <span className="text-red-500">*</span>
        </label>

        <div className="flex gap-3 items-start">
          {/* Customer Search Field */}
          <div className="flex-1 relative">
            <p
            >{selectedCustomer?.name} </p>
          </div>
            <p>previous due</p>
            <p>total purchase</p>
        </div>

        {/* Display selected customer details (read-only for print) */}
        {selectedCustomer && (
          <div className="mt-3 p-3 bg-white border rounded-lg print-info-grid">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500">{t.phone}:</span>
              <span className="font-semibold">{selectedCustomer.phone || t.notAvailable}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500">{t.address}:</span>
              <span className="font-semibold">{selectedCustomer.address || t.notAvailable}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MemoHeader;