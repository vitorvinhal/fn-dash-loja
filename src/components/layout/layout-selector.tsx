"use client";

import { useLayout, LayoutStyle, ColorMode, LAYOUT_THEMES } from "@/lib/layout-context";
import { LayoutThumbnail } from "./layout-thumbnail";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles, LayoutGrid, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export function LayoutSelector() {
  const { layout, colorMode, setLayout, setColorMode, isTransitioning } = useLayout();
  const currentTheme = LAYOUT_THEMES[layout];

  const layouts: LayoutStyle[] = ["modern", "compact", "classic"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-[var(--ring)]" />
        <h4 className="text-foreground text-sm font-bold tracking-tight">Layout do Sistema</h4>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {layouts.map((l, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <LayoutThumbnail
              layout={l}
              colorMode={colorMode}
              isSelected={layout === l}
              onClick={() => setLayout(l)}
            />
          </motion.div>
        ))}
      </div>

      {/* Color Mode Toggle — Segmented Control */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-[var(--ring)]" />
          <h4 className="text-foreground text-sm font-bold tracking-tight">Modo de Cor</h4>
        </div>
        <div
          className="relative flex rounded-2xl p-1"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Sliding indicator */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-xl"
            style={{
              background: "var(--ring)",
              boxShadow: "0 2px 8px var(--ring)",
            }}
            initial={false}
            animate={{
              left: colorMode === "dark" ? "4px" : "calc(50% + 0px)",
              right: colorMode === "dark" ? "calc(50% + 0px)" : "4px",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />

          <button
            onClick={() => setColorMode("dark")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold relative z-10 transition-colors duration-200",
              colorMode === "dark" ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Moon className="w-4 h-4" />
            <span>Escuro</span>
          </button>

          <button
            onClick={() => setColorMode("light")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold relative z-10 transition-colors duration-200",
              colorMode === "light" ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="w-4 h-4" />
            <span>Claro</span>
          </button>
        </div>
      </div>

      {/* Current Layout Info Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${layout}-${colorMode}`}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: "var(--ring)",
                color: colorMode === "dark" ? "#070a10" : "#ffffff",
              }}
            >
              {currentTheme.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-bold">{currentTheme.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--ring)", color: colorMode === "dark" ? "#070a10" : "#ffffff" }}>
                  {colorMode === "dark" ? "🌙" : "☀️"} {colorMode === "dark" ? "Dark" : "Light"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs mt-1">{currentTheme.tagline}</p>

              {/* Layout specs */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "Sidebar", value: currentTheme.layout.sidebarWidth },
                  { label: "Raio", value: currentTheme.layout.cardRadius },
                  { label: "Fonte", value: currentTheme.layout.fontSize },
                ].map((spec) => (
                  <span
                    key={spec.label}
                    className="text-[10px] px-2 py-0.5 rounded-lg font-mono"
                    style={{
                      background: "var(--background)",
                      color: "var(--muted-foreground)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {spec.label}: {spec.value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subtle gradient overlay */}
          <div
            className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20"
            style={{
              background: `radial-gradient(circle, var(--ring) 0%, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
