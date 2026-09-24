"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

export type LayoutStyle = "modern" | "compact" | "classic";
export type ColorMode = "dark" | "light";

interface LayoutContextType {
  layout: LayoutStyle;
  colorMode: ColorMode;
  setLayout: (layout: LayoutStyle) => void;
  setColorMode: (mode: ColorMode) => void;
  isTransitioning: boolean;
}

const LayoutContext = createContext<LayoutContextType>({
  layout: "modern",
  colorMode: "dark",
  setLayout: () => {},
  setColorMode: () => {},
  isTransitioning: false,
});

export function useLayout() {
  return useContext(LayoutContext);
}

/* ─── Layout Themes ─────────────────────────────────────────────────── */

interface LayoutTheme {
  label: string;
  description: string;
  tagline: string;
  icon: string;
  layout: {
    sidebarWidth: string;
    sidebarCollapsed: string;
    cardRadius: string;
    buttonRadius: string;
    inputRadius: string;
    spacing: string;
    fontSize: string;
    topbarHeight: string;
    cardShadow: string;
    cardBorder: string;
    sidebarStyle: "floating" | "solid" | "bordered";
    headerStyle: "glass" | "solid" | "minimal";
  };
  dark: Record<string, string>;
  light: Record<string, string>;
}

export const LAYOUT_THEMES: Record<LayoutStyle, LayoutTheme> = {
  modern: {
    label: "Moderno",
    description: "Glassmorphism + gradientes",
    tagline: "Design ousado com vidro e luz",
    icon: "✦",
    layout: {
      sidebarWidth: "260px",
      sidebarCollapsed: "72px",
      cardRadius: "20px",
      buttonRadius: "14px",
      inputRadius: "14px",
      spacing: "16px",
      fontSize: "14px",
      topbarHeight: "64px",
      cardShadow: "0 4px 24px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(168,139,250,0.08)",
      cardBorder: "1px solid rgba(168,139,250,0.12)",
      sidebarStyle: "floating",
      headerStyle: "glass",
    },
    dark: {
      "--background": "#070a10",
      "--foreground": "#ececf1",
      "--card": "rgba(17,20,32,0.85)",
      "--card-foreground": "#ececf1",
      "--popover": "rgba(17,20,32,0.95)",
      "--popover-foreground": "#ececf1",
      "--primary": "#a78bfa",
      "--primary-foreground": "#070a10",
      "--secondary": "rgba(168,139,250,0.08)",
      "--secondary-foreground": "#ececf1",
      "--muted": "rgba(168,139,250,0.06)",
      "--muted-foreground": "#7a7b8e",
      "--accent": "rgba(168,139,250,0.12)",
      "--accent-foreground": "#ececf1",
      "--destructive": "#ef4444",
      "--border": "rgba(168,139,250,0.1)",
      "--input": "rgba(168,139,250,0.08)",
      "--ring": "#a78bfa",
      "--chart-1": "#a78bfa",
      "--chart-2": "#38bdf8",
      "--chart-3": "#34d399",
      "--chart-4": "#fbbf24",
      "--chart-5": "#f43f5e",
      "--sidebar": "rgba(12,14,22,0.95)",
      "--sidebar-foreground": "#ececf1",
      "--sidebar-primary": "#a78bfa",
      "--sidebar-primary-foreground": "#070a10",
      "--sidebar-accent": "rgba(168,139,250,0.1)",
      "--sidebar-accent-foreground": "#ececf1",
      "--sidebar-border": "rgba(168,139,250,0.08)",
      "--sidebar-ring": "#a78bfa",
      "--shadow-color": "168,139,250",
    },
    light: {
      "--background": "#f0f0f5",
      "--foreground": "#1a1d27",
      "--card": "rgba(255,255,255,0.9)",
      "--card-foreground": "#1a1d27",
      "--popover": "rgba(255,255,255,0.98)",
      "--popover-foreground": "#1a1d27",
      "--primary": "#7c3aed",
      "--primary-foreground": "#ffffff",
      "--secondary": "rgba(124,58,237,0.06)",
      "--secondary-foreground": "#1a1d27",
      "--muted": "rgba(124,58,237,0.04)",
      "--muted-foreground": "#5c5f6e",
      "--accent": "rgba(124,58,237,0.08)",
      "--accent-foreground": "#1a1d27",
      "--destructive": "#dc2626",
      "--border": "rgba(124,58,237,0.1)",
      "--input": "rgba(124,58,237,0.06)",
      "--ring": "#7c3aed",
      "--chart-1": "#7c3aed",
      "--chart-2": "#0284c7",
      "--chart-3": "#059669",
      "--chart-4": "#d97706",
      "--chart-5": "#be123c",
      "--sidebar": "rgba(255,255,255,0.95)",
      "--sidebar-foreground": "#1a1d27",
      "--sidebar-primary": "#7c3aed",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "rgba(124,58,237,0.06)",
      "--sidebar-accent-foreground": "#1a1d27",
      "--sidebar-border": "rgba(124,58,237,0.08)",
      "--sidebar-ring": "#7c3aed",
      "--shadow-color": "124,58,237",
    },
  },

  compact: {
    label: "Compacto",
    description: "Densidade máxima + limpeza",
    tagline: "Interface limpa e eficiente",
    icon: "◆",
    layout: {
      sidebarWidth: "220px",
      sidebarCollapsed: "56px",
      cardRadius: "10px",
      buttonRadius: "8px",
      inputRadius: "8px",
      spacing: "12px",
      fontSize: "13px",
      topbarHeight: "52px",
      cardShadow: "0 1px 4px rgba(0,0,0,0.25)",
      cardBorder: "1px solid rgba(100,116,139,0.15)",
      sidebarStyle: "solid",
      headerStyle: "minimal",
    },
    dark: {
      "--background": "#0f1117",
      "--foreground": "#e2e8f0",
      "--card": "#161922",
      "--card-foreground": "#e2e8f0",
      "--popover": "#161922",
      "--popover-foreground": "#e2e8f0",
      "--primary": "#64748b",
      "--primary-foreground": "#0f1117",
      "--secondary": "#1c2030",
      "--secondary-foreground": "#e2e8f0",
      "--muted": "#1c2030",
      "--muted-foreground": "#64748b",
      "--accent": "#232838",
      "--accent-foreground": "#e2e8f0",
      "--destructive": "#ef4444",
      "--border": "#1e2333",
      "--input": "#1c2030",
      "--ring": "#64748b",
      "--chart-1": "#64748b",
      "--chart-2": "#94a3b8",
      "--chart-3": "#475569",
      "--chart-4": "#8b5cf6",
      "--chart-5": "#f43f5e",
      "--sidebar": "#12141c",
      "--sidebar-foreground": "#e2e8f0",
      "--sidebar-primary": "#64748b",
      "--sidebar-primary-foreground": "#0f1117",
      "--sidebar-accent": "#1c2030",
      "--sidebar-accent-foreground": "#e2e8f0",
      "--sidebar-border": "#1e2333",
      "--sidebar-ring": "#64748b",
      "--shadow-color": "100,116,139",
    },
    light: {
      "--background": "#f8fafc",
      "--foreground": "#0f172a",
      "--card": "#ffffff",
      "--card-foreground": "#0f172a",
      "--popover": "#ffffff",
      "--popover-foreground": "#0f172a",
      "--primary": "#475569",
      "--primary-foreground": "#ffffff",
      "--secondary": "#f1f5f9",
      "--secondary-foreground": "#0f172a",
      "--muted": "#f1f5f9",
      "--muted-foreground": "#64748b",
      "--accent": "#e2e8f0",
      "--accent-foreground": "#0f172a",
      "--destructive": "#dc2626",
      "--border": "#e2e8f0",
      "--input": "#f1f5f9",
      "--ring": "#475569",
      "--chart-1": "#475569",
      "--chart-2": "#64748b",
      "--chart-3": "#0f766e",
      "--chart-4": "#7c3aed",
      "--chart-5": "#be123c",
      "--sidebar": "#f1f5f9",
      "--sidebar-foreground": "#0f172a",
      "--sidebar-primary": "#475569",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#e2e8f0",
      "--sidebar-accent-foreground": "#0f172a",
      "--sidebar-border": "#e2e8f0",
      "--sidebar-ring": "#475569",
      "--shadow-color": "71,85,105",
    },
  },

  classic: {
    label: "Clássico",
    description: "Elegância atemporal + tradição",
    tagline: "Sofisticação com calidez",
    icon: "◇",
    layout: {
      sidebarWidth: "260px",
      sidebarCollapsed: "68px",
      cardRadius: "6px",
      buttonRadius: "6px",
      inputRadius: "6px",
      spacing: "20px",
      fontSize: "14.5px",
      topbarHeight: "60px",
      cardShadow: "0 2px 8px rgba(0,0,0,0.18)",
      cardBorder: "1px solid rgba(120,113,108,0.15)",
      sidebarStyle: "bordered",
      headerStyle: "solid",
    },
    dark: {
      "--background": "#0e0d0b",
      "--foreground": "#e8e4de",
      "--card": "#181613",
      "--card-foreground": "#e8e4de",
      "--popover": "#181613",
      "--popover-foreground": "#e8e4de",
      "--primary": "#a89f91",
      "--primary-foreground": "#0e0d0b",
      "--secondary": "#1f1d19",
      "--secondary-foreground": "#e8e4de",
      "--muted": "#1f1d19",
      "--muted-foreground": "#78716c",
      "--accent": "#28251f",
      "--accent-foreground": "#e8e4de",
      "--destructive": "#ef4444",
      "--border": "#252220",
      "--input": "#1f1d19",
      "--ring": "#a89f91",
      "--chart-1": "#a89f91",
      "--chart-2": "#d6d3cc",
      "--chart-3": "#78716c",
      "--chart-4": "#a78bfa",
      "--chart-5": "#f43f5e",
      "--sidebar": "#141210",
      "--sidebar-foreground": "#e8e4de",
      "--sidebar-primary": "#a89f91",
      "--sidebar-primary-foreground": "#0e0d0b",
      "--sidebar-accent": "#1f1d19",
      "--sidebar-accent-foreground": "#e8e4de",
      "--sidebar-border": "#252220",
      "--sidebar-ring": "#a89f91",
      "--shadow-color": "168,159,145",
    },
    light: {
      "--background": "#f5f3ef",
      "--foreground": "#1c1917",
      "--card": "#faf9f7",
      "--card-foreground": "#1c1917",
      "--popover": "#faf9f7",
      "--popover-foreground": "#1c1917",
      "--primary": "#57534e",
      "--primary-foreground": "#faf9f7",
      "--secondary": "#e7e5e0",
      "--secondary-foreground": "#1c1917",
      "--muted": "#e7e5e0",
      "--muted-foreground": "#78716c",
      "--accent": "#d6d3cc",
      "--accent-foreground": "#1c1917",
      "--destructive": "#dc2626",
      "--border": "#d6d3cc",
      "--input": "#e7e5e0",
      "--ring": "#57534e",
      "--chart-1": "#57534e",
      "--chart-2": "#78716c",
      "--chart-3": "#0f766e",
      "--chart-4": "#7c3aed",
      "--chart-5": "#be123c",
      "--sidebar": "#eceae5",
      "--sidebar-foreground": "#1c1917",
      "--sidebar-primary": "#57534e",
      "--sidebar-primary-foreground": "#faf9f7",
      "--sidebar-accent": "#e7e5e0",
      "--sidebar-accent-foreground": "#1c1917",
      "--sidebar-border": "#d6d3cc",
      "--sidebar-ring": "#57534e",
      "--shadow-color": "87,83,78",
    },
  },
};

/* ─── Provider ──────────────────────────────────────────────────────── */

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useAuth();
  const [layout, setLayoutState] = useState<LayoutStyle>("modern");
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile?.settings) {
      const savedLayout = profile.settings.layout as LayoutStyle;
      const savedColorMode = profile.settings.color_mode as ColorMode;
      if (savedLayout && LAYOUT_THEMES[savedLayout]) setLayoutState(savedLayout);
      if (savedColorMode) setColorModeState(savedColorMode);
    }
  }, [profile?.settings]);

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  const setLayout = useCallback((newLayout: LayoutStyle) => {
    triggerTransition();
    setLayoutState(newLayout);
    const currentSettings = profile?.settings || {
      font_size: "14",
      reduce_motion: false,
      high_contrast: false,
      preferred_payment_method: "pix",
      default_tax_rate: 0,
      currency_format: "BRL",
      date_format: "DD/MM/YYYY",
      layout: "modern",
      color_mode: "dark",
    };
    updateProfile({ settings: { ...currentSettings, layout: newLayout } });
  }, [triggerTransition, updateProfile, profile?.settings]);

  const setColorMode = useCallback((newMode: ColorMode) => {
    triggerTransition();
    setColorModeState(newMode);
    const currentSettings = profile?.settings || {
      font_size: "14",
      reduce_motion: false,
      high_contrast: false,
      preferred_payment_method: "pix",
      default_tax_rate: 0,
      currency_format: "BRL",
      date_format: "DD/MM/YYYY",
      layout: "modern",
      color_mode: "dark",
    };
    updateProfile({ settings: { ...currentSettings, color_mode: newMode } });
  }, [triggerTransition, updateProfile, profile?.settings]);

  useEffect(() => {
    applyLayout(layout, colorMode);
  }, [layout, colorMode]);

  return (
    <LayoutContext.Provider value={{ layout, colorMode, setLayout, setColorMode, isTransitioning }}>
      {children}
    </LayoutContext.Provider>
  );
}

/* ─── Apply Layout ──────────────────────────────────────────────────── */

function applyLayout(layout: LayoutStyle, colorMode: ColorMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const theme = LAYOUT_THEMES[layout];
  const colors = colorMode === "dark" ? theme.dark : theme.light;
  const l = theme.layout;

  root.classList.remove("layout-modern", "layout-compact", "layout-classic");
  root.classList.add(`layout-${layout}`);

  root.style.setProperty("--sidebar-width", l.sidebarWidth);
  root.style.setProperty("--sidebar-collapsed", l.sidebarCollapsed);
  root.style.setProperty("--card-radius", l.cardRadius);
  root.style.setProperty("--button-radius", l.buttonRadius);
  root.style.setProperty("--input-radius", l.inputRadius);
  root.style.setProperty("--spacing-unit", l.spacing);
  root.style.setProperty("--font-size-base", l.fontSize);
  root.style.setProperty("--topbar-height", l.topbarHeight);
  root.style.setProperty("--card-shadow", l.cardShadow);
  root.style.setProperty("--card-border", l.cardBorder);

  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(key, value);
  }
}
