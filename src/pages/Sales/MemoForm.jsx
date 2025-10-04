import React, { useState, useEffect } from "react";
import axios from "axios";

const MemoForm = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);

  // Fetch products from API with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!search.trim()) return setSearchResults([]);

      axios
        .get(`http://localhost:5000/api/products/search?q=${search}`)
        .then((res) => {
          if (res.data.success) setSearchResults(res.data.data);
          else setSearchResults([]);
        })
        .catch(() => setSearchResults([]));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Add product to memo
  const addProduct = (product) => {
    const exists = selectedProducts.find((p) => p._id === product._id);
    if (!exists) {
      setSelectedProducts([
        ...selectedProducts,
        { ...product, qty: 1, subtotal: product.price },
      ]);
    }
    setSearch("");
    setSearchResults([]);
  };

  // Update quantity
  const updateQty = (id, qty) => {
    const updated = selectedProducts.map((p) =>
      p._id === id
        ? { ...p, qty, subtotal: qty * p.price }
        : p
    );
    setSelectedProducts(updated);
  };

  // Update price
  const updatePrice = (id, price) => {
    const updated = selectedProducts.map((p) =>
      p._id === id
        ? { ...p, price, subtotal: p.qty * price }
        : p
    );
    setSelectedProducts(updated);
  };

  // Remove product
  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== id));
  };

  const total = selectedProducts.reduce((acc, p) => acc + p.subtotal, 0);
  const due = total - paidAmount;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Create Memo</h2>

      {/* Date */}
      <div className="mb-4">
        <label className="block font-medium">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>

      {/* Product Search */}
      <div className="mb-4 relative">
        <label className="block font-medium">Search Products</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product..."
          className="border rounded p-2 w-full"
        />
        {searchResults.length > 0 && (
          <ul className="absolute z-10 w-full border bg-white rounded max-h-40 overflow-y-auto">
            {searchResults.map((p) => (
              <li
                key={p._id}
                onClick={() => addProduct(p)}
                className="p-2 cursor-pointer hover:bg-gray-100"
              >
                {p.item_name} - ${p.price}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Products Table */}
      {selectedProducts.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">SL</th>
                <th className="p-2">Product</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Price</th>
                <th className="p-2">Subtotal</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((p, index) => (
                <tr key={p._id} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{p.item_name}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      value={p.qty}
                      onChange={(e) =>
                        updateQty(p._id, Number(e.target.value))
                      }
                      className="border rounded p-1 w-20"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={p.price}
                      onChange={(e) =>
                        updatePrice(p._id, Number(e.target.value))
                      }
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="p-2">${p.subtotal}</td>
                  <td className="p-2">
                    <button
                      onClick={() => removeProduct(p._id)}
                      className="text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Total & Payment */}
      <div className="mb-2 text-right">
        <p className="font-medium">Total: ${total}</p>
      </div>

      <div className="mb-2">
        <label className="block font-medium">Paid Amount</label>
        <input
          type="number"
          min="0"
          value={paidAmount}
          onChange={(e) => setPaidAmount(Number(e.target.value))}
          className="border rounded p-2 w-full"
        />
      </div>

      <div className="mb-4 text-right font-medium">Due: ${due}</div>

      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full md:w-auto">
        Save Memo
      </button>
    </div>
  );
};

export default MemoForm;
