// src/components/Categories.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { toast } from 'react-toastify';

function Categories() {
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiInProgress, setApiInProgress] = useState(false); // To disable buttons during API calls

  // State for Add New Category Form
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    id: '',
    name: '',
    color: '#607D8B', // Default color
    icon: 'tag',      // Default icon
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // --- API Call to Fetch All Categories ---
  const fetchAllCategories = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
      const data = response?.data?.data;
      setAllCategories(data);
      console.log("Fetched all categories:", data);
    } catch (error) {
      console.error("Failed to fetch all categories:", error);
      setErrorMessage(error.response?.data?.message || "Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- API Call to Add New Main Category ---
  const addMainCategory = async (category) => {
    setErrorMessage('');
    setApiInProgress(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/utilities/categories`, category);
      console.log('Category added successfully:', response.data);
      await fetchAllCategories(); // Re-fetch all categories to update the list
      setShowAddCategoryForm(false); // Hide the form on success
      setNewCategoryData({ id: '', name: '', color: '#607D8B', icon: 'tag' }); // Reset form
      return { success: true };
    } catch (error) {
      console.error("Failed to add category:", error);
      setErrorMessage(error.response?.data?.message || "Failed to add category. Please try again.");
      throw error;
    } finally {
      setApiInProgress(false);
    }
  };

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchAllCategories();
  }, []);

  // --- Handlers for Add New Category Form ---
  const handleAddCategoryClick = () => {
    setShowAddCategoryForm(true);
    setNewCategoryData({ id: '', name: '', color: '#607D8B', icon: 'tag' }); // Reset form
    setErrorMessage(''); // Clear previous errors
  };

  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategoryData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleNewCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryData.name) {
      setErrorMessage("Category ID and Name cannot be empty.");
      return;
    }
    await addMainCategory(newCategoryData);
  };

  const handleCancelAddCategory = () => {
    setShowAddCategoryForm(false);
    setErrorMessage('');
  };

  const deleteMainCategory = async (categoryId) => {
    const confirm = window.confirm("Are you sure to delete this category?", categoryId);
    if (confirm) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/utilities/categories/${categoryId}`);
        console.log('Subcategory deleted successfully:', response.data);
        toast.success('Subcategory deleted successfully!');
        await fetchAllCategories(); // Re-fetch to update state after deletion
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

  const handleDeleteMainCategory = async (catId) => {
    if (catId) {
      await deleteMainCategory(catId);
    } else {
      toast.error("Error: Category ID missing for delete.");
    }
  };


  // --- Render Logic ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-gray-700 text-xl">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-4xl">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{errorMessage}</span>
          </div>
        )}

        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">All Categories</h2>

        {/* Add New Category Button / Form */}
        <div className="mb-6 border-b pb-4">
          {!showAddCategoryForm ? (
            <button
              onClick={handleAddCategoryClick}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out w-full"
              disabled={apiInProgress}
            >
              Add New Category
            </button>
          ) : (
            <form onSubmit={handleNewCategorySubmit} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
              <h3 className="text-xl font-semibold mb-2">New Category Details</h3>
              <div>
                <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="newCategoryName"
                  name="name"
                  value={newCategoryData.name}
                  onChange={handleNewCategoryChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={apiInProgress}
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label htmlFor="newCategoryIcon" className="block text-sm font-medium text-gray-700">Icon (Font Awesome name)</label>
                  <input
                    type="text"
                    id="newCategoryIcon"
                    name="icon"
                    value={newCategoryData.icon}
                    onChange={handleNewCategoryChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 'lightbulb'"
                    disabled={apiInProgress}
                  />
                </div>
                <div>
                  <label htmlFor="newCategoryColor" className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="color"
                    id="newCategoryColor"
                    name="color"
                    value={newCategoryData.color}
                    onChange={handleNewCategoryChange}
                    className="mt-1 block w-12 h-10 p-1 border border-gray-300 rounded-md shadow-sm"
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
                  {apiInProgress ? 'Adding...' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAddCategory}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                  disabled={apiInProgress}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* List of Categories */}
        <div className="space-y-4 grid lg:grid-cols-2 lg:gap-10">
          {allCategories?.length > 0 ? (
            allCategories?.map(cat => (
              <>
                <Link
                  key={cat.id}
                  to={`/categories/${cat.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-100 transition duration-200 ease-in-out no-underline text-inherit"
                >
                  <span className="flex items-center gap-3 text-xl font-medium">
                    <i className={`fa-solid fa-${cat.icon}`} style={{ color: cat.color }}></i>
                    {cat.name}
                  </span>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out text-sm"
                  >
                    Details
                  </button>
                   <button
                  onClick={() => handleDeleteMainCategory(cat.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition duration-300 ease-in-out text-sm"
                  disabled={apiInProgress}
                >
                  Delete
                </button>
                </Link>
               
              </>
            ))
          ) : (
            <p className="text-center text-gray-600">No categories found. Click 'Add New Category' above to create one!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categories;