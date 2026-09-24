"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDb } from "@/lib/db-context";
import { supabase } from "@/lib/supabase";
import { PAYMENT_LABELS, PaymentMethod } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, Package, Trash2, CalendarDays, BarChart3, PieChart as PieIcon, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalendarWidget } from "@/components/recursos-prontos/calendar-widget";

const COLORS = ["#a78bfa", "#22d3ee", "#fb923c", "#f472b6", "#34d399", "#facc15"];
const TICK_COLOR = "#9ca3af";
const GRID_COLOR = "#1f2030";

const CHANNEL_COLORS: Record<string, string> = {
  "Loja Física": "#22c55e",
  "Shopee": "#f97316",
  "TikTok Shop": "#3b82f6",
  "Online": "#8b5cf6",
};

function ChartTooltip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3 shadow-2xl" style={{ background: "#1a1b2e", border: "1px solid #2a2b3e" }}>
      <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: "#f3f4f6" }}>
          {fmt ? fmt(e.value) : e.value.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
}

type ViewMode = "dia" | "semana" | "mes";

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfWeek(d: Date) {
  const r = startOfWeek(d);
  r.setDate(r.getDate() + 6);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
}

export default function VendasPage() {
  const [activeChannel, setActiveChannel] = useState<string>("todos");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("mes");
  const { sales, deleteSale, products } = useDb();
  const [profileMap, setProfileMap] = useState<Record<string, { avatar?: string; username?: string }>>({});

  // Load profiles for avatar lookup
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("username, avatar");
        if (data) {
          const map: Record<string, { avatar?: string; username?: string }> = {};
          for (const p of data) {
            if (p.username) map[p.username] = { avatar: p.avatar || undefined, username: p.username };
          }
          setProfileMap(map);
        }
      } catch {}
    })();
  }, []);

  const channels = useMemo(() => {
    return ["todos", ...new Set(sales.map((s) => s.channel))];
  }, [sales]);

  const dateRange = useMemo(() => {
    if (viewMode === "dia") {
      return { start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()), end: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999) };
    }
    if (viewMode === "semana") {
      return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
    }
    return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
  }, [selectedDate, viewMode]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = parseDate(s.date);
      const matchDate = d >= dateRange.start && d <= dateRange.end;
      const matchChannel = activeChannel === "todos" || s.channel === activeChannel;
      return matchDate && matchChannel;
    });
  }, [sales, activeChannel, dateRange]);

  const totalVendas = filteredSales.reduce((s, v) => s + v.totalAmount, 0);
  const totalLucro = filteredSales.reduce((s, v) => s + v.profit, 0);

  const salesByChannel = Object.entries(
    filteredSales.reduce((acc, s) => { acc[s.channel] = (acc[s.channel] || 0) + s.totalAmount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const salesByPayment = Object.entries(
    filteredSales.reduce((acc, s) => { acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.totalAmount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: PAYMENT_LABELS[name as PaymentMethod] || name, value }));

  const salesByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredSales.forEach((s) => {
      const product = products.find((p) => p.id === s.productId);
      const cat = product?.category || "Outro";
      catMap[cat] = (catMap[cat] || 0) + s.totalAmount;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [filteredSales, products]);

  const getProductImage = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.images?.[0] || null;
  };

  const viewLabel = viewMode === "dia"
    ? selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : viewMode === "semana"
    ? `${dateRange.start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${dateRange.end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
    : selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const tickStyle = { fill: TICK_COLOR, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Vendas</h1>
              <p className="text-sm" style={{ color: "#9ca3af" }}>Análise de vendas por período</p>
            </div>
          </motion.div>

          {/* View mode tabs + date label */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex bg-secondary rounded-2xl p-1">
              {(["dia", "semana", "mes"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {mode === "dia" ? "Dia" : mode === "semana" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#9ca3af" }}>
              <CalendarDays className="w-4 h-4" />
              <span className="font-medium">{viewLabel}</span>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Vendas", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalVendas), sub: `${filteredSales.length} vendas`, icon: DollarSign, iconColor: "#a78bfa" },
              { label: "Lucro Total", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalLucro), sub: "", icon: TrendingUp, iconColor: "#34d399" },
              { label: "Ticket Médio", value: filteredSales.length > 0 ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalVendas / filteredSales.length) : "R$ 0,00", sub: "", icon: Package, iconColor: "#22d3ee" },
              { label: "Margem", value: totalVendas > 0 ? `${((totalLucro / totalVendas) * 100).toFixed(1)}%` : "0%", sub: "", icon: TrendingUp, iconColor: "#fb923c" },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Card className="bg-card rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>{kpi.label}</span>
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.iconColor }} />
                    </div>
                    <div className="text-xl font-bold text-foreground">{kpi.value}</div>
                    {kpi.sub && <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{kpi.sub}</div>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
              <Card className="bg-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "#9ca3af" }}>
                    <BarChart3 className="w-4 h-4" /> Vendas por Canal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salesByChannel.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={salesByChannel} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.6} />
                        <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip fmt={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1000} maxBarSize={48}>
                          {salesByChannel.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm py-10 text-center" style={{ color: "#6b7280" }}>Sem dados neste período</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-card h-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "#9ca3af" }}>
                    <PieIcon className="w-4 h-4" /> Por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {salesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4} isAnimationActive animationDuration={1200} stroke="#10111a" strokeWidth={3}>
                          {salesByCategory.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip fmt={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm py-10" style={{ color: "#6b7280" }}>Sem dados</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Payment + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
              <Card className="bg-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Por Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesByPayment.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={salesByPayment} layout="vertical" barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.6} horizontal={false} />
                        <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" tick={tickStyle} axisLine={false} tickLine={false} width={130} />
                        <Tooltip content={<ChartTooltip fmt={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={1000} maxBarSize={36}>
                          {salesByPayment.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm py-10 text-center" style={{ color: "#6b7280" }}>Sem dados</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="bg-card h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Calendário</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <CalendarWidget selectedDate={selectedDate} onSelect={(d) => { if (d) { setSelectedDate(d); setViewMode("dia"); } else { setSelectedDate(new Date()); setViewMode("mes"); } }} />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sales History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-card rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Histórico de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="channel-tabs mb-4">
                  {channels.map((ch) => (
                    <button
                      key={ch}
                      className={`channel-tab ${activeChannel === ch ? "is-active" : ""}`}
                      onClick={() => setActiveChannel(ch)}
                    >
                      {ch === "todos" ? "Todos" : ch}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredSales.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 text-sm" style={{ color: "#6b7280" }}>
                        Nenhuma venda encontrada
                      </motion.div>
                    ) : (
                      filteredSales.map((sale, i) => {
                        const img = getProductImage(sale.productId);
                        return (
                          <motion.div
                            key={sale.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: i * 0.03 }}
                            className="sale-card group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-secondary flex-shrink-0">
                                {img ? (
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={16} style={{ color: "#6b7280" }} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-foreground font-semibold text-sm truncate">{sale.productName}</div>
                                <div className="flex items-center gap-2 text-xs" style={{ color: "#9ca3af" }}>
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHANNEL_COLORS[sale.channel] || "#8b5cf6" }} />
                                  {sale.channel} · {sale.qty}x
                                  {sale.registeredBy && (
                                    <span className="text-muted-foreground/60 flex items-center gap-1">·
                                      {(sale.registeredByAvatar || profileMap[sale.registeredBy]?.avatar) ? (
                                        <img src={sale.registeredByAvatar || profileMap[sale.registeredBy]?.avatar} alt="" className="w-3 h-3 rounded-full object-cover" />
                                      ) : (
                                        <span className="w-3 h-3 rounded-full bg-accent/20 inline-flex items-center justify-center text-accent text-[6px] font-bold">{(sale.registeredBy || "U").charAt(0).toUpperCase()}</span>
                                      )}
                                      {sale.registeredBy}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-center hidden sm:block" style={{ color: "#6b7280" }}>
                              {parseDate(sale.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </div>

                            <div className="text-sm font-bold text-foreground text-right min-w-[90px]">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.totalAmount)}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`sale-row__badge sale-row__badge--${sale.paymentMethod}`}>
                                {PAYMENT_LABELS[sale.paymentMethod]}
                              </span>
                              <button
                                onClick={() => deleteSale(sale.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive p-1 rounded-xl hover:bg-destructive/10"
                                style={{ color: "#6b7280" }}
                                aria-label="Remover venda"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
