import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const UniversalSelector = ({
    label = "Select",
    placeholder = "Search...",
    apiUrl,
    onSelect,
    selectedItem,
    displayKey = "name",
    disabled = false
}) => {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!search.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}?search=${search}`);
            setResults(res.data.data || []);
        } catch (err) {
            console.error("Search error:", err);
        }
        setLoading(false);
    }, [search]);

    useEffect(() => {
        if (search.length > 1) {
            const t = setTimeout(() => handleSearch(), 300);
            return () => clearTimeout(t);
        }
    }, [search, handleSearch]);

    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>

            {/* Input box */}
            <input
                type="text"
                value={selectedItem ? selectedItem[displayKey] : search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                }}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full border rounded-md p-2 bg-white"
            />

            {/* Dropdown */}
            {open && (
                <div className="absolute z-20 w-full bg-white border rounded-md mt-1 max-h-56 overflow-auto shadow-lg">
                    {loading && (
                        <p className="p-2 text-gray-500">Searching...</p>
                    )}

                    {!loading && results.length === 0 && search.length > 1 && (
                        <p className="p-2 text-gray-500">No results found</p>
                    )}

                    {results.map((item) => (
                        <div
                            key={item._id}
                            className="p-2 hover:bg-indigo-50 cursor-pointer"
                            onClick={() => {
                                onSelect(item);
                                setOpen(false);
                            }}
                        >
                            {item[displayKey]}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UniversalSelector;
