// /lib/api.js
import API from './api';  // Import the configured API instance

// Function to fetch all categories
export const getCategories = async () => {
  try {
    const response = await API.get(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories`);
    console.log(response);
    return response?.data?.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Function to create a new category
export const createCategory = async (category) => {
  console.log(category);
  try {
    const response = await API.post(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories`, category);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Function to fetch a category by cat_id
export const getCategoryById = async (cat_id) => {
  try {
    const response = await API.get(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories/${cat_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    throw error;
  }
};

// Function to update a category by cat_id
export const updateCategory = async (updatedCategory) => {
  try {
    const response = await API.put(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories/${updatedCategory?.cat_id}`, updatedCategory);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};