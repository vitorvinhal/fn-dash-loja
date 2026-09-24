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

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("fn-dash-theme") as Theme) || "dark";
}

function applyThemeClasses(mode: Theme) {
  document.documentElement.classList.remove("dark", "light", "mode-dark", "mode-light");
  document.documentElement.classList.add(mode);
  document.documentElement.classList.add(`mode-${mode}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyThemeClasses(getInitialTheme());
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("fn-dash-theme", next);
    localStorage.setItem("fn_dash_color_mode", next);
    applyThemeClasses(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
