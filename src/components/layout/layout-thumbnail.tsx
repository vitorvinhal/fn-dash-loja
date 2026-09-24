"use client";

import { LayoutStyle, ColorMode, LAYOUT_THEMES } from "@/lib/layout-context";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface LayoutThumbnailProps {
  layout: LayoutStyle;
  colorMode: ColorMode;
  isSelected: boolean;
  onClick: () => void;
}

export function LayoutThumbnail({ layout, colorMode, isSelected, onClick }: LayoutThumbnailProps) {
  const theme = LAYOUT_THEMES[layout];
  const isDark = colorMode === "dark";
  const l = theme.layout;

  const palette = {
    modern: {
      dark: { sidebar: "#0c0e16", bg: "#070a10", card: "#111420", accent: "#a78bfa", text: "#ececf1", muted: "#52525b", border: "rgba(168,139,250,0.1)" },
      light: { sidebar: "#fafaff", bg: "#f0f0f5", card: "#ffffff", accent: "#7c3aed", text: "#1a1d27", muted: "#a1a1aa", border: "rgba(124,58,237,0.1)" },
    },
    compact: {
      dark: { sidebar: "#12141c", bg: "#0f1117", card: "#161922", accent: "#64748b", text: "#e2e8f0", muted: "#475569", border: "rgba(100,116,139,0.15)" },
      light: { sidebar: "#f1f5f9", bg: "#f8fafc", card: "#ffffff", accent: "#475569", text: "#0f172a", muted: "#94a3b8", border: "rgba(71,85,105,0.12)" },
    },
    classic: {
      dark: { sidebar: "#141210", bg: "#0e0d0b", card: "#181613", accent: "#a89f91", text: "#e8e4de", muted: "#78716c", border: "rgba(120,113,108,0.15)" },
      light: { sidebar: "#eceae5", bg: "#f5f3ef", card: "#faf9f7", accent: "#57534e", text: "#1c1917", muted: "#a8a29e", border: "rgba(120,113,108,0.12)" },
    },
  };

  const p = palette[layout][colorMode];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-col items-center gap-0 p-0 rounded-2xl border-2 transition-all overflow-hidden group",
        isSelected
          ? "border-[var(--ring)] shadow-lg"
          : "border-[var(--border)] hover:border-[var(--ring)]/40"
      )}
      style={{
        boxShadow: isSelected
          ? `0 0 20px -4px ${p.accent}33, 0 4px 16px -4px rgba(0,0,0,0.3)`
          : "0 2px 8px -2px rgba(0,0,0,0.2)",
      }}
    >
      {/* Mini Browser Chrome */}
      <div
        className="w-full flex items-center gap-1 px-2 py-1"
        style={{ background: p.sidebar }}
      >
        <div className="flex gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div
          className="flex-1 h-1 rounded-full mx-1"
          style={{ background: p.border }}
        />
      </div>

      {/* Mini Layout Preview */}
      <div
        className="w-full aspect-[5/4] flex relative overflow-hidden"
        style={{ background: p.bg }}
      >
        {/* Sidebar */}
        <motion.div
          className="h-full flex flex-col gap-px relative"
          style={{
            width: layout === "compact" ? "22%" : layout === "classic" ? "26%" : "24%",
            background: p.sidebar,
            borderRight: layout === "classic" ? `1px solid ${p.border}` : "none",
          }}
          initial={false}
          animate={{
            width: layout === "compact" ? "22%" : layout === "classic" ? "26%" : "24%",
          }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {/* Logo */}
          <div className="px-2 py-1.5 flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-md flex items-center justify-center"
              style={{ background: p.accent }}
            >
              <span className="text-[4px] font-black" style={{ color: isDark ? "#070a10" : "#ffffff" }}>FN</span>
            </div>
            <div className="h-1 w-6 rounded-full" style={{ background: p.text, opacity: 0.6 }} />
          </div>

          {/* Nav Items */}
          <div className="px-1.5 flex flex-col gap-0.5">
            {[0.8, 0.6, 0.5, 0.4].map((opacity, i) => (
              <motion.div
                key={i}
                className="rounded-md flex items-center gap-1 px-1.5 py-1"
                style={{
                  background: i === 0 ? `${p.accent}18` : "transparent",
                  opacity: 1,
                }}
                initial={false}
                animate={{
                  background: i === 0 ? `${p.accent}18` : "transparent",
                }}
              >
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ background: i === 0 ? p.accent : p.muted, opacity }}
                />
                <div
                  className="h-0.5 rounded-full"
                  style={{
                    background: i === 0 ? p.accent : p.muted,
                    opacity,
                    width: `${40 + i * 8}%`,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Floating sidebar effect for modern */}
          {layout === "modern" && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${p.accent}05 0%, transparent 50%)`,
              }}
            />
          )}
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative">
          {/* Topbar */}
          <div
            className="flex items-center justify-between px-2 py-1"
            style={{
              borderBottom: `1px solid ${p.border}`,
              backdropFilter: layout === "modern" ? "blur(8px)" : "none",
              background: layout === "modern" ? `${p.bg}cc` : p.bg,
            }}
          >
            <div className="h-1 w-8 rounded-full" style={{ background: p.text, opacity: 0.4 }} />
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: p.muted, opacity: 0.3 }} />
              <div className="w-2 h-2 rounded-full" style={{ background: p.accent, opacity: 0.5 }} />
            </div>
          </div>

          {/* KPI Row */}
          <div className="flex gap-px p-1.5">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-lg p-1.5 flex flex-col gap-0.5"
                style={{
                  background: p.card,
                  border: `1px solid ${p.border}`,
                  borderRadius: l.cardRadius,
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className="h-0.5 w-4 rounded-full" style={{ background: p.muted, opacity: 0.4 }} />
                <div className="h-1.5 w-6 rounded-full" style={{ background: p.text, opacity: 0.7 }} />
              </motion.div>
            ))}
          </div>

          {/* Chart + Table area */}
          <div className="flex-1 flex gap-px p-1.5 pt-0">
            <div
              className="flex-1 rounded-lg p-1.5 relative overflow-hidden"
              style={{
                background: p.card,
                border: `1px solid ${p.border}`,
                borderRadius: l.cardRadius,
              }}
            >
              {/* Fake chart bars */}
              <div className="flex items-end gap-0.5 h-full pb-1">
                {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.55].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{ background: `${p.accent}40` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.04, duration: 0.4, ease: "easeOut" }}
                  />
                ))}
              </div>
            </div>
            <div className="w-2/5 flex flex-col gap-px">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 rounded-lg p-1 flex items-center gap-1"
                  style={{
                    background: p.card,
                    border: `1px solid ${p.border}`,
                    borderRadius: l.cardRadius,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.accent, opacity: 0.5 }} />
                  <div className="flex-1">
                    <div className="h-0.5 w-full rounded-full mb-0.5" style={{ background: p.muted, opacity: 0.3 }} />
                    <div className="h-0.5 w-2/3 rounded-full" style={{ background: p.muted, opacity: 0.2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Label + Check */}
      <div
        className="w-full flex items-center justify-between px-3 py-2"
        style={{ background: p.sidebar }}
      >
        <div className="text-left">
          <div className="text-xs font-bold" style={{ color: p.text }}>
            {theme.icon} {theme.label}
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: p.muted }}>
            {theme.description}
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{
            scale: isSelected ? 1 : 0,
            opacity: isSelected ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: p.accent }}
        >
          <Check className="w-3 h-3" style={{ color: isDark ? "#070a10" : "#ffffff" }} />
        </motion.div>
      </div>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${p.accent}12, transparent 60%)`,
        }}
      />
    </motion.button>
  );
}
