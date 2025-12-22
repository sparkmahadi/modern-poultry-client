// ProductTable.jsx
import React from "react";

const inputClass =
  "border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-150 ease-in-out print:border-none print:bg-white";

// Small utility component for the close icon
const RemoveIcon = ({ onClick, t }) => (
  <button
    onClick={onClick}
    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors no-print"
    title={t.remove}
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

const ProductTable = ({
  t,
  search,
  setSearch,
  searchResults,
  addProduct,
  selectedProducts,
  removeProduct,
  updateQty,
  updatePrice,
}) => {
  return (
    <>
      {/* Search area - Prominent */}
      <div className="p-6 border-b relative no-print">
        <label className="text-lg font-bold block mb-2 text-blue-600">🛒 {t.searchPlaceholder}</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className={`${inputClass} text-lg`}
        />

        {searchResults.length > 0 && (
          <ul className="absolute z-50 left-6 right-6 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {searchResults.map((p) => (
              <li
                key={p._id}
                onClick={() => addProduct(p)}
                className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center transition-colors border-b"
              >
                <span className="font-medium text-gray-800">{p.item_name}</span>
                <span className="text-sm text-blue-600 font-semibold">৳ {Number(p.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Products table */}
      <div className="p-2 overflow-x-auto print-table">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs">
              <th className="p-3 text-left border-b border-gray-300 w-12">{t.sl}</th>
              <th className="p-3 text-left border-b border-gray-300 w-12">current stock</th>
              <th className="p-3 text-left border-b border-gray-300 w-12">Stock after sell</th>
              <th className="p-3 text-left border-b border-gray-300">{t.description}</th>
              <th className="p-3 text-right border-b border-gray-300 w-24">{t.qty}</th>
              <th className="p-3 text-right border-b border-gray-300 w-28">{t.price}</th>
              <th className="p-3 text-right border-b border-gray-300 w-32">{t.subtotal}</th>
              <th className="p-3 text-center border-b border-gray-300 w-16 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                  {t.noProducts}
                </td>
              </tr>
            ) : (
              selectedProducts.map((p, idx) => (
                <tr key={p._id} className="border-b hover:bg-yellow-50/50 transition-colors">
                  <td className="p-3 align-top text-gray-600">{idx + 1}</td>

                  <td>
                    {/* Display the Available Stock */}
                    <span style={{ color: p.qty > p.availableStock ? 'red' : 'green', fontWeight: 'bold', }}>
                      {p.qty > p.availableStock ? '-' : '+'}{p.availableStock}
                    </span>
                  </td>

                  <td>
                    {/* Display the Available Stock */}
                    <span style={{ color: p.qty > p.availableStock ? 'red' : 'green', fontWeight: 'bold', }}>
                      {(p.availableStock - p.qty) || "-"}
                    </span>
                  </td>

                  <td className="p-3 align-top">
                    <div className="font-semibold text-gray-800">{p.item_name || p?.name}</div>
                    {p.alias && <div className="text-xs text-gray-500">{p.alias}</div>}
                  </td>

                  <td className="p-3 text-right align-top">
                    <input
                      type="number"
                      min="0"
                      value={p.qty}
                      onChange={(e) => updateQty(p._id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-right w-full print:border-none print:bg-white print:font-semibold"
                    />
                  </td>

                  <td className="p-3 text-right align-top">
                    <input
                      type="number"
                      min="0"
                      value={p.price}
                      onChange={(e) => updatePrice(p._id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-right w-full print:border-none print:bg-white print:font-semibold"
                    />
                  </td>

                  <td className="p-3 text-right align-top font-semibold text-gray-900">৳ {Number(p.subtotal || 0).toFixed(2)}</td>

                  <td className="p-3 text-center align-top no-print">
                    <RemoveIcon onClick={() => removeProduct(p._id)} t={t} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ProductTable;