import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // default English
  const [mode, setMode] = useState("light"); // default light mode

  // Load saved settings on first mount
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    const savedMode = localStorage.getItem("mode");
    if (savedLang) setLanguage(savedLang);
    if (savedMode) {
      setMode(savedMode);
      document.documentElement.classList.toggle("dark", savedMode === "dark");
    }
  }, []);

  // Update language
  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  // Toggle dark/light mode
  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("mode", newMode);
    document.documentElement.classList.toggle("dark", newMode === "dark");
  };

  return (
    <LanguageContext.Provider
      value={{ language, mode, setLanguage: handleSetLanguage, toggleMode }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
      throw new Error("useLanguage must be used within LanguageProvider");
    }
    return context;
};
