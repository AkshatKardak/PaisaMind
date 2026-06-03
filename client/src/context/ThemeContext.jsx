import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("paisamind-theme");
      if (saved) return saved === "dark";
    } catch (_) {}
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    const theme = isDark ? "dark" : "light";
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    try {
      localStorage.setItem("paisamind-theme", theme);
    } catch (_) {}
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setTheme = (theme) => setIsDark(theme === "dark");

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
