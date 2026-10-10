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
    payment_method: "cash",
    account_id: "",
    paid_amount: 0,
};

const CreatePurchase = () => {
    const [form, setForm] = useState(initialFormState);
    const [products, setProducts] = useState([]);

    // UI & Search State
    const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
    const [supplierSearchResults, setSupplierSearchResults] = useState([]);
    const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);

    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [productSearchLoading, setProductSearchLoading] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Modals
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [addSupplierApiInProgress, setAddSupplierApiInProgress] = useState(false);

    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [addProductApiInProgress, setAddProductApiInProgress] = useState(false);

    const [accountList, setAccountList] = useState([]);
    const [dateTime, setDateTime] = useState(() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    });

    useEffect(() => {
        fetchCategories();
        fetchAccounts();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
            setCategories(res?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/payment_accounts`);
            const accs = res.data?.data || [];
            setAccountList(accs);
            const defaultCash = accs.find((a) => a.type === "cash" && a.is_default);
            if (defaultCash) {
                setForm((prev) => ({ ...prev, account_id: defaultCash._id }));
            }
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        }
    };

    useEffect(() => {
        if (!form.payment_method || accountList.length === 0) return;
        const defaultAccount = accountList.find(
            (acc) => acc.type === form.payment_method && acc.is_default === true
        );
        if (defaultAccount) {
            setForm((prev) => ({ ...prev, account_id: defaultAccount._id }));
        }
    }, [form.payment_method, accountList]);

    const totalPurchase = useMemo(() =>
        products.reduce((sum, p) => sum + (Number(p.purchase_price || 0) * Number(p.qty || 0)), 0),
        [products]
    );

    const netBalance = useMemo(() => 
        totalPurchase - Number(form.advance || 0) + Number(form.due || 0), 
        [totalPurchase, form.advance, form.due]
    );

    const resetForm = () => {
        setProducts([]);
        setSupplierSearchQuery('');
        setSupplierSearchResults([]);
        setForm(initialFormState);
        const now = new Date();
        setDateTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? Number(value) : value;

        if (['supplier_name', 'address', 'phone'].includes(name)) {
            setForm({ ...form, [name]: newValue, supplierId: null });
            if (name === 'supplier_name') {
                setSupplierSearchQuery(newValue);
            }
        } else {
            setForm({ ...form, [name]: newValue });
        }
    };

    useEffect(() => {
        const delay = setTimeout(async () => {
            const query = supplierSearchQuery.trim();
            if (!query) {
                setSupplierSearchResults([]);
                return;
            }
            setSupplierSearchLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/suppliers/search?q=${encodeURIComponent(query)}`);
                setSupplierSearchResults(res.data.data || []);
            } catch (err) {
                console.error("Supplier search failed:", err);
                setSupplierSearchResults([]);
            } finally {
                setSupplierSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [supplierSearchQuery]);

    const handleSelectSupplier = (supplier) => {
        setForm({
            ...form,
            supplierId: supplier._id,
            supplier_name: supplier.name,
            address: supplier.address || '',
            phone: supplier.phone || '',
            due: Number(supplier.due) || 0,
            advance: Number(supplier.advance) || 0,
        });
        setSupplierSearchResults([]);
    };

    const saveNewSupplier = async (supplierData) => {
        setAddSupplierApiInProgress(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData);
            const newSupplier = res.data.data;
            toast.success(`Supplier "${newSupplier.name}" registered and selected!`);
            handleSelectSupplier(newSupplier);
            setShowAddSupplierModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create supplier.");
        } finally {
            setAddSupplierApiInProgress(false);
        }
    };

    const handleProductSearch = async (e) => {
        const query = e.target.value;
        setProductSearch(query);

        if (query.trim() === "") return setSearchResults([]);

        setProductSearchLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data.data || []);
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
                    purchase_price: Number(product.purchase_price || product.price || 0)
                }
            ]);
        } else {
            toast.info("Item is already in purchase table.");
        }
        setProductSearch("");
        setSearchResults([]);
    };

    const saveNewProduct = async (productData) => {
        setAddProductApiInProgress(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/products`, productData);
            const created = res.data.data;
            toast.success(`Product "${created.item_name}" created!`);
            addProduct(created);
            setShowAddProductModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create product.");
        } finally {
            setAddProductApiInProgress(false);
        }
    };

    const updateProductField = (index, field, value) => {
        const updated = [...products];
        const numeric = (field === 'qty' || field === 'purchase_price') ? Number(value || 0) : value;
        updated[index][field] = numeric;
        setProducts(updated);
    };

    const removeProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.supplierId) return toast.error("Please select or register a supplier.");
        if (products.length === 0) return toast.error("Add at least one product item.");
        if (form.paid_amount > 0 && !form.account_id) return toast.error("Please select a payment account.");

        setIsSubmitting(true);
        try {
            const payload = {
                supplier_id: form.supplierId,
                payment_method: form.payment_method,
                account_id: form.paid_amount > 0 ? form.account_id : null,
                paid_amount: Number(form.paid_amount) || 0,
                date: new Date(dateTime).toISOString(),
                total_amount: totalPurchase,
                products: products.map(p => ({
                    product_id: p._id,
                    name: p.item_name,
                    unit: p.unit || 'pcs',
                    qty: Number(p.qty),
                    purchase_price: Number(p.purchase_price),
                    subtotal: Number(p.qty * p.purchase_price),
                })),
            };

            const res = await axios.post(`${API_BASE_URL}/api/purchases`, payload);
            if (res.data?.success) {
                toast.success(res.data.message || "Purchase order created successfully!");
                resetForm();
            } else {
                toast.info(res.data?.message || "Submission completed.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create purchase.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PurchaseFormV2
            supplier={{
                form,
                setForm,
                supplierSearchLoading,
                supplierSearchResults,
                setSupplierSearchQuery,
                handleSelectSupplier,
                handleOpenAddSupplierModal: () => setShowAddSupplierModal(true),
            }}
            productsBlock={{
                productSearch,
                setProductSearch,
                handleProductSearch,
                productSearchLoading,
                searchResults,
                addProduct,
                handleOpenAddProductModal: () => setShowAddProductModal(true),
                products,
                updateProductField,
                removeProduct,
            }}
            payment={{
                showPaymentModal,
                setShowPaymentModal,
                handlePaymentSelect: ({ paymentMethod, accountId }) => 
                    setForm(prev => ({ ...prev, payment_method: paymentMethod, account_id: accountId })),
            }}
            summary={{
                totalPurchase,
                netBalance,
            }}
            formActions={{
                handleSubmit,
                handleChange,
                dateTime,
                setDateTime,
                isSubmitting,
            }}
            /* Props mapped to match modal signatures */
            addProductModalProps={{
                isOpen: showAddProductModal,
                onClose: () => setShowAddProductModal(false),
                apiInProgress: addProductApiInProgress,
                categories,
                onSave: saveNewProduct,
            }}
            addSupplierModalProps={{
                isOpen: showAddSupplierModal,
                onClose: () => setShowAddSupplierModal(false),
                apiInProgress: addSupplierApiInProgress,
                onSave: saveNewSupplier,
            }}
        />
    );
};

export default CreatePurchase;