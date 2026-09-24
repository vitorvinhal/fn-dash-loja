"use client";

import { useTheme } from "./theme-provider";
import { useLayout } from "@/lib/layout-context";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { setColorMode } = useLayout();

  const handleToggle = () => {
    toggle();
    setColorMode(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={handleToggle}
      className="theme-toggle-btn"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? (
        <Moon className="w-[18px] h-[18px]" />
      ) : (
        <Sun className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
