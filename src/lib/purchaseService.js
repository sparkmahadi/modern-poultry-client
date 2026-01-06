import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const purchaseService = {
  fetchCategories: () => axios.get(`${API_BASE_URL}/api/utilities/categories`),
  fetchAccounts: () => axios.get(`${API_BASE_URL}/api/payment_accounts`),
  searchSuppliers: (query) => axios.get(`${API_BASE_URL}/api/suppliers/search?q=${query}`),
  searchProducts: (query) => axios.get(`${API_BASE_URL}/api/products/search?q=${query}`),
  createSupplier: (payload) => axios.post(`${API_BASE_URL}/api/suppliers`, payload),
  createProduct: (payload) => axios.post(`${API_BASE_URL}/api/products`, payload),
  createPurchase: (payload) => axios.post(`${API_BASE_URL}/api/purchases`, payload),
};

export const fetchCategories = async ({setCategories}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
      setCategories(response?.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };