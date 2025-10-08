import { createContext, useContext, useEffect, useState, } from "react";
import React from "react";
import { toast } from "react-toastify";
import API from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      getUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

const login = async () => {
  const token = localStorage.getItem("token");
  if (token) {
    setIsAuthenticated(true);
    await getUserInfo(token); // <-- Fetch and set userInfo
  }
};

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUserInfo(null); // Reset user info on logout
  };

  const getUserInfo = async (token) => {
    try {
      setLoading(true); // Set loading true while fetching user info
      const response = await API.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserInfo(response.data); // Store user info in state
      setLoading(false); // Set loading to false once user info is fetched
    } catch (error) {
      toast.error("User is not found. Please logout and login again!!!");
      toast.error(error?.message);
      setUserInfo(null); // Reset user info if error occurs
      setLoading(false); // Set loading to false even on error
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userInfo, getUserInfo, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
