import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { InputField, SelectField } from './FormComponents'; // Import helpers
import ProductRow from './ProductRow'; // Import product row component

// Note: Assuming API_BASE_URL is handled via environment variables in a real project
const API_BASE_URL = 'http://localhost:5000';

const initialFormState = {
  supplier_name: "",
  address: "",
  phone: "",
  due: 0,
  advance: 0,
  status: "pending",
  supplier_id: null,
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

  // --- Calculations ---
  const totalPurchase = useMemo(() => 
    products.reduce((sum, p) => sum + (Number(p.purchase_price || 0) * Number(p.qty || 0)), 0), 
    [products]
  );
  const netBalance = useMemo(() => totalPurchase - Number(form.advance) + Number(form.due), [totalPurchase, form.advance, form.due]);

  const resetForm = () => {
      setForm(initialFormState);
      setProducts([]);
      setSupplierSearchQuery('');
      setSupplierSearchResults([]);
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? Number(value) : value;
    
    // Clear supplier ID if name/address/phone is manually changed
    if (['supplier_name', 'address', 'phone'].includes(name)) {
        setForm({ ...form, [name]: newValue, supplier_id: null });
    } else {
        setForm({ ...form, [name]: newValue });
    }
  };

  // --- Supplier Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        const query = supplierSearchQuery.trim();
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
    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearchQuery]);

  const handleSelectSupplier = (supplier) => {
    setForm({
        ...form,
        supplier_id: supplier._id,
        supplier_name: supplier.name,
        address: supplier.address || '',
        phone: supplier.phone || '',
        due: Number(supplier.due) || 0,
        advance: Number(supplier.advance) || 0,
        status: form.status,
    });
    setSupplierSearchQuery(supplier.name);
    setSupplierSearchResults([]);
  };

  // --- Product Management Logic ---
  const handleProductSearch = async (e) => {
    const query = e.target.value;
    setProductSearch(query);

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
            { ...product, qty: 1, purchase_price: Number(product.purchase_price || 0) }
        ]);
    }
    setProductSearch("");
    setSearchResults([]);
  };

  const addNewProduct = async () => {
    if (!newProductName) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/products`, { name: newProductName });
      addProduct(res.data.data); 
      setNewProductName("");
    } catch (err) {
      console.error("Failed to create new product:", err);
      alert("Failed to create new product.");
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
  
  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_name.trim()) return alert("Please specify the Supplier Name.");
    if (products.length === 0) return alert("Please add at least one product to the purchase list.");
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        total_amount: totalPurchase,
        products: products.map(p => ({
          product_id: p._id,
          name: p.name,
          qty: p.qty,
          purchase_price: p.purchase_price,
          subtotal: p.qty * p.purchase_price,
        })),
      };

      await axios.post(`${API_BASE_URL}/api/purchases`, payload);
      resetForm();
      alert("Purchase created successfully!");
    } catch (err) {
      console.error("Purchase submission failed:", err);
      alert("Failed to create purchase. Please try again.");
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
                    value={supplierSearchQuery}
                    onChange={(e) => {
                        setSupplierSearchQuery(e.target.value);
                        if (!e.target.value.trim()) { setForm(initialFormState); }
                    }}
                    placeholder="Search by name or phone..."
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500 transition duration-150"
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
              
              <div className="space-y-4 pt-4 border-t">
                <InputField label="Supplier Name" name="supplier_name" value={form.supplier_name} onChange={handleChange} required />
                <InputField label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
                <InputField label="Address" name="address" value={form.address} onChange={handleChange} />
              </div>
              {form.supplier_id && (
                <p className="text-xs text-green-600 mt-2 font-medium">Selected Supplier ID: {form.supplier_id}</p>
              )}
            </div>

            {/* Financial Status Card */}
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
                    { value: "completed", label: "Completed" },
                  ]}
                />
              </div>
            </div>
          </div>
          
          {/* === Right Column: Products and Action === */}
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
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <li
                        key={p._id}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => addProduct(p)}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-sm text-gray-600">Buy Rate: ৳{Number(p.purchase_price || 0).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add New Product */}
              <div className="flex gap-2 items-end pt-2 border-t mt-4">
                <InputField
                    label="Or Add New Product Name"
                    name="new_product_name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="New item name"
                    className="flex-grow"
                />
                <button 
                  type="button" 
                  onClick={addNewProduct} 
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
                  disabled={!newProductName.trim()}
                >
                  Create & Add
                </button>
              </div>
            </div>
            
            {/* Product List Table Card */}
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

            {/* Totals and Action Block */}
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

                <button 
                  type="submit" 
                  className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={isSubmitting || products.length === 0 || !form.supplier_name.trim()}
                >
                  {isSubmitting ? 'Processing Purchase...' : 'Create Purchase Order'}
                </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;