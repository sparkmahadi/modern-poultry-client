import React, { useState, useCallback, useEffect } from "react";
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
};

const CreateBatchForm = ({ batchData = null, onSuccess }) => {
    const isEditing = !!batchData?._id;

    const [formData, setFormData] = useState(
        batchData
            ? {
                ...initialFormData,
                ...batchData,
                startDate: batchData.startDate?.split("T")[0],
                expectedEndDate:
                    batchData.expectedEndDate?.split("T")[0] || "",
            }
            : initialFormData
    );

    const [selectedFarmer, setSelectedFarmer] = useState(
        batchData
            ? { _id: batchData.farmerId, name: batchData.farmer }
            : null
    );

    const [loading, setLoading] = useState(false);

    // FORM HANDLER
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const finalValue = type === "number" ? Number(value) : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    };

    // HANDLE SAVE
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
            setLoading(true);
            const res = isEditing
                ? await axios.put(
                    `${API_BASE_URL}/api/batches/${batchData._id}`,
                    payload
                )
                : await axios.post(`${API_BASE_URL}/api/batches`, payload);

            toast.success(isEditing ? "Batch updated" : "Batch created");

            onSuccess && onSuccess(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Error");
        }
        setLoading(false);
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Edit Batch" : "Create New Batch"}
            </h2>

            <form onSubmit={handleSaveBatch} className="space-y-6">

                {/* 🔍 UNIVERSAL SEARCH SELECTOR FOR FARMERS */}
                <UniversalSelector
                    label="Select Farmer"
                    placeholder="Search farmer by name..."
                    apiUrl={`${API_BASE_URL}/api/customers`}
                    selectedItem={selectedFarmer}
                    onSelect={(item) => {
                        setSelectedFarmer(item);
                        setFormData((p) => ({
                            ...p,
                            farmer: item.name,
                            farmerId: item._id,
                        }));
                    }}
                    displayKey="name"
                />

                {selectedFarmer && (
                    <div className="p-4 rounded-lg bg-gray-50 border shadow-sm">
                        <h3 className="text-md font-semibold mb-2">Customer Details</h3>

                        <div className="space-y-1 text-sm">
                            <p><strong>Name:</strong> {selectedFarmer.name}</p>
                            {selectedFarmer.phone && (
                                <p><strong>Phone:</strong> {selectedFarmer.phone}</p>
                            )}
                            {selectedFarmer.address && (
                                <p><strong>Address:</strong> {selectedFarmer.address}</p>
                            )}
                            {selectedFarmer.customerType && (
                                <p><strong>Type:</strong> {selectedFarmer.customerType}</p>
                            )}
                            {selectedFarmer.totalDue !== undefined && (
                                <p className="text-red-600 font-semibold">
                                    <strong>Total Due:</strong> {selectedFarmer.totalDue} ৳
                                </p>
                            )}
                        </div>
                    </div>
                )}


                {/*  Chicks Quantity */}
                <div>
                    <label className="text-sm font-medium">Chicks Quantity</label>
                    <input
                        type="number"
                        name="chicksQuantity"
                        value={formData.chicksQuantity}
                        onChange={handleChange}
                        min={1}
                        className="w-full border rounded-md p-2"
                    />
                </div>

                {/* Breed */}
                <div>
                    <label className="text-sm font-medium">Chicks Breed</label>
                    <select
                        name="chicksBreed"
                        value={formData.chicksBreed}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    >
                        <option value="Broiler">Broiler</option>
                        <option value="Layer">Layer</option>
                        <option value="Breeder">Breeder</option>
                    </select>
                </div>

                {/* Dates */}
                <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">
                        Expected End Date
                    </label>
                    <input
                        type="date"
                        name="expectedEndDate"
                        value={formData.expectedEndDate}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                </div>

                {/* Notes */}
                <textarea
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                    placeholder="Notes..."
                />

                {/* Submit */}
                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg"
                    disabled={loading}
                >
                    {loading ? "Saving..." : isEditing ? "Update" : "Save Batch"}
                </button>
            </form>
        </div>
    );
};

export default CreateBatchForm;
