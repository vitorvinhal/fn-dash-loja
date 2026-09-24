"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("fn-dash-theme") as Theme | null;
    const mode = saved || "dark";
    setTheme(mode);
    document.documentElement.classList.remove("dark", "light", "mode-dark", "mode-light");
    document.documentElement.classList.add(mode);
    document.documentElement.classList.add(`mode-${mode}`);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("fn-dash-theme", next);
    localStorage.setItem("fn_dash_color_mode", next);
    document.documentElement.classList.remove("dark", "light", "mode-dark", "mode-light");
    document.documentElement.classList.add(next);
    document.documentElement.classList.add(`mode-${next}`);
  };

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
