import { useNavigate } from "react-router";

const CustomerFormModal = ({
  isOpen,
  onClose,
  form,
  editingId,
  isLoading,
  error,
  handleChange,
  handleSubmit,
  resetForm
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    // Modal Overlay
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center justify-between">
            <span>{editingId ? "✏️ Edit Customer" : "➕ Add New Customer"}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </h2>
          <hr className="mb-4" />

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm" role="alert">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <InputField
                label="Current Due (৳)"
                name="due"
                type="number"
                value={form.due}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
              <InputField
                label="Current Advance (৳)"
                name="advance"
                type="number"
                value={form.advance}
                onChange={handleChange}
                placeholder="0"
                min="0"
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

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition duration-150 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : editingId ? "Update Customer" : "Add Customer"}
              </button>
              <button
                type="button"
                onClick={resetForm} // This will also close the modal implicitly via the prop passed from parent
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
                disabled={isLoading}
              >
                {editingId ? 'Cancel Edit' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;


// =========================================================================
// Helper Components (Keeping these outside for clarity and reusability)
// =========================================================================

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