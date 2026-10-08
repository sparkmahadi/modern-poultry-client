import React from "react";

const inputClass =
  "border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition duration-150 ease-in-out print:border-none print:bg-white text-sm";

const RETURN_REASONS = [
  "Quality / Mortality",
  "Customer Cancelled",
  "Damaged Goods",
  "Wrong Item Delivered",
  "Weight Discrepancy",
  "Other"
];

const RemoveIcon = ({ onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors no-print"
    title="Remove Item"
  >
    <svg
      className="w-4 h-4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
);

const SalesReturnProductTable = ({
  search,
  setSearch,
  searchResults,
  addProduct,
  selectedProducts,
  removeProduct,
  updateQty,
  updatePrice,
  updateSubtotal,
  updateReason,
  isCheckingStock
}) => {
  return (
    <>
      {/* Product Search Bar */}
      <div className="p-6 border-b relative no-print bg-slate-50/50">
        <label className="text-base font-bold block mb-2 text-amber-700">
          🔍 Search Sold Product to Return
        </label>
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type product name or code to add..."
            className={`${inputClass} text-base`}
          />
          {isCheckingStock && (
            <span className="absolute right-3 top-2.5 text-xs text-amber-600 animate-pulse font-medium">
              Checking stock...
            </span>
          )}
        </div>

        {searchResults.length > 0 && (
          <ul className="absolute z-50 left-6 right-6 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto divide-y divide-gray-100">
            {searchResults.map((p) => (
              <li
                key={p._id}
                onClick={() => addProduct(p)}
                className="p-3 cursor-pointer hover:bg-amber-50 flex justify-between items-center transition-colors"
              >
                <div>
                  <span className="font-semibold text-gray-800 block text-sm">{p.item_name}</span>
                  <span className="text-xs text-gray-400">Unit: {p.unit || "pcs"}</span>
                </div>
                <span className="text-sm text-amber-700 font-bold">
                  Rate: ৳ {Number(p.price || p.sale_price || 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Return Table */}
      <div className="p-2 overflow-x-auto print-table">
        <table className="w-full min-w-[850px] border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs">
              <th className="p-3 text-left border-b border-gray-300 w-10">SL</th>
              <th className="p-3 text-center border-b border-gray-300 w-24">Current Stock</th>
              <th className="p-3 text-center border-b border-gray-300 w-28">Stock After Return</th>
              <th className="p-3 text-left border-b border-gray-300">Description</th>
              <th className="p-3 text-center border-b border-gray-300 w-36">Return Reason</th>
              <th className="p-3 text-right border-b border-gray-300 w-24">Qty</th>
              <th className="p-3 text-right border-b border-gray-300 w-28">Rate (৳)</th>
              <th className="p-3 text-right border-b border-gray-300 w-32">Subtotal (৳)</th>
              <th className="p-3 text-center border-b border-gray-300 w-12 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-400 italic">
                  No products added to return memo yet. Search above to add items.
                </td>
              </tr>
            ) : (
              selectedProducts.map((p, idx) => {
                const stockAfterReturn = Number(p.availableStock || 0) + Number(p.qty || 0);

                return (
                  <tr key={p._id} className="border-b hover:bg-amber-50/30 transition-colors">
                    <td className="p-3 align-middle text-gray-600 text-sm">{idx + 1}</td>

                    {/* Current Stock */}
                    <td className="p-3 align-middle text-center text-sm font-semibold text-slate-700">
                      {p.availableStock}
                    </td>

                    {/* Stock After Return (Always increases) */}
                    <td className="p-3 align-middle text-center text-sm font-bold text-green-600">
                      +{stockAfterReturn}
                    </td>

                    {/* Product Name & Details */}
                    <td className="p-3 align-middle">
                      <div className="font-semibold text-gray-800 text-sm">{p.item_name || p.name}</div>
                      {p.alias && <div className="text-xs text-gray-400">{p.alias}</div>}
                    </td>

                    {/* Reason Selector */}
                    <td className="p-3 align-middle">
                      <select
                        value={p.reason || RETURN_REASONS[0]}
                        onChange={(e) => updateReason(p._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Qty Input */}
                    <td className="p-3 text-right align-middle">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={p.qty}
                        onChange={(e) => updateQty(p._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-right w-full print:border-none print:bg-white text-sm focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Rate Input */}
                    <td className="p-3 text-right align-middle">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={p.price}
                        onChange={(e) => updatePrice(p._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-right w-full print:border-none print:bg-white text-sm focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Subtotal Input (Bidirectional sync with Price) */}
                    <td className="p-3 text-right align-middle">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={p.subtotal || ""}
                        onChange={(e) => updateSubtotal(p._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-right w-full font-semibold text-gray-900 text-sm focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Remove Action */}
                    <td className="p-3 text-center align-middle no-print">
                      <RemoveIcon onClick={() => removeProduct(p._id)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SalesReturnProductTable;