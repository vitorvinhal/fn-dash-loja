"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDb } from "@/lib/db-context";
import { calcUnitProfit, calcMargin } from "@/data/products";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#a78bfa", "#22d3ee", "#fb923c", "#f472b6"];
const TICK_COLOR = "#9ca3af";
const GRID_COLOR = "#1f2030";

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

export default function RelatoriosPage() {
  const { products, sales, categories } = useDb();
  const incomeProducts = products.filter((p) => p.type === "income");
  const totalReceita = incomeProducts.reduce((s, p) => s + p.amount, 0);
  const totalCusto = incomeProducts.reduce((s, p) => s + p.cost, 0);
  const totalLucro = incomeProducts.reduce((s, p) => s + calcUnitProfit(p.amount, p.cost, p.commissionPct, p.shipping), 0);

  const categoryData = Object.entries(
    incomeProducts.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + p.amount; return acc; }, {} as Record<string, number>)
  ).map(([name, amount]) => {
    const cat = categories.find((c) => c.name === name);
    return { name: cat ? `${cat.icon} ${name}` : name, rawName: name, amount };
  }).sort((a, b) => b.amount - a.amount);

  // Top 5 products by actual sales revenue
  const topProducts = Object.values(
    sales.reduce((acc, s) => {
      if (!acc[s.productId]) acc[s.productId] = { id: s.productId, name: s.productName, totalRevenue: 0, totalQty: 0, channel: s.channel, category: "" };
      acc[s.productId].totalRevenue += s.totalAmount;
      acc[s.productId].totalQty += s.qty;
      return acc;
    }, {} as Record<string, { id: string; name: string; totalRevenue: number; totalQty: number; channel: string; category: string }>)
  )
    .map((s) => {
      const prod = products.find((p) => p.id === s.id);
      return { ...s, category: prod?.category || "", cost: prod?.cost || 0, commissionPct: prod?.commissionPct || 0, shipping: prod?.shipping || 0 };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const channelData = [
    { name: "Loja Física", amount: sales.filter((s) => s.channel === "Loja Física").reduce((s, x) => s + x.totalAmount, 0) || 0 },
    { name: "Online", amount: sales.filter((s) => s.channel === "Online").reduce((s, x) => s + x.totalAmount, 0) || 0 },
    { name: "Shopee", amount: sales.filter((s) => s.channel === "Shopee").reduce((s, x) => s + x.totalAmount, 0) || 0 },
    { name: "TikTok Shop", amount: sales.filter((s) => s.channel === "TikTok Shop").reduce((s, x) => s + x.totalAmount, 0) || 0 },
  ];

  const tickStyle = { fill: TICK_COLOR, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold text-foreground mb-1">Relatórios</h1>
              <p className="text-sm" style={{ color: "#9ca3af" }}>Análise detalhada do seu negócio</p>
            </motion.div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-cyan-400 text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Receita Total", value: totalReceita, iconColor: "#a78bfa" },
              { label: "Custo Total", value: totalCusto, iconColor: "#fb923c" },
              { label: "Lucro Real", value: totalLucro, iconColor: "#34d399" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-card">
                  <CardContent className="p-5">
                    <div className="text-sm mb-1 font-medium" style={{ color: "#9ca3af" }}>{item.label}</div>
                    <div className="text-2xl font-bold text-foreground">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-card overflow-hidden">
                <CardHeader><CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Receita por Categoria</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryData} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.6} />
                      <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip fmt={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card overflow-hidden">
                <CardHeader><CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Canais de Venda</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={channelData} cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={4} dataKey="amount" nameKey="name" stroke="#10111a" strokeWidth={3}>
                        {channelData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4 mt-2 justify-center">
                    {channelData.map((ch, i) => (
                      <div key={ch.name} className="flex items-center gap-2 text-xs" style={{ color: "#9ca3af" }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {ch.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-card overflow-hidden">
              <CardHeader><CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Top 5 Produtos por Receita</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs" style={{ color: "#6b7280" }}>{p.category} · {p.channel} · {p.totalQty}x vendidos</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-foreground text-sm font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.totalRevenue)}</div>
                        {p.cost > 0 && <div className="text-xs font-medium" style={{ color: "#34d399" }}>Margem: {calcMargin(p.totalRevenue, p.totalQty, p.cost, p.commissionPct, p.shipping).toFixed(1)}%</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
