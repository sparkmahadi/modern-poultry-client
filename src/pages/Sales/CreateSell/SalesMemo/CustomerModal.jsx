// CustomerModal.jsx
import React, { useState } from "react";
import axios from "axios";

const inputClass =
  "border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-150 ease-in-out";

const CustomerModal = ({ t, onClose, onCustomerAdded }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t.saveAlertName);
      return;
    }

    setIsLoading(true);

    const newCustomer = { name: name.trim(), address: address.trim(), phone: phone.trim() };

    // Placeholder: Replace with your actual customer creation endpoint
    axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/customers/add`, newCustomer)
      .then((res) => {
        setIsLoading(false);
        // Assuming the API returns the newly created customer object (e.g., with an _id)
        const addedCustomer = res?.data?.data || { ...newCustomer, _id: Date.now().toString() };
        
        // Pass the new customer back to the parent component
        onCustomerAdded(addedCustomer);
        onClose();
        alert(t.customerAddedSuccess);
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error adding customer:", error);
        alert(t.customerAddError);
      });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-600">👤 {t.addCustomerTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1 text-gray-700">{t.name} <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.name}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1 text-gray-700">{t.phone}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1 text-gray-700">{t.address}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.address}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold transition-colors disabled:opacity-50"
          >
            {isLoading ? t.saving : t.addCustomerButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;