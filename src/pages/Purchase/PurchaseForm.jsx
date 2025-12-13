import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { toast } from 'react-toastify';

import { InputField, SelectField } from './FormComponents';
import ProductRow from './ProductRow';
import AddProductModal from "../../components/AddProductModal/AddProductModal";
import AddSupplierModal from "./AddSupplierModal"; // Assuming this is created

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

const PurchaseForm = () => {
  const [form, setForm] = useState(initialFormState);
  const [products, setProducts] = useState([]);

  // State for search and UI
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierSearchResults, setSupplierSearchResults] = useState([]);
  const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

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
    setForm(initialFormState); // Full reset for a new entry
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
      console.log(res, "accounts");
      setAccountList(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    }
  };



  // --- Form Submission (Unchanged) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.supplierId) return alert("Please select or create a supplier.");
    if (!form.payment_method) return alert("Select payment method.");
    if (!form.account_id) return alert("Select payment account.");
    if (products.length === 0) return alert("Add at least one product.");

    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: form.supplierId,
        payment_method: form.payment_method,
        account_id: form.account_id,
        paid_amount: Number(form.paid_amount),

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

      await axios.post(`${API_BASE_URL}/api/purchases`, payload);

      toast.success("Purchase created successfully!");
      // resetForm();
    } catch (err) {
      console.error("Purchase failed:", err);
      toast.error(err.response?.data?.message || "Failed to create purchase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b pb-2">🛍️ New Purchase Entry</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* === Left Column: Supplier Info and Financial Status === */}
          <div className="lg:col-span-1 space-y-6">
            {/* Supplier Information Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg relative">
              <h2 className="text-xl font-bold text-blue-600 mb-4 border-b pb-2">Supplier Details</h2>

              {/* Supplier Search Field */}
              <div className="relative mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search Existing Supplier</label>
                <input
                  type="text"
                  value={form.supplier_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({ ...form, supplier_name: value, supplierId: null });
                    setSupplierSearchQuery(value); // only for API search
                  }}
                  placeholder="Search by name or phone..."
                />

                {supplierSearchLoading && <div className="absolute top-1/2 right-3 mt-2 transform -translate-y-1/2 text-blue-500 text-xs">...</div>}

                {supplierSearchResults.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {supplierSearchResults.map((s) => (
                      <li
                        key={s._id}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleSelectSupplier(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-sm text-gray-600">{s.phone}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Create New Supplier Button (Always Active as requested) */}
              <div className="flex justify-start pt-2 border-t mt-4 mb-4">
                <button
                  type="button"
                  onClick={handleOpenAddSupplierModal}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Create New Supplier
                </button>
              </div>


              <div className="space-y-4 pt-4 border-t">
                {/* These are controlled by the main input's onChange now, but kept for direct edits */}
                <p>Supplier: {form.supplier_name}</p>
                <p>Phone: {form.phone}</p>
                <p>Address: {form.address}</p>
              </div>
              {form.supplierId && (
                <p className="text-xs text-green-600 mt-2 font-medium">Selected Supplier ID: {form.supplierId}</p>
              )}
            </div>

            {/* Financial Status Card (Unchanged) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-4 border-b pb-2">Financial Status</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Supplier Due (৳)" name="due" type="number" value={form.due} onChange={handleChange} />
                  <InputField label="Your Advance (৳)" name="advance" type="number" value={form.advance} onChange={handleChange} />
                </div>
                <SelectField
                  label="Purchase Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={[
                    { value: "pending", label: "Pending Payment" },
                    { value: "paid", label: "Paid" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* === Right Column: Products and Action (Unchanged) === */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product Search and Add Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg relative">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Add Products</h2>

              {/* Product Search Input */}
              <div className="relative mb-4">
                <InputField
                  label="Search Existing Product"
                  name="product_search"
                  value={productSearch}
                  onChange={handleProductSearch}
                  placeholder="Search by name..."
                  className="relative"
                />
                {productSearchLoading && <div className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500">Loading...</div>}
                {searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white text-gray-800 border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <li
                        key={p._id}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => addProduct(p)}
                      >
                        <span className="font-medium">{p.item_name}</span>
                        <span className="text-sm text-gray-600">Buy Rate: ৳{Number(p.purchase_price || 0).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add New Product Button */}
              <div className="flex justify-start pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={handleOpenAddProductModal}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  Create New Product
                </button>
              </div>
            </div>

            {/* Product List Table Card and Totals Block (Unchanged for brevity) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Products in Purchase</h2>
              {products.length === 0 ? (
                <div className="text-center py-6 text-gray-500 italic">No products added yet. Start searching above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Price (৳)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Subtotal (৳)</th>
                        <th className="px-4 py-3 text-center w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {products.map((p, index) => (
                        <ProductRow
                          key={p._id || index}
                          product={p}
                          index={index}
                          updateProductField={updateProductField}
                          removeProduct={removeProduct}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-blue-100 border-l-4 border-blue-500 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center text-xl font-bold text-gray-800 mb-4 border-b border-blue-200 pb-2">
                <span>Total Purchase:</span>
                <span className="text-blue-700">৳ {totalPurchase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold text-gray-700">
                <span>Net Balance:</span>
                <span className={netBalance >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {netBalance >= 0 ? `Due: ৳${netBalance.toFixed(2)}` : `Credit: ৳${Math.abs(netBalance).toFixed(2)}`}
                </span>
              </div>


              {/* ========== PAYMENT INFORMATION ========== */}
              <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-1 space-y-4">
                <h2 className="text-xl font-bold text-blue-600 mb-4 border-b pb-2">
                  Payment Info
                </h2>

                {/* Payment Method */}
                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={form.payment_method || ""}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile">Mobile Wallet</option>
                </select>

                {/* Account Selection (depends on method) */}
                {form.payment_method && (
                  <>
                    <label className="text-sm font-medium text-gray-700">Select Account</label>
                    <select
                      value={form.account_id || ""}
                      onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Choose Account</option>

                      {/* CASH ACCOUNTS */}
                      {form.payment_method === "cash" &&
                        accountList
                          .filter((a) => a.type === "cash")
                          .map((a) => (
                            <option value={a._id} key={a._id}>
                              {a.name} (Balance: {a.balance})
                            </option>
                          ))}

                      {/* BANK ACCOUNTS */}
                      {form.payment_method === "bank" &&
                        accountList
                          .filter((a) => a.type === "bank")
                          .map((a) => (
                            <option value={a._id} key={a._id}>
                              {a.bank_name} - {a.account_number} (Balance: {a.balance})
                            </option>
                          ))}

                      {/* MOBILE ACCOUNTS */}
                      {form.payment_method === "mobile" &&
                        accountList
                          .filter((a) => a.type === "mobile")
                          .map((a) => (
                            <option value={a._id} key={a._id}>
                              {a.method?.toUpperCase()} - {a.number} (Balance: {a.balance})
                            </option>
                          ))}
                    </select>
                  </>
                )}

                {/* Paid Amount */}
                <InputField
                  label="Paid Amount (৳)"
                  name="paid_amount"
                  type="number"
                  value={form.paid_amount || ""}
                  onChange={handleChange}
                />
              </div>



              <button
                type="submit"
                className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isSubmitting || products.length === 0 || !form.supplier_name.trim() || !form.supplierId}
              >
                {isSubmitting ? 'Processing Purchase...' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* === INTEGRATED ADD PRODUCT MODAL === */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={handleCloseAddProductModal}
        apiInProgress={addProductApiInProgress}
        categories={categories}
        onSave={saveNewProduct}
      />

      {/* === INTEGRATED ADD SUPPLIER MODAL === */}
      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={handleCloseAddSupplierModal}
        apiInProgress={addSupplierApiInProgress}
        onSave={saveNewSupplier}
      />
    </div>
  );
};

export default PurchaseForm;