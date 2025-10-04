import React, { useState } from "react";
import axios from "axios";

const PurchaseForm = () => {
  const [form, setForm] = useState({
    supplier_name: "",
    address: "",
    phone: "",
    due: 0,
    advance: 0,
    status: "pending",
  });
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newProductName, setNewProductName] = useState("");

  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleProductSearch = async (e) => {
    setProductSearch(e.target.value);
    if (e.target.value.trim() === "") return setSearchResults([]);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/search?q=${e.target.value}`);
      setSearchResults(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addProduct = (product) => {
    setProducts([...products, { ...product, qty: 1 }]);
    setProductSearch("");
    setSearchResults([]);
  };

  const addNewProduct = async () => {
    if (!newProductName) return;
    try {
      const res = await axios.post("${API_BASE_URL}/api/products", { name: newProductName });
      addProduct(res.data.data);
      setNewProductName("");
    } catch (err) {
      console.error(err);
    }
  };

  const updateQty = (index, qty) => {
    const newProducts = [...products];
    newProducts[index].qty = qty;
    setProducts(newProducts);
  };

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (products.length === 0) return alert("Add at least one product");
    try {
      await axios.post(`${API_BASE_URL}/api/purchases`, { ...form, products });
      setForm({ supplier_name: "", address: "", phone: "", due: 0, advance: 0, status: "pending" });
      setProducts([]);
      alert("Purchase created successfully");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">New Purchase</h2>
      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <input
          name="supplier_name"
          value={form.supplier_name}
          onChange={handleChange}
          placeholder="Supplier Name"
          className="border p-2 w-full"
          required
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="border p-2 w-full"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="border p-2 w-full"
        />

        {/* Product Search */}
        <div>
          <input
            value={productSearch}
            onChange={handleProductSearch}
            placeholder="Search product"
            className="border p-2 w-full"
          />
          {searchResults.length > 0 && (
            <ul className="border mt-1 max-h-32 overflow-auto">
              {searchResults.map((p) => (
                <li
                  key={p._id}
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => addProduct(p)}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}
          <div className="flex mt-2">
            <input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Add new product"
              className="border p-2 flex-1"
            />
            <button type="button" onClick={addNewProduct} className="bg-green-500 text-white px-4 ml-2 rounded">
              Add
            </button>
          </div>
        </div>

        {/* Selected Products */}
        <div>
          {products.map((p, index) => (
            <div key={index} className="flex items-center justify-between border p-2 my-1">
              <span>{p.name}</span>
              <input
                type="number"
                value={p.qty}
                min="1"
                onChange={(e) => updateQty(index, Number(e.target.value))}
                className="border p-1 w-16"
              />
              <button type="button" onClick={() => removeProduct(index)} className="bg-red-500 text-white px-2 rounded">
                Remove
              </button>
            </div>
          ))}
        </div>

        <input
          name="due"
          type="number"
          value={form.due}
          onChange={handleChange}
          placeholder="Due"
          className="border p-2 w-full"
        />
        <input
          name="advance"
          type="number"
          value={form.advance}
          onChange={handleChange}
          placeholder="Advance"
          className="border p-2 w-full"
        />
        <select name="status" value={form.status} onChange={handleChange} className="border p-2 w-full">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Create Purchase
        </button>
      </form>
    </div>
  );
};

export default PurchaseForm;
