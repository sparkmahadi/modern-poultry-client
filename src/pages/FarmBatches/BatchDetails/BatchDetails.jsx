// BatchDetailsCard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router';
import {
    Layers,
    User,
    Calendar,
    Phone,
    MapPin,
    ArrowLeft,
    Edit3,
    Save,
    X,
    ShoppingCart,
    CheckCircle2,
    Clock,
    FileText,
    Activity,
    Plus,
    Scale,
    TrendingUp
} from 'lucide-react';
import SellToBatchMemoForm from './SellToBatchMemoForm';
import BatchSalesHistory from './BatchSalesHistory';
import BuyBirdsModal from '../BuyBirdsModal';
import SellHarvestedBirdsModal from '../SellHarvestedBirdsModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const initialBatchState = {
    _id: null,
    farmer: '',
    farmerId: '',
    chicksQuantity: 0,
    chicksBreed: 'Broiler',
    feedAssigned: 0,
    medicines: '',
    startDate: '',
    expectedEndDate: '',
    notes: '',
    active: true
};

const BatchDetails = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();

    const [batchData, setBatchData] = useState(initialBatchState);
    const [formData, setFormData] = useState(initialBatchState);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showSaleMemo, setShowSaleMemo] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [customerLoading, setCustomerLoading] = useState(false);

    // Two-Stage Harvest States
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [harvestSummary, setHarvestSummary] = useState(null);

    // --- 1. Fetch Harvest Summary (with Auth Headers & Safe State) ---
    const fetchHarvestSummary = useCallback(async () => {
        if (!batchId) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/batches/${batchId}/harvest-summary`, {
                headers: getAuthHeaders()
            });
            if (res.data?.success && (res.data.harvested || res.data.data)) {
                setHarvestSummary(res.data.data);
            } else {
                setHarvestSummary(null);
            }
        } catch (err) {
            console.error("Harvest summary fetch error:", err);
            setHarvestSummary(null);
        }
    }, [batchId]);

    useEffect(() => {
        fetchHarvestSummary();
    }, [fetchHarvestSummary]);

    // --- 2. Fetch Batch Details ---
    const fetchBatchData = useCallback(async () => {
        if (!batchId) return;
        setLoading(true);
        try {
            const url = `${API_BASE_URL}/api/batches/${batchId}`;
            const response = await axios.get(url, { headers: getAuthHeaders() });

            if (response?.data?.success && (response?.data?.batch || response?.data?.data)) {
                const fetchedData = response?.data?.batch || response?.data?.data;

                // Format dates safely for HTML date inputs
                const formatted = {
                    ...fetchedData,
                    startDate: fetchedData.startDate ? fetchedData.startDate.split('T')[0] : '',
                    expectedEndDate: fetchedData.expectedEndDate ? fetchedData.expectedEndDate.split('T')[0] : '',
                    active: fetchedData.active !== undefined ? Boolean(fetchedData.active) : true
                };

                setBatchData(formatted);
                setFormData(formatted);
            } else {
                toast.error('Batch not found or failed to load data.');
            }
        } catch (error) {
            console.error('Error fetching batch data:', error);
            toast.error('Failed to load batch details.');
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    useEffect(() => {
        fetchBatchData();
    }, [fetchBatchData]);

    // --- 3. Fetch Associated Customer / Farmer ---
    const fetchCustomerDetails = useCallback(async (farmerId) => {
        if (!farmerId) return;
        setCustomerLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/customers/${farmerId}`, {
                headers: getAuthHeaders()
            });
            setCustomer(res.data?.data || null);
        } catch (err) {
            console.error('Customer fetch error:', err);
            setCustomer(null);
        } finally {
            setCustomerLoading(false);
        }
    }, []);

    useEffect(() => {
        if (batchData.farmerId) {
            fetchCustomerDetails(batchData.farmerId);
        }
    }, [batchData.farmerId, fetchCustomerDetails]);

    // --- 4. Form Handling ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox'
            ? checked
            : type === 'number'
                ? Number(value)
                : value;

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    };

    const handleCancelEdit = () => {
        setFormData(batchData);
        setIsEditing(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.farmer || !formData.chicksQuantity || !formData.startDate) {
            toast.error('Farmer, Chicks Quantity, and Start Date are required.');
            return;
        }

        setSubmitting(true);
        try {
            const url = `${API_BASE_URL}/api/batches/${batchId}`;
            const response = await axios.put(url, formData, { headers: getAuthHeaders() });

            if (response.data?.success) {
                toast.success('Batch updated successfully!');
                await fetchBatchData();
                setIsEditing(false);
            } else {
                toast.error(response.data?.message || 'Failed to update batch.');
            }
        } catch (error) {
            console.error('Batch update error:', error);
            toast.error(error.response?.data?.message || 'Failed to save changes.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-sans">
                <div className="p-8 text-center animate-pulse text-blue-600 font-bold flex items-center gap-3">
                    <Layers className="w-6 h-6 animate-spin" /> Synchronizing Batch Details...
                </div>
            </div>
        );
    }

    if (!batchData._id) {
        return (
            <div className="p-8 max-w-xl mx-auto text-center font-sans">
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
                    <p className="font-bold text-lg">Batch Not Found</p>
                    <p className="text-sm mt-1">The requested batch ID does not exist or has been removed.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans text-slate-700 min-h-screen space-y-6">
            {/* Top Slate Toolbar */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white"
                        title="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-3 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                {batchData.chicksBreed || 'Batch'} - {batchData.farmer}
                            </h1>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                                    batchData.active
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                                }`}
                            >
                                {batchData.status || (batchData.active ? 'Active Batch' : 'Closed / Completed')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">ID: {batchData._id?.$oid || batchData._id}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {!isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
                            >
                                <Edit3 className="w-3.5 h-3.5" /> Edit Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSaleMemo((prev) => !prev)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                    showSaleMemo
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                }`}
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                {showSaleMemo ? 'Close Memo Form' : 'Direct Billing'}
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    navigate('/sales/create-sale', {
                                        state: { batchId: batchData._id, customerId: batchData.farmerId }
                                    })
                                }
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                                title="Open in Main Sales Invoice"
                            >
                                <Plus className="w-3.5 h-3.5" /> Full Invoice Screen
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <X className="w-3.5 h-3.5" /> Cancel Editing
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Metrics & Farmer Profile Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Farmer / Customer Info Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                            <User className="w-4 h-4 text-blue-600" /> Assigned Farmer Profile
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{batchData.farmer || 'Unnamed Farmer'}</h3>

                        {customer ? (
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                <p className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{customer.phone || 'No phone recorded'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{customer.address || 'No address specified'}</span>
                                </p>
                            </div>
                        ) : customerLoading ? (
                            <p className="text-xs text-slate-400 animate-pulse mt-2">Loading customer profile...</p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">Farmer ID: {batchData.farmerId || 'N/A'}</p>
                        )}
                    </div>

                    {customer && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Customer Due Balance:</span>
                            <span
                                className={`font-bold font-mono ${
                                    (customer.due || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                            >
                                ৳{(customer.due || 0).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-amber-50/50 border border-amber-200/70 p-4 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Chicks Quantity</span>
                        <div className="mt-2">
                            <span className="text-2xl font-black font-mono text-slate-900">{batchData.chicksQuantity}</span>
                            <span className="text-xs text-amber-600 block mt-0.5">{batchData.chicksBreed} breed</span>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200/70 p-4 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Feed Assigned</span>
                        <div className="mt-2">
                            <span className="text-2xl font-black font-mono text-slate-900">{batchData.feedAssigned || 0}</span>
                            <span className="text-xs text-blue-600 block mt-0.5">Kilograms</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</span>
                        <div className="mt-2 space-y-1 text-xs text-slate-700">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Start: <strong>{batchData.startDate || 'N/A'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>End: <strong>{batchData.expectedEndDate || 'Open'}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Details or Edit Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                {!isEditing ? (
                    <div>
                        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <h2 className="text-base font-bold text-slate-900">Batch Specifications & Medical Log</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Medicines / Vaccines</span>
                                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs whitespace-pre-wrap">
                                    {batchData.medicines || 'No medicines logged.'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Operational Notes</span>
                                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs whitespace-pre-wrap">
                                    {batchData.notes || 'No notes added for this batch.'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-blue-600" /> Edit Batch Specifications
                            </h2>
                            <span className="text-xs font-semibold text-slate-400">Save changes below to update live database</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Farmer Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="farmer"
                                    value={formData.farmer}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Chicks Quantity <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="chicksQuantity"
                                    min="1"
                                    value={formData.chicksQuantity}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Breed / Strain
                                </label>
                                <select
                                    name="chicksBreed"
                                    value={formData.chicksBreed}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="Broiler">Broiler</option>
                                    <option value="Layer">Layer</option>
                                    <option value="Breeder">Breeder</option>
                                    <option value="Sonali">Sonali</option>
                                    <option value="Country Chicken">Country Chicken</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Feed Assigned (kg)
                                </label>
                                <input
                                    type="number"
                                    name="feedAssigned"
                                    min="0"
                                    step="any"
                                    value={formData.feedAssigned}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Start Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Expected End Date
                                </label>
                                <input
                                    type="date"
                                    name="expectedEndDate"
                                    value={formData.expectedEndDate}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Medicines / Vaccines
                                </label>
                                <textarea
                                    name="medicines"
                                    rows="2"
                                    value={formData.medicines}
                                    onChange={handleChange}
                                    placeholder="e.g., Vitamin AD3E, Antibiotics, Vaccine schedule..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Notes / Remarks
                                </label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Add batch observation notes..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="batchActiveCheckbox"
                                    name="active"
                                    checked={Boolean(formData.active)}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <label htmlFor="batchActiveCheckbox" className="text-xs font-bold text-slate-800 select-none cursor-pointer">
                                    Batch is currently Active in production
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={submitting}
                                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {submitting ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Inline Sales Memo Form */}
            {showSaleMemo && (
                <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-100">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-blue-600" /> Direct Batch Billing
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowSaleMemo(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <SellToBatchMemoForm
                        batchData={batchData}
                        selectedCustomer={customer}
                        onClose={() => setShowSaleMemo(false)}
                        onSaleSuccess={() => {
                            fetchBatchData();
                            fetchHarvestSummary();
                            setShowSaleMemo(false);
                        }}
                    />
                </div>
            )}

            {/* Two-Stage Harvest Dashboard Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">Live Bird Harvest & Distribution</h2>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    harvestSummary?.isCompleted
                                        ? "bg-slate-100 text-slate-600"
                                        : harvestSummary
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                            >
                                {harvestSummary?.isCompleted
                                    ? "Fully Sold Out"
                                    : harvestSummary
                                        ? "Stage 2: Distributing to Dealers"
                                        : "Stage 1: Awaiting Bird Harvest"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Buy birds from farmer to stock in inventory, then dispatch to wholesale dealers over several days
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!harvestSummary ? (
                            <button
                                type="button"
                                onClick={() => setIsBuyModalOpen(true)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                            >
                                <Scale className="w-4 h-4" /> Stage 1: Buy Birds from Farmer
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsSellModalOpen(true)}
                                disabled={Number(harvestSummary?.remainingWeight || 0) <= 0}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                            >
                                <TrendingUp className="w-4 h-4" /> Stage 2: Sell to Dealer
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar & Real-time Metrics when Harvested */}
                {harvestSummary && (
                    <div className="mt-5 space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                                <span>
                                    Distribution Progress: {Number(harvestSummary?.totalWeightSold || 0).toLocaleString()} /{" "}
                                    {Number(harvestSummary?.totalWeightHarvested || 0).toLocaleString()} KG ({harvestSummary?.percentSold || 0}%)
                                </span>
                                <span className={Number(harvestSummary?.remainingWeight || 0) > 0 ? "text-amber-600" : "text-emerald-600"}>
                                    Remaining in Inventory: {Number(harvestSummary?.remainingWeight || 0).toLocaleString()} KG
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(0, harvestSummary?.percentSold || 0))}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Buy Cost</span>
                                <span className="text-base font-bold font-mono text-slate-800">
                                    ৳{Number(harvestSummary?.totalPurchaseCost || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                    @ ৳{harvestSummary?.harvestDetails?.purchaseRatePerKg || 0}/kg
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Revenue</span>
                                <span className="text-base font-bold font-mono text-slate-900">
                                    ৳{Number(harvestSummary?.totalRevenue || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                    {harvestSummary?.distributionMemos?.length || 0} Dealer Invoices
                                </span>
                            </div>

                            <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Gross Profit</span>
                                <span className="text-base font-bold font-mono text-emerald-700">
                                    ৳{Number(harvestSummary?.grossProfit || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-emerald-600 block">Trade Commission</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg Dealer Rate</span>
                                <span className="text-base font-bold font-mono text-slate-800">
                                    ৳
                                    {Number(harvestSummary?.totalWeightSold || 0) > 0
                                        ? (Number(harvestSummary.totalRevenue) / Number(harvestSummary.totalWeightSold)).toFixed(2)
                                        : "0.00"}
                                    /kg
                                </span>
                                <span className="text-[10px] text-slate-500 block">Realized price</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sales Invoices Associated With This Batch */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <BatchSalesHistory batchId={batchId} onHistoryChange={fetchHarvestSummary} />
            </div>

            {/* Modals */}
            <BuyBirdsModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                batchData={batchData}
                farmerData={customer}
                onSuccess={() => {
                    fetchBatchData();
                    fetchHarvestSummary();
                }}
            />

            <SellHarvestedBirdsModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                batchData={batchData}
                harvestSummary={harvestSummary}
                onSuccess={() => {
                    fetchBatchData();
                    fetchHarvestSummary();
                }}
            />
        </div>
    );
};

export default BatchDetails;