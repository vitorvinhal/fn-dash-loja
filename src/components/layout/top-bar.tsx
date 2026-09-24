"use client";

import { Bell, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CirSearch } from "@/components/recursos-prontos/cir-search";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDb } from "@/lib/db-context";

interface TopBarProps {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}

const SEARCH_ROUTES = ["/marketplace"];

interface Notif {
  id: number;
  text: string;
  time: string;
  read: boolean;
  type: "alert" | "sale" | "info";
  link: string;
}

export function TopBar({ searchValue = "", onSearchChange }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const showSearch = SEARCH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { sales, products, syncStatus, reload } = useDb();

  const notifications = useMemo<Notif[]>(() => {
    const list: Notif[] = [];
    let id = 1;

    products.forEach((p) => {
      if (p.stock <= 3) {
        list.push({
          id: id++,
          text: `Estoque baixo: ${p.description} (${p.stock} un.)`,
          time: "recente",
          read: false,
          type: "alert",
          link: `/marketplace?product=${p.id}`,
        });
      }
    });

    const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    recentSales.forEach((s) => {
      list.push({
        id: id++,
        text: `Venda: ${s.productName} - ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.totalAmount)}`,
        time: new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        read: false,
        type: "sale",
        link: `/vendas`,
      });
    });

    if (list.length === 0) {
      list.push({
        id: id++,
        text: "Tudo em dia! Sem notificações.",
        time: "agora",
        read: true,
        type: "info",
        link: "/",
      });
    }

    return list;
  }, [sales, products]);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClickNotif = (notif: Notif) => {
    router.push(notif.link);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 glass flex items-center justify-between pl-14 pr-4 md:px-6 gap-3">
      <div className="flex-1 flex items-center justify-start md:pl-10">
        {showSearch && onSearchChange ? (
          <CirSearch value={searchValue} onChange={onSearchChange} />
        ) : (
          <div />
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Sync status */}
        <button
          onClick={() => reload()}
          className="theme-toggle-btn flex items-center justify-center"
          title={syncStatus === "ok" ? "Dados sincronizados — clique para atualizar" : syncStatus === "error" ? "Erro ao sincronizar — clique para tentar novamente" : "Dados locais"}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncStatus === "ok" ? "bg-emerald-400" : "bg-rose-400"}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${syncStatus === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
          </span>
        </button>

        <ThemeToggle />
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="theme-toggle-btn relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-lg shadow-rose-500/30">
                {unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-3xl shadow-2xl shadow-black/10 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Notificações</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleClickNotif(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors text-left cursor-pointer ${!n.read ? "bg-secondary/20" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "alert" ? "bg-rose-500" : n.type === "sale" ? "bg-emerald-500" : "bg-blue-500"} ${n.read ? "opacity-30" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                            {n.text}
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">{n.time}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 mt-1 flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
