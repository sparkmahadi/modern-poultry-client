import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { toast } from 'react-toastify';

import PurchaseFormV2 from "./PurchaseFormV2";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialFormState = {
    supplier_name: "",
    address: "",
    phone: "",
    due: 0,
    advance: 0,
    status: "pending",
    supplierId: null,
};

const CreatePurchase = () => {
    const [form, setForm] = useState(initialFormState);
    const [products, setProducts] = useState([]);

    // State for search and UI
    const [newProductName, setNewProductName] = useState("");

    // --- UI & SEARCH STATE ---
    const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
    const [supplierSearchResults, setSupplierSearchResults] = useState([]);
    const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);

    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [productSearchLoading, setProductSearchLoading] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false); // Global loading state for final POST
    const [showPaymentModal, setShowPaymentModal] = useState(false);


    // === NEW SUPPLIER MODAL STATES ===
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [addSupplierApiInProgress, setAddSupplierApiInProgress] = useState(false);

    // === EXISTING PRODUCT MODAL STATES ===
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [addProductApiInProgress, setAddProductApiInProgress] = useState(false);

    // --- Data Fetch on Mount (for categories) ---
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
            setCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    // --- Product Modal Handlers ---
    const handleOpenAddProductModal = () => {
        setShowAddProductModal(true);
    };

    const handleCloseAddProductModal = () => {
        setNewProductName("");
        setShowAddProductModal(false);
    };

    // --- NEW Supplier Modal Handlers ---
    const handleOpenAddSupplierModal = () => {
        setShowAddSupplierModal(true);
    };

    const handleCloseAddSupplierModal = () => {
        setShowAddSupplierModal(false);
    };


    // --- Handler for selecting payment
    const handlePaymentSelect = ({ paymentMethod, accountId }) => {
        setForm((prev) => ({ ...prev, payment_method: paymentMethod, account_id: accountId }));
    };

    // --- Calculations ---
    const totalPurchase = useMemo(() =>
        products.reduce((sum, p) => sum + (Number(p.purchase_price || 0) * Number(p.qty || 0)), 0),
        [products]
    );
    const netBalance = useMemo(() => totalPurchase - Number(form.advance) + Number(form.due), [totalPurchase, form.advance, form.due]);

    const resetForm = () => {
        setProducts([]);
        setSupplierSearchQuery('');
        setSupplierSearchResults([]);
        setForm(initialFormState);
    }

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;


        if (['supplier_name', 'address', 'phone'].includes(name)) {
            // Update the form state for display in input fields
            setForm({ ...form, [name]: newValue, supplierId: null });

            // Only update the dedicated search query state for the debouncer
            if (name === 'supplier_name') {
                setSupplierSearchQuery(newValue);
            }
        } else {
            setForm({ ...form, [name]: newValue });
        }

        if (["paid_amount", "payment_method", "account_id"].includes(name)) {
            setForm({ ...form, [name]: newValue });
            return;
        }
    };

    // --- Supplier Search Logic (Debounced API Call) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            const query = supplierSearchQuery.trim();

            // Critical check: if the query is empty, stop and clear results
            if (!query) {
                setSupplierSearchResults([]);
                return;
            }

            setSupplierSearchLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/suppliers/search?q=${query}`);
                setSupplierSearchResults(res.data.data || []);
            } catch (err) {
                console.error("Supplier search failed:", err);
                setSupplierSearchResults([]);
            } finally {
                setSupplierSearchLoading(false);
            }
        }, 500);

        // This cleanup function runs when the component unmounts OR when 
        // `supplierSearchQuery` changes, cancelling the previous timer.
        return () => clearTimeout(delayDebounceFn);
    }, [supplierSearchQuery]);

    // --- Supplier Selection Logic (Fixed) ---
    const handleSelectSupplier = (supplier) => {
        setForm({
            ...form,
            supplierId: supplier._id,
            supplier_name: supplier.name, // input shows selected supplier
            address: supplier.address || '',
            phone: supplier.phone || '',
            due: Number(supplier.due) || 0,
            advance: Number(supplier.advance) || 0,
            status: form.status,
        });

        // ✅ Stop clearing the search query immediately
        setSupplierSearchResults([]); // hide dropdown
        // Don't update supplierSearchQuery here
    };


    // 🆕 API Logic for Supplier Modal Submission
    const saveNewSupplier = async (supplierData) => {
        setAddSupplierApiInProgress(true);
        try {
            const payload = {
                name: supplierData.name,
                address: supplierData.address,
                phone: supplierData.phone,
                type: supplierData.type,
                due: supplierData.due,
                advance: supplierData.advance,
            };

            const res = await axios.post(`${API_BASE_URL}/api/suppliers`, payload);
            const newSupplier = res.data.data;

            toast.success(`Supplier "${newSupplier.name}" created and selected!`);

            // Automatically select the newly created supplier
            handleSelectSupplier({
                _id: newSupplier._id,
                name: newSupplier.name,
                address: newSupplier.address,
                phone: newSupplier.phone,
                due: newSupplier.due,
                advance: newSupplier.advance
            });

            handleCloseAddSupplierModal();
            return { success: true };
        } catch (err) {
            console.error("Failed to create new supplier:", err);
            toast.error(err.response?.data?.message || "Failed to create new supplier.");
            throw err;
        } finally {
            setAddSupplierApiInProgress(false);
        }
    };


    // --- Product Management Logic (Unchanged for brevity) ---
    const handleProductSearch = async (e) => {
        const query = e.target.value;
        setProductSearch(query);
        setNewProductName(query);

        if (query.trim() === "") return setSearchResults([]);

        setProductSearchLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${query}`);
            setSearchResults(res.data.data);
        } catch (err) {
            console.error("Product search failed:", err);
            setSearchResults([]);
        } finally {
            setProductSearchLoading(false);
        }
    };

    const addProduct = (product) => {
        const exists = products.find(p => p._id === product._id);
        if (!exists) {
            setProducts(prev => [
                ...prev,
                {
                    _id: product._id,
                    item_name: product.item_name || product.name,
                    unit: product.unit || 'pcs',
                    qty: 1,
                    purchase_price: Number(product.purchase_price || 0)
                }
            ]);
        }
        setProductSearch("");
        setSearchResults([]);
    };

    const saveNewProduct = async (productData) => {
        setAddProductApiInProgress(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/products`, productData);

            toast.success(`Product "${res.data.data.item_name}" created and added!`);
            addProduct(res.data.data);
            handleCloseAddProductModal();
            return { success: true };
        } catch (err) {
            console.error("Failed to create new product:", err);
            toast.error("Failed to create new product.");
            throw err;
        } finally {
            setAddProductApiInProgress(false);
        }
    };

    const updateProductField = (index, field, value) => {
        const newProducts = [...products];
        const numericValue = (field === 'qty' || field === 'purchase_price') ? Number(value || 0) : value;
        newProducts[index][field] = numericValue;
        setProducts(newProducts);
    };

    const removeProduct = (index) => {
        const newProducts = products.filter((_, i) => i !== index);
        setProducts(newProducts);
    };

    const [accountList, setAccountList] = useState([]);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
            console.log("accounts", res);
            setAccountList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        }
    };

    useEffect(() => {
        if (!form.payment_method || accountList.length === 0) return;

        const defaultAccount = accountList.find(
            (acc) =>
                acc.type === form.payment_method &&
                acc.is_default === true
        );

        if (defaultAccount) {
            setForm((prev) => ({
                ...prev,
                account_id: defaultAccount._id,
            }));
        }
    }, [form.payment_method, accountList]);





    // --- Form Submission (Unchanged) ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.supplierId) return alert("Please select or create a supplier.");
        // if (!form.payment_method) return alert("Select payment method.");
        // if (!form.account_id) return alert("Select payment account.");
        if (products.length === 0) return alert("Add at least one product.");

        setIsSubmitting(true);
        try {
            const payload = {
                supplier_id: form.supplierId,
                payment_method: form.payment_method,
                account_id: form.account_id,
                paid_amount: Number(form.paid_amount) || 0,

                date: new Date(dateTime).toISOString(),

                total_amount: totalPurchase,

                products: products.map(p => ({
                    product_id: p._id,
                    name: p.item_name,
                    qty: Number(p.qty),
                    purchase_price: Number(p.purchase_price),
                    subtotal: Number(p.qty * p.purchase_price),
                })),
            };

            console.log('payload', payload);

            const res = await axios.post(`${API_BASE_URL}/api/purchases`, payload);
            const data = (res.data);
            if (data.success) {
                toast.success(data.message || "Purchase created successfully!");
            } else {
                toast.info(data.message)
            }
            resetForm();
        } catch (err) {
            console.error("Purchase failed:", err);
            toast.error(err.response?.data?.message || "Failed to create purchase.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [dateTime, setDateTime] = useState("");


    useEffect(() => {
        const now = new Date();

        // Convert to local datetime (required for datetime-local input)
        const localDateTime = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16); // yyyy-MM-ddTHH:mm

        setDateTime(localDateTime);
    }, []);


    const supplierProps = {
        form,
        setForm,
        supplierSearchLoading,
        supplierSearchResults,
        setSupplierSearchQuery,
        handleSelectSupplier,
        handleOpenAddSupplierModal,
    };

    const productProps = {
        productSearch,
        handleProductSearch,
        productSearchLoading,
        searchResults,
        addProduct,
        handleOpenAddProductModal,
        products,
        updateProductField,
        removeProduct,
    };

    const paymentProps = {
        showPaymentModal,
        setShowPaymentModal,
        handlePaymentSelect,
    };

    const summaryProps = {
        totalPurchase,
        netBalance,
    };

    const formProps = {
        handleSubmit,
        handleChange,
        dateTime,
        setDateTime,
        isSubmitting,
    };

    const addProductModalProps = {
        showAddProductModal,
        handleCloseAddProductModal,
        addProductApiInProgress,
        categories,
        saveNewProduct
    }

    const addSupplierModalProps ={
        showAddSupplierModal,
        handleCloseAddSupplierModal,
        addSupplierApiInProgress,
        saveNewSupplier
    }

    // --- Render ---
    return (
        <div>
            <PurchaseFormV2
                supplier={supplierProps}
                productsBlock={productProps}
                payment={paymentProps}
                summary={summaryProps}
                formActions={formProps}
                addProductModalProps={addProductModalProps}
                addSupplierModalProps={addSupplierModalProps}
            />

        </div>
    );
};

export default CreatePurchase;