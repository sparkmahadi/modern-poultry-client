// src/components/CategoryDetail.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CategoryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [categoryData, setCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiInProgress, setApiInProgress] = useState(false);

    // States for editing
    const [editingMainCategory, setEditingMainCategory] = useState(false);
    const [currentMainCategory, setCurrentMainCategory] = useState({ name: '', color: '', icon: '' }); // Added icon
    const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
    const [currentSubcategory, setCurrentSubcategory] = useState(null);

    // State for Add New Subcategory Form
    const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false);
    const [newSubcategoryData, setNewSubcategoryData] = useState({
        name: '',
        icon: 'question',
        color: '#CCCCCC',
        monthly_limit: 0,
    });


    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    // --- API Call Functions ---

    const fetchCategoryDetails = async (categoryId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/utilities/categories/${categoryId}`);
            const data = response?.data?.data;
            setCategoryData(data);
            setCurrentMainCategory({ // Initialize currentMainCategory here as well
                name: data?.name,
                color: data?.color,
                icon: data?.icon // Populate icon for main category editing
            });
            console.log(`Fetched details for category ${categoryId}:`, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch category ${categoryId} details:`, error);
            toast.error(error.response?.data?.message || `Failed to load details for ${categoryId}. Please try again.`);
            setCategoryData(null);
            navigate('/categories'); // Redirect back to the list on error
            throw error; // Re-throw to propagate for consistent error handling
        } finally {
            setLoading(false);
        }
    };

    const updateMainCategory = async (categoryId, updatedData) => {
        setApiInProgress(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/api/utilities/categories/${categoryId}`, updatedData);
            console.log('Main category updated successfully:', response.data);
            toast.success('Main category updated successfully!');
            await fetchCategoryDetails(categoryId); // Re-fetch to update state with latest data
            return { success: true };
        } catch (error) {
            console.error("Failed to update main category:", error);
            toast.error(error.response?.data?.message || "Failed to save main category. Please try again.");
            throw error;
        } finally {
            setApiInProgress(false);
        }
    };

    const updateSubcategory = async (categoryId, subId, updatedSub) => {
        setApiInProgress(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/api/utilities/categories/${categoryId}/subcategories/${subId}`, updatedSub);
            console.log('Subcategory updated successfully:', response.data);
            toast.success('Subcategory updated successfully!');
            await fetchCategoryDetails(categoryId); // Re-fetch to update state
            return { success: true };
        } catch (error) {
            console.error("Failed to update subcategory:", error);
            toast.error(error.response?.data?.message || "Failed to save subcategory. Please try again.");
            throw error;
        } finally {
            setApiInProgress(false);
        }
    };

    const addSubcategory = async (categoryId, newSub) => {
        setApiInProgress(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/utilities/categories/${categoryId}/subcategories`, newSub);
            console.log('Subcategory added successfully:', response.data);
            toast.success('Subcategory added successfully!');
            await fetchCategoryDetails(categoryId); // Re-fetch to update state
            setShowAddSubcategoryForm(false); // Hide the form on success
            setNewSubcategoryData({ name: '', icon: 'question', color: '#CCCCCC', monthly_limit: 0 }); // Reset form
            return { success: true };
        } catch (error) {
            console.error("Failed to add subcategory:", error);
            toast.error(error.response?.data?.message || "Failed to add subcategory. Please try again.");
            throw error;
        } finally {
            setApiInProgress(false);
        }
    };

    const deleteSubcategory = async (categoryId, subId) => {
        const confirm = window.confirm("Are you sure to delete this category?", subId);
        if (confirm) {
            try {
                const response = await axios.delete(`${API_BASE_URL}/api/utilities/categories/${categoryId}/subcategories/${subId}`);
                console.log('Subcategory deleted successfully:', response.data);
                toast.success('Subcategory deleted successfully!');
                await fetchCategoryDetails(categoryId); // Re-fetch to update state after deletion
                return { success: true };
            } catch (error) {
                console.error("Failed to delete subcategory:", error);
                toast.error(error.response?.data?.message || "Failed to delete subcategory. Please try again.");
                throw error;
            } finally {
                setApiInProgress(false);
            }
        } else {
            toast.info("Command Cancelled");
        }
        setApiInProgress(true);

    };

    // --- Data Fetch on Mount ---
    useEffect(() => {
        if (id) {
            fetchCategoryDetails(id);
        }
    }, [id]);

    // --- Synchronize Edit States ---
    useEffect(() => {
        if (editingMainCategory && categoryData) {
            setCurrentMainCategory({
                name: categoryData?.name,
                color: categoryData?.color,
                icon: categoryData?.icon // Ensure icon is set for editing
            });
        }
    }, [editingMainCategory, categoryData]);

    useEffect(() => {
        if (editingSubcategoryId && categoryData) {
            const sub = categoryData?.subcategories.find(s => s.id === editingSubcategoryId);
            if (sub) {
                setCurrentSubcategory({ ...sub });
            }
        } else {
            setCurrentSubcategory(null);
        }
    }, [editingSubcategoryId, categoryData?.subcategories]);

    // --- Event Handlers for Existing Functionality ---
    const handleEditMainCategory = () => setEditingMainCategory(true);
    const handleSaveMainCategory = async () => {
        if (!id) {
            toast.error("Error: Category ID not available for update.");
            return;
        }
        await updateMainCategory(id, { name: currentMainCategory.name, color: currentMainCategory.color, icon: currentMainCategory.icon }); // Pass icon
        setEditingMainCategory(false);
    };
    const handleCancelEditMainCategory = () => {
        setEditingMainCategory(false);
    };
    const handleMainCategoryChange = (e) => {
        const { name, value } = e.target;
        setCurrentMainCategory(prevState => ({ ...prevState, [name]: value }));
    };

    const handleEditSubcategory = (subId) => setEditingSubcategoryId(subId);
    const handleSaveSubcategory = async () => {
        if (currentSubcategory && id) {
            await updateSubcategory(id, currentSubcategory.id, currentSubcategory);
            setEditingSubcategoryId(null);
        } else {
            toast.error("Error: Subcategory data or Category ID missing for save.");
        }
    };
    const handleCancelEditSubcategory = () => {
        setEditingSubcategoryId(null);
        setCurrentSubcategory(null);
    };
    const handleDeleteSubcategory = async (subId) => {
        if (id) {
            await deleteSubcategory(id, subId);
        } else {
            toast.error("Error: Category ID missing for delete.");
        }
    };
    const handleSubcategoryChange = (e) => {
        const { name, value } = e.target;
        setCurrentSubcategory(prevState => ({ ...prevState, [name]: name === 'monthly_limit' ? Number(value) : value }));
    };

    // --- Handlers for Add New Subcategory Form ---
    const handleAddSubcategoryClick = () => {
        setShowAddSubcategoryForm(true);
        setNewSubcategoryData({ name: '', icon: 'question', color: '#CCCCCC', monthly_limit: 0 }); // Reset form
    };

    const handleNewSubcategoryChange = (e) => {
        const { name, value } = e.target;
        setNewSubcategoryData(prevState => ({
            ...prevState,
            [name]: name === 'monthly_limit' ? Number(value) : value
        }));
    };

    const handleNewSubcategorySubmit = async (e) => {
        e.preventDefault();
        if (!newSubcategoryData.name) {
            toast.error("Subcategory ID and Name cannot be empty.");
            return;
        }
        if (id) {
            await addSubcategory(id, newSubcategoryData);
        } else {
            toast.error("Error: Category ID is missing to add subcategory.");
        }
    };

    const handleCancelAddSubcategory = () => {
        setShowAddSubcategoryForm(false);
    };


    // --- Render Logic ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-gray-700 text-xl">
                Loading category details...
            </div>
        );
    }

    if (!categoryData) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-xl text-center">
                Error: Could not load category details. Please ensure your backend is running.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl">
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/categories')}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out mb-4"
                        disabled={apiInProgress}
                    >
                        ← Back to Categories
                    </button>
                </div>

                {/* Main Category Section */}
                <div className="border-b pb-4 mb-4 flex items-center justify-between">
                    {editingMainCategory ? (
                        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2">
                            <input
                                type="text"
                                name="name"
                                value={currentMainCategory.name}
                                onChange={handleMainCategoryChange}
                                className="p-2 border border-gray-300 rounded-md flex-grow"
                                placeholder="Category Name"
                                disabled={apiInProgress}
                            />
                            <input
                                type="text" // Changed to text to allow direct Font Awesome class input
                                name="icon"
                                value={currentMainCategory.icon}
                                onChange={handleMainCategoryChange}
                                className="p-2 border border-gray-300 rounded-md w-32"
                                placeholder="Icon (e.g., 'tag')"
                                disabled={apiInProgress}
                            />
                            <input
                                type="color"
                                name="color"
                                value={currentMainCategory.color}
                                onChange={handleMainCategoryChange}
                                className="p-1 border border-gray-300 rounded-md w-12 h-10"
                                title="Pick a color"
                                disabled={apiInProgress}
                            />
                            <div className="flex gap-2 mt-2 sm:mt-0">
                                <button
                                    onClick={handleSaveMainCategory}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                    disabled={apiInProgress}
                                >
                                    {apiInProgress ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancelEditMainCategory}
                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                    disabled={apiInProgress}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center w-full justify-between">
                            <h2 className="text-3xl font-extrabold flex items-center gap-3">
                                <i className={`fa-solid fa-${categoryData?.icon}`} style={{ color: categoryData?.color }}></i>
                                {categoryData?.name}
                            </h2>
                            <button
                                onClick={handleEditMainCategory}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                disabled={apiInProgress}
                            >
                                Edit Main
                            </button>
                        </div>
                    )}
                </div>

                {/* Subcategories Section */}
                <h3 className="text-2xl font-semibold mb-4 text-gray-700">Subcategories:</h3>

                {/* Add New Subcategory Button / Form */}
                <div className="mb-6 border-b pb-4">
                    {!showAddSubcategoryForm ? (
                        <button
                            onClick={handleAddSubcategoryClick}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out w-full"
                            disabled={apiInProgress}
                        >
                            Add New Subcategory
                        </button>
                    ) : (
                        <form onSubmit={handleNewSubcategorySubmit} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                            <h3 className="text-xl font-semibold mb-2">New Subcategory Details</h3>
                            <div>
                                <label htmlFor="newSubcategoryName" className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    id="newSubcategoryName"
                                    name="name"
                                    value={newSubcategoryData.name}
                                    onChange={handleNewSubcategoryChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={apiInProgress}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="newSubcategoryIcon" className="block text-sm font-medium text-gray-700">Icon (Font Awesome)</label>
                                    <input
                                        type="text"
                                        id="newSubcategoryIcon"
                                        name="icon"
                                        value={newSubcategoryData.icon}
                                        onChange={handleNewSubcategoryChange}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                        placeholder="e.g., 'utensils'"
                                        disabled={apiInProgress}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newSubcategoryColor" className="block text-sm font-medium text-gray-700">Color</label>
                                    <input
                                        type="color"
                                        id="newSubcategoryColor"
                                        name="color"
                                        value={newSubcategoryData.color}
                                        onChange={handleNewSubcategoryChange}
                                        className="mt-1 block w-12 h-10 p-1 border border-gray-300 rounded-md shadow-sm"
                                        disabled={apiInProgress}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newSubcategoryLimit" className="block text-sm font-medium text-gray-700">Monthly Limit ($)</label>
                                    <input
                                        type="number"
                                        id="newSubcategoryLimit"
                                        name="monthly_limit"
                                        value={newSubcategoryData.monthly_limit}
                                        onChange={handleNewSubcategoryChange}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                        required
                                        min="0"
                                        disabled={apiInProgress}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="submit"
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                    disabled={apiInProgress}
                                >
                                    {apiInProgress ? 'Adding...' : 'Create Subcategory'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelAddSubcategory}
                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                    disabled={apiInProgress}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>


                <div className="space-y-4">
                    {categoryData?.subcategories?.length > 0 ? (
                        categoryData.subcategories.map(sub => (
                            <div
                                key={sub.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200"
                            >
                                {editingSubcategoryId === sub.id ? (
                                    <div className="flex flex-col w-full gap-2">
                                        <input
                                            type="text"
                                            name="name"
                                            value={currentSubcategory?.name || ''}
                                            onChange={handleSubcategoryChange}
                                            className="p-2 border border-gray-300 rounded-md"
                                            placeholder="Subcategory Name"
                                            disabled={apiInProgress}
                                        />
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                name="icon"
                                                value={currentSubcategory?.icon || ''}
                                                onChange={handleSubcategoryChange}
                                                className="p-2 border border-gray-300 rounded-md flex-grow"
                                                placeholder="Font Awesome Icon (e.g., 'utensils')"
                                                disabled={apiInProgress}
                                            />
                                            <input
                                                type="color"
                                                name="color"
                                                value={currentSubcategory?.color || '#000000'}
                                                onChange={handleSubcategoryChange}
                                                className="p-1 border border-gray-300 rounded-md w-12 h-10"
                                                title="Pick a color"
                                                disabled={apiInProgress}
                                            />
                                            <input
                                                type="number"
                                                name="monthly_limit"
                                                value={currentSubcategory?.monthly_limit || 0}
                                                onChange={handleSubcategoryChange}
                                                className="p-2 border border-gray-300 rounded-md w-32"
                                                placeholder="Monthly Limit"
                                                disabled={apiInProgress}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={handleSaveSubcategory}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                                disabled={apiInProgress}
                                            >
                                                {apiInProgress ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={handleCancelEditSubcategory}
                                                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                                                disabled={apiInProgress}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-grow flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <span className="flex items-center gap-2 text-xl font-medium">
                                            <i className={`fa-solid fa-${sub.icon}`} style={{ color: sub.color }}></i>
                                            {sub.name}
                                        </span>
                                        <span className="text-gray-600 text-sm sm:text-base">
                                            Limit: <span className="font-semibold">${sub.monthly_limit?.toLocaleString()}</span>
                                        </span>
                                    </div>
                                )}
                                {!editingSubcategoryId && (
                                    <div className="flex gap-2 mt-3 sm:mt-0">
                                        <button
                                            onClick={() => handleEditSubcategory(sub.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition duration-300 ease-in-out text-sm"
                                            disabled={apiInProgress}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubcategory(sub.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition duration-300 ease-in-out text-sm"
                                            disabled={apiInProgress}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-600">No subcategories found. Click 'Add New Subcategory' above to create one!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CategoryDetail;
