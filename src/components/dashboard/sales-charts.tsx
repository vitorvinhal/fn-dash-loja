"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useDb } from "@/lib/db-context";
import { calcMargin } from "@/data/products";

const COLORS = ["#a78bfa", "#22d3ee", "#fb923c", "#f472b6", "#34d399", "#facc15"];
const TICK_COLOR = "#9ca3af";
const GRID_COLOR = "#1f2030";

interface TooltipPayloadEntry {
  value: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  fmt?: (v: number) => string;
}

function ChartTooltip({ active, payload, label, fmt }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3 shadow-2xl" style={{ background: "#1a1b2e", border: "1px solid #2a2b3e" }}>
      <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>{label}</p>
      {payload.map((entry, i) => {
        const value = Number(entry.value);
        return (
          <p key={i} className="text-sm font-bold" style={{ color: "#f3f4f6" }}>
            {fmt ? fmt(value) : value.toLocaleString("pt-BR")}
          </p>
        );
      })}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
      Adicione produtos e vendas para ver os gráficos
    </div>
  );
}

export const SalesCharts = function SalesCharts() {
  const { products, sales } = useDb();

  const categoryData = useMemo(() => {
    return Object.entries(
      sales.reduce((acc, v) => {
        const prod = products.find((p) => p.id === v.productId);
        const cat = prod?.category || "Sem categoria";
        acc[cat] = (acc[cat] || 0) + v.totalAmount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
  }, [products, sales]);

  const marginData = useMemo(() => {
    return products
      .filter((p) => p.type === "income" && p.cost > 0)
      .map((p) => ({
        name: p.description.length > 16 ? p.description.slice(0, 16) + "…" : p.description,
        margin: calcMargin(p.amount, p.cost),
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 6);
  }, [products]);

  const channelData = useMemo(() => {
    return Object.entries(
      sales.reduce((acc, v) => {
        const prod = products.find((p) => p.id === v.productId);
        const ch = prod?.channel || "Sem canal";
        acc[ch] = (acc[ch] || 0) + v.totalAmount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
  }, [products, sales]);

  const tickStyle = { fill: TICK_COLOR, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Vendas por Categoria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Vendas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.6} />
                  <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<ChartTooltip fmt={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />}
                    cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1200} animationEasing="ease-out" maxBarSize={48}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Receita por Canal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Receita por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length === 0 ? <EmptyChart /> : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      isAnimationActive
                      animationDuration={1400}
                      animationEasing="ease-out"
                      stroke="#10111a"
                      strokeWidth={3}
                    >
                      {channelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip fmt={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-2 justify-center">
                  {channelData.map((ch, i) => (
                    <motion.div
                      key={ch.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#9ca3af" }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {ch.name}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Margem por Produto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="lg:col-span-2"
      >
        <Card className="bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-medium" style={{ color: "#9ca3af" }}>Margem por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            {marginData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={marginData} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.6} horizontal={false} />
                  <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="name" type="category" tick={tickStyle} axisLine={false} tickLine={false} width={150} />
                  <Tooltip
                    content={<ChartTooltip fmt={(v: number) => `${v.toFixed(1)}%`} />}
                    cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }}
                  />
                  <Bar dataKey="margin" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={1200} animationEasing="ease-out" maxBarSize={36}>
                    {marginData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
