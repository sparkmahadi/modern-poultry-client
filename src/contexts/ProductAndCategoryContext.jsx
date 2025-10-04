import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const ProductAndCategoryContext = createContext();

export const ProductAndCategoryProvider = ({ children }) => {
    // State for Products
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [products, setProducts] = useState([]);
    const [productError, setProductError] = useState(null); // Renamed error to productError for clarity

    // State for Categories
    const [loadingCategories, setLoadingCategories] = useState(false); // New state for category loading
    const [categories, setCategories] = useState([]); // New state for categories
    const [categoryError, setCategoryError] = useState(null); // New state for category errors

    // Function to fetch products from the API
    const fetchProducts = async () => {
        setLoadingProducts(true);
        setProductError(null); // Clear any previous errors
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
            setProducts(response?.data?.data || []);
            // toast.success('Products loaded successfully!');
        } catch (err) {
            console.error('Failed to fetch products:', err);
            const errorMessage = err.response?.data?.message || 'Failed to load products. Please try again.';
            toast.error(errorMessage);
            setProductError(errorMessage); // Store the product error message
            setProducts([]); // Clear products on error
        } finally {
            setLoadingProducts(false);
        }
    };

    // Function to fetch categories from the API
    const fetchCategories = async () => {
        setLoadingCategories(true); // Set loading state for categories
        setCategoryError(null); // Clear any previous category errors
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories`);
            setCategories(response?.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch categories for dropdowns:', err);
            const errorMessage = err.response?.data?.message || 'Failed to load categories for forms. Please check your backend.';
            toast.error(errorMessage);
            setCategoryError(errorMessage); // Store the category error message
            setCategories([]); // Clear categories on error
        } finally {
            setLoadingCategories(false); 
        }
    };

    useEffect(() => {
        if (products.length === 0 && !loadingProducts && !productError) {
            fetchProducts();
        }
        if (categories.length === 0 && !loadingCategories && !categoryError) {
            fetchCategories();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const contextValue = {
        // Products
        products,
        loadingProducts,
        productError,
        fetchProducts, 
        categories,
        loadingCategories,
        categoryError,
        fetchCategories // function for refetching
    };

    return (
        <ProductAndCategoryContext.Provider value={contextValue}>
            {children}
        </ProductAndCategoryContext.Provider>
    );
};

export const useProductsAndCategories = () => {
    const context = useContext(ProductAndCategoryContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};
