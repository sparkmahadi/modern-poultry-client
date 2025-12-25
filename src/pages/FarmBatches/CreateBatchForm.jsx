import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import UniversalSelector from "../../components/UniversalSelector";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialFormData = {
    farmer: "",
    farmerId: null,
    chicksQuantity: 0,
    chicksBreed: "Broiler",
    feedAssigned: 0,
    medicines: "",
    startDate: new Date().toISOString().split("T")[0],
    expectedEndDate: "",
    notes: "",
    active: true
};

const CreateBatchForm = ({ batchData = null, onSuccess, onClose }) => {
    const isEditing = !!batchData?._id;

    const [formData, setFormData] = useState(
        batchData
            ? {
                ...initialFormData,
                ...batchData,
                startDate: batchData.startDate?.split("T")[0],
                expectedEndDate: batchData.expectedEndDate?.split("T")[0] || "",
            }
            : initialFormData
    );

    const [selectedFarmer, setSelectedFarmer] = useState(
        batchData
            ? { _id: batchData.farmerId, name: batchData.farmer }
            : null
    );

    const [loading, setLoading] = useState(false);

    // UPDATED: Handle change now checks for checkboxes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Use 'checked' for checkboxes, 'number' for numbers, otherwise 'value'
        const finalValue = type === "checkbox"
            ? checked
            : type === "number"
                ? Number(value)
                : value;

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    };

    const handleSaveBatch = async (e) => {
        e.preventDefault();
        if (!selectedFarmer) {
            toast.error("Please select a farmer.");
            return;
        }

        const payload = {
            ...formData,
            farmer: selectedFarmer.name,
            farmerId: selectedFarmer._id,
        };

        try {
            console.log(payload);
            setLoading(true);
            const res = isEditing
                ? await axios.put(`${API_BASE_URL}/api/batches/${batchData._id}`, payload)
                : await axios.post(`${API_BASE_URL}/api/batches`, payload);

            toast.success(isEditing ? "Batch updated" : "Batch created");
            onSuccess && onSuccess(res.data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error saving batch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditing ? "Edit Batch" : "Create New Batch"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSaveBatch} className="p-6 space-y-4">
                    <UniversalSelector
                        label="Select Farmer"
                        placeholder="Search farmer by name..."
                        apiUrl={`${API_BASE_URL}/api/customers`}
                        selectedItem={selectedFarmer}
                        onSelect={(item) => {
                            setSelectedFarmer(item);
                            setFormData((p) => ({ ...p, farmer: item.name, farmerId: item._id }));
                        }}
                        displayKey="name"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Chicks Quantity</label>
                            <input type="number" name="chicksQuantity" value={formData.chicksQuantity} onChange={handleChange} min={1} className="w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Chicks Breed</label>
                            <select name="chicksBreed" value={formData.chicksBreed} onChange={handleChange} className="w-full border rounded-md p-2">
                                <option value="Broiler">Broiler</option>
                                <option value="Layer">Layer</option>
                                <option value="Breeder">Breeder</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Expected End Date</label>
                            <input type="date" name="expectedEndDate" value={formData.expectedEndDate} onChange={handleChange} className="w-full border rounded-md p-2" />
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                            <input
                                type="checkbox"
                                id="activeStatus"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="activeStatus" className="text-sm font-medium text-gray-700">
                                Batch is currently active
                            </label>
                        </div>
                    </div>

                    <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} className="w-full border rounded-md p-2" placeholder="Notes..." />

                    <div className="flex space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                            {loading ? "Saving..." : isEditing ? "Update" : "Save Batch"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBatchForm;