import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import API from "../../lib/api";
import React from "react";

export default function LoginPage() {
    const { userInfo, isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); // loader state

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const toastId = toast.loading("Logging in...");

        try {
            const res = await API.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
                form
            );

            localStorage.setItem("token", res.data.token);
            await login(); // make sure it's awaited so userInfo is ready


            toast.update(toastId, {
                render: `Welcome back, ${res.data.username}!`,
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            navigate("/dashboard");
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Login failed";
            setError(errorMsg);

            toast.update(toastId, {
                render: errorMsg,
                type: "error",
                isLoading: false,
                autoClose: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-semibold text-center">Login</h2>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <input
                    type="text"
                    name="identifier"
                    placeholder="Username or Email"
                    value={form.identifier}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 border rounded"
                    disabled={loading}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 border rounded"
                    disabled={loading}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-blue-600 text-white py-2 rounded transition ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                            </svg>
                            Logging in...
                        </span>
                    ) : (
                        "Login"
                    )}
                </button>

                <p className="mt-4 text-sm text-center">
                    Don&apos;t have an account?{" "}
                    <a href="/register" className="text-blue-600 hover:underline">
                        Register
                    </a>
                </p>
            </form>
        </div>
    );
}
