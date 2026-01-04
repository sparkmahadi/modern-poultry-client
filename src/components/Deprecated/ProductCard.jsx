import React from 'react';
import { useNavigate } from 'react-router';

const ProductCard = ({ product, categories }) => {
    const navigate = useNavigate();
    return (
        <div key={product.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.item_name}</h3>
                <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">ID:</span> {product.id}
                </p>
                <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Category:</span> {categories.find(c => c.id === product.category_id)?.name || product.category_id}
                </p>
                <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Unit:</span> {product.unit}
                </p>
                <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Price/Unit:</span> ${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-gray-700 text-sm mb-3">
                    <span className="font-semibold">Date:</span> {product.date}
                </p>
                {product.notes && (
                    <p className="text-gray-600 text-xs italic mb-3">
                        <span className="font-semibold">Notes:</span> {product.notes}
                    </p>
                )}
            </div>
            <button
                onClick={() => navigate(`/products/details/${product.id}`)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out w-full mt-4"
            >
                View Details
            </button>
        </div>
    );
};

export default ProductCard;