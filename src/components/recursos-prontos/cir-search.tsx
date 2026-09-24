"use client";

import { Search, Command } from "lucide-react";

interface CirSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function CirSearch({
  value,
  onChange,
  placeholder = "Buscar produtos, vendas...",
  onKeyDown,
  onFocus,
  onBlur,
}: CirSearchProps) {
  return (
    <label className="cir-search">
      <Search className="cir-search__icon" />
      <input
        className="cir-search__field"
        type="search"
        placeholder={placeholder}
        aria-label="Buscar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <kbd className="cir-search__kbd">
        <Command size={10} /> K
      </kbd>
    </label>
  );
}
