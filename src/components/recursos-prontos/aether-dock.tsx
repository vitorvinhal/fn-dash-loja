"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

interface AetherDockProps {
  extraAction?: () => void;
}

const items = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/marketplace", icon: Package, label: "Produtos" },
  { href: "/vendas", icon: DollarSign, label: "Vendas" },
  { href: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { href: "/configuracoes", icon: Settings, label: "Config" },
];

export function AetherDock({ extraAction }: AetherDockProps) {
  const pathname = usePathname();

  return (
    <nav className="aether-dock" role="toolbar" aria-label="Navegação">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className="aether-dock__chip"
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon width={20} height={20} />
            {isActive && (
              <motion.div
                layoutId="dock-active"
                className="aether-dock__indicator"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </Link>
        );
      })}
      <span className="aether-dock__divider" />
      <button
        className="aether-dock__btn"
        type="button"
        aria-label="Ação rápida"
        onClick={extraAction}
      >
        <Plus width={18} height={18} />
      </button>
    </nav>
  );
}
