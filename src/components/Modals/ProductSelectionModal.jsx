import React from 'react';
import { useNavigate } from 'react-router';

const ProductSelectionModal = ({ setIsProductModalOpen, searchTerm, setSearchTerm, filteredProducts, selectedProduct, handleSelectProduct }) => {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={() => setIsProductModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold"
                    title="Close"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select a Product</h2>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search products by name, category, or subcategory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                    />
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center text-gray-600 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-lg">No products found matching your search criteria.</p>
                        <p className="text-sm mt-2">Try a different search term or add new products.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                        <table className="min-w-full bg-white divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit</th>
                                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product._id}
                                        className={`hover:bg-gray-50 transition duration-150 ease-in-out ${selectedProduct?._id === product._id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                                            }`}
                                    >
                                        <td className="py-3.5 px-5 font-medium text-gray-900">{product.item_name}</td>
                                        <td className="py-3.5 px-5 text-gray-700">{product.category?.name || "N/A"}</td>
                                        <td className="py-3.5 px-5 text-gray-700">{product.unit || ''}</td>
                                        <td className="py-3.5 px-5">
                                            <button
                                                onClick={() => handleSelectProduct(product)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-sm text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={selectedProduct?._id === product._id}
                                            >
                                                {selectedProduct?._id === product._id ? "Selected" : "Select This"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/categories')}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    >
                        Go to Product Management
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionModal;