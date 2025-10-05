import React from 'react';

// Reusable styled input component
export const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
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

// Reusable styled select component
export const SelectField = ({ label, name, value, onChange, options, className = "" }) => (
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