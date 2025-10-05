import React from 'react';

const ProductRow = ({ product, index, updateProductField, removeProduct }) => {
  const subtotal = (Number(product.qty || 0) * Number(product.purchase_price || 0)).toFixed(2);

  return (
    <tr className="hover:bg-blue-50/50">
      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
      <td className="px-4 py-3 text-center">
        <input
          type="number"
          min="1"
          value={product.qty}
          onChange={(e) => updateProductField(index, 'qty', e.target.value)}
          className="border border-gray-300 rounded-md p-1 w-20 text-center focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <input
          type="number"
          min="0"
          value={product.purchase_price}
          onChange={(e) => updateProductField(index, 'purchase_price', e.target.value)}
          className="border border-gray-300 rounded-md p-1 w-24 text-right focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3 text-right font-semibold text-gray-800">
        {subtotal}
      </td>
      <td className="px-4 py-3 text-center">
        <button 
          type="button" 
          onClick={() => removeProduct(index)} 
          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
        >
            {/* Trash/Remove Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </td>
    </tr>
  );
};

export default ProductRow;