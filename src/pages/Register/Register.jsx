import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/Spinner/LoadingSpinner";
import { useNavigate } from "react-router";
import API from "../../lib/api";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        setError("");
        console.log(form);
        try {
            const res = await API.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, form);
            setForm({ username: "", name: "", email: "", password: "" });
            toast.success(res.data.message);
            toast.info("Please login");
            navigate("/login");
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
            toast.error(err.response?.data?.message);
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-semibold text-center">Register</h2>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 border rounded"
                />

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 border rounded"
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 border rounded"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 border rounded"
                />

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                >
                    Register
                </button>
            </form>
        </div>
    );
}
