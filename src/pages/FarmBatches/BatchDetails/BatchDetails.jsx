// BatchDetailsCard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router';
import SellToBatchMemoForm from './SellToBatchMemoForm';
import BatchSalesHistory from './BatchSalesHistory';

// Configuration (Replace with your actual configuration method)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Utility to fetch headers (assuming token storage is handled elsewhere)
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Define the fields structure for display/edit
const initialBatchState = {
    _id: null,
    farmer: '',
    farmerId: '', // Added farmerId for potential API use
    chicksQuantity: 0,
    chicksBreed: 'Broiler',
    feedAssigned: 0,
    medicines: '',
    startDate: '',
    expectedEndDate: '',
    notes: '',
};

/**
 * A component to display and edit a single production batch's details.
 * @param {object} props
 * @param {string} props.batchId - The ID of the batch to display/edit.
 */
const BatchDetails = () => {
    const {batchId} = useParams();
    const [batchData, setBatchData] = useState(initialBatchState);
    const [formData, setFormData] = useState(initialBatchState);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showSaleMemo, setShowSaleMemo] = useState(false);
    const [showSalesToBatch, setShowSalesToBatch] = useState(false);

    // --- Data Fetching ---
    const fetchBatchData = useCallback(async () => {
        setLoading(true);
        try {
            // ASSUMPTION: API endpoint to get a single batch by ID
            const url = `${API_BASE_URL}/api/batches/${batchId}`;
            const response = await axios.get(url, { headers: getAuthHeaders() });
console.log(response);
            if (response?.data?.success && response?.data?.batch) {
                const fetchedData = response?.data?.batch;
                // Format dates for input[type="date"]
                fetchedData.startDate = fetchedData.startDate?.split('T')[0] || '';
                fetchedData.expectedEndDate = fetchedData.expectedEndDate?.split('T')[0] || '';
                
                setBatchData(fetchedData);
                setFormData(fetchedData); // Initialize form data with fetched data
            } else {
                toast.error("Batch not found or failed to load data.");
            }
        } catch (error) {
            console.error("Error fetching batch data:", error);
            toast.error("Failed to load batch details.");
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    useEffect(() => {
        if (batchId) {
            fetchBatchData();
        }
    }, [batchId, fetchBatchData]);


    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Data Fetching Effect
    useEffect(() => {
        if (batchData.farmerId) {
            fetchCustomerDetails();
        } else {
            setError("Customer ID not provided.");
            setIsLoading(false);
        }
    }, [batchData.farmerId]);

    const fetchCustomerDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers/${batchData.farmerId}`);
            console.log("customerdata",res.data);
            setCustomer(res.data.data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch customer details. Does the ID exist?");
            setCustomer(null);
        } finally {
            setIsLoading(false);
        }
    };


    // --- Form Handlers ---

    const handleChange = useCallback((e) => {
        const { name, value, type } = e.target;
        const finalValue = (type === 'number') ? Number(value) : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    }, []);

    const handleEditToggle = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        // Revert formData back to the last saved batchData
        setFormData(batchData);
        setIsEditing(false);
    };

    const handleUpdate = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.farmer || !formData.chicksQuantity || !formData.startDate) {
            toast.error("Farmer, Chicks Quantity, and Start Date are required.");
            return;
        }

        setSubmitting(true);
        
        try {
            // Use PUT request for updating
            const url = `${API_BASE_URL}/api/batches/${batchId}`;
            const response = await axios.put(url, formData, { headers: getAuthHeaders() });

            if (response.data.success) {
                toast.success("Batch updated successfully!");
                // Update the permanent batchData state with the new data
                fetchBatchData(batchId);
                setIsEditing(false); // Switch back to view mode
            } else {
                toast.error(response.data.message || "Failed to update batch.");
            }
        } catch (error) {
            console.error("Batch update error:", error);
            toast.error(`An error occurred: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [formData, batchId]);


    // --- Rendering Logic ---

    if (loading) {
        return <div className="p-6 text-center text-blue-600">Loading batch details...</div>;
    }
    
    if (!batchData._id) {
        return <div className="p-6 text-center text-red-600">No batch selected or batch ID invalid.</div>;
    }

    // --- VIEW MODE ---
    const ViewDetails = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <DetailItem label="Batch ID" value={batchData._id.$oid || batchData._id} />
            <DetailItem label="Farmer/Customer ID" value={batchData.farmerId} />
            <DetailItem label="Farmer" value={batchData.farmer} />
            <DetailItem label="Chicks Quantity" value={batchData.chicksQuantity} />
            <DetailItem label="Chicks Breed" value={batchData.chicksBreed} />
            <DetailItem label="Feed Assigned (kg)" value={batchData.feedAssigned} />
            <DetailItem label="Start Date" value={batchData.startDate} />
            <DetailItem label="Batch Status" value={batchData.active} />
            <DetailItem label="Expected End Date" value={batchData.expectedEndDate || 'N/A'} />
            <DetailItem label="Medicines" value={batchData.medicines || 'None'} fullWidth />
            <DetailItem label="Notes" value={batchData.notes || 'None'} fullWidth />
        </div>
    );
    
    // Simple helper component for consistent display
    const DetailItem = ({ label, value, fullWidth = false }) => (
        <div className={`${fullWidth ? 'md:col-span-2' : ''}`}>
            <p className="font-medium text-gray-500">{label}:</p>
            <p className="text-gray-800 font-semibold">{value}</p>
        </div>
    );

    // --- EDIT MODE ---
    const EditForm = () => (
        <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Farmer Selection (Dropdown) */}
                <div>
                    <p className="block text-sm font-medium text-gray-700">Farmer <span className="text-red-500">*</span></p>
                    <p
                        value={batchData.farmer}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                    </p>
                </div>

                {/* Chicks Quantity */}
                <div>
                    <label htmlFor="chicksQuantity" className="block text-sm font-medium text-gray-700">Chicks Quantity <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        id="chicksQuantity"
                        name="chicksQuantity"
                        value={formData.chicksQuantity}
                        onChange={handleChange}
                        required
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    />
                </div>

                {/* Chicks Breed */}
                <div>
                    <label htmlFor="chicksBreed" className="block text-sm font-medium text-gray-700">Chicks Breed/Type</label>
                    <select
                        id="chicksBreed"
                        name="chicksBreed"
                        value={formData.chicksBreed}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    >
                        <option value="Broiler">Broiler</option>
                        <option value="Layer">Layer</option>
                    </select>
                </div>

                {/* Feed Assigned */}
                <div>
                    <label htmlFor="feedAssigned" className="block text-sm font-medium text-gray-700">Feed Assigned (kg)</label>
                    <input
                        type="number"
                        id="feedAssigned"
                        name="feedAssigned"
                        value={formData.feedAssigned}
                        onChange={handleChange}
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    />
                </div>

                {/* Expected End Date */}
                <div>
                    <label htmlFor="expectedEndDate" className="block text-sm font-medium text-gray-700">Expected End Date</label>
                    <input
                        type="date"
                        id="expectedEndDate"
                        name="expectedEndDate"
                        value={formData.expectedEndDate}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    />
                </div>

                {/* Medicines Assigned (Full width) */}
                <div className="md:col-span-2">
                    <label htmlFor="medicines" className="block text-sm font-medium text-gray-700">Medicines Assigned</label>
                    <textarea
                        id="medicines"
                        name="medicines"
                        rows="2"
                        value={formData.medicines}
                        onChange={handleChange}
                        placeholder="e.g., Antibiotic X: 50ml, Vitamin Z: 100g"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    />
                </div>

                {/* Notes (Full width) */}
                <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={submitting}
                    />
                </div>
            </div>
            
            {/* Action Buttons for Edit Mode */}
            <div className="mt-6 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className={`py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white shadow-md transition-colors duration-150
                        ${submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={submitting}
                >
                    {submitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    // --- Main Component Output ---
    return (
        <div className="p-6 bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Batch Details: {batchData.farmer}</h2>
                {!isEditing ? (
                    <button
                        onClick={handleEditToggle}
                        className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                        Edit Details
                    </button>
                ) : (
                    <span className="text-sm text-gray-500">Editing Mode</span>
                )}

                <button
                        onClick={()=>setShowSaleMemo(!showSaleMemo)}
                        className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                        Sell Products
                    </button>
            </div>

            {isEditing ? <EditForm /> : <ViewDetails />}

            {showSaleMemo && <SellToBatchMemoForm batchData={batchData} selectedCustomer={customer}/>}
            {/* {showSalesToBatch &&  />} */}
            <BatchSalesHistory batchId={batchId}/>
        </div>
    );
};

export default BatchDetails;