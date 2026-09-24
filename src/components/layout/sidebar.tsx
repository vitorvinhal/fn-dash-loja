"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  LogOut,
  Receipt,
  FolderTree,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useDb } from "@/lib/db-context";

const navItems = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/marketplace", label: "Produtos", icon: Store },
  { href: "/categorias", label: "Categorias", icon: FolderTree },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { categories } = useDb();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const categoryTree = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  const getChildren = (parentId: string) => {
    return categories.filter((c) => c.parent_id === parentId);
  };

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-card border border-border rounded-xl p-2.5 text-muted-foreground hover:text-foreground transition-colors shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[55] md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar flex flex-col z-[60] transition-all duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ width: "var(--sidebar-width, 260px)" }}
      >
        <div className="flex items-center justify-between px-5 h-16">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all group-hover:scale-105">
              <span className="text-white font-black text-sm tracking-tighter">FN</span>
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-bold text-base tracking-tight leading-tight">FN Dash</span>
              <span className="text-muted-foreground text-[10px] leading-tight">Controle de Loja</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-foreground border border-violet-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-xl border border-violet-500/20"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 relative z-10", active && "text-violet-500")} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}

          {/* Categories with subcategories */}
          {categoryTree.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Categorias
              </div>
              {categoryTree.map((cat) => {
                const children = getChildren(cat.id);
                const hasChildren = children.length > 0;
                const isExpanded = expandedCats.has(cat.id);
                const active = pathname === `/categorias` && pathname.includes(`cat=${cat.id}`);

                return (
                  <div key={cat.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                        active
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                      onClick={() => {
                        if (hasChildren) toggleExpand(cat.id);
                        else window.location.href = `/categorias?cat=${cat.id}`;
                      }}
                    >
                      {hasChildren ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      ) : (
                        <div className="w-4" />
                      )}
                      <span className="text-base">{cat.icon}</span>
                      <span className="flex-1 truncate">{cat.name}</span>
                      {hasChildren && (
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                          {children.length}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && hasChildren && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 space-y-0.5">
                            {children.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/categorias?cat=${sub.id}`}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                  pathname === `/categorias` && pathname.includes(`cat=${sub.id}`)
                                    ? "bg-secondary text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                              >
                                <span className="text-sm">{sub.icon}</span>
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="px-3 py-3 space-y-1">
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                pathname === "/admin"
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-foreground border border-amber-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Shield className={cn("w-5 h-5", pathname === "/admin" && "text-amber-500")} />
              Admin
            </Link>
          )}
          <Link
            href="/configuracoes"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === "/configuracoes"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (profile?.username || profile?.email || "?")[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{profile?.username || profile?.email?.split("@")[0]}</div>
              <div className="text-[10px] text-muted-foreground truncate">{profile?.role === "admin" ? "Administrador" : "Usuário"}</div>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-secondary" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
