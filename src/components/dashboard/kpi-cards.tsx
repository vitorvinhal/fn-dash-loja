"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle } from "lucide-react";
import { useDb } from "@/lib/db-context";
import { calcUnitProfit } from "@/data/products";

export const KPICards = function KPICards() {
  const { products, sales } = useDb();

  const kpis = useMemo(() => {
    const totalRevenue = sales.reduce((s, v) => s + v.totalAmount, 0);
    const totalProfit = sales.reduce((s, v) => s + v.profit, 0);
    const lowStock = products.filter((p) => p.type === "income" && (p.stock || 0) <= (p.minStock || 5));
    const incomeProducts = products.filter((p) => p.type === "income");

    return [
      {
        label: "Receita Total",
        value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue),
        change: `${sales.length} vendas`,
        positive: true,
        icon: DollarSign,
      },
      {
        label: "Lucro Real",
        value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalProfit),
        change: totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margem` : "Sem dados",
        positive: totalProfit > 0,
        icon: TrendingUp,
      },
      {
        label: "Produtos",
        value: incomeProducts.length.toString(),
        change: `${products.length} total`,
        positive: true,
        icon: Package,
      },
      {
        label: "Estoque Baixo",
        value: lowStock.length.toString(),
        change: lowStock.length > 0 ? "Atenção" : "OK",
        positive: lowStock.length === 0,
        icon: AlertTriangle,
      },
    ];
  }, [products, sales]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="bg-card hover:bg-secondary/30 transition-colors rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-sm">{kpi.label}</span>
                <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center">
                  <kpi.icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{kpi.value}</div>
              <div className={`text-xs font-medium ${kpi.positive ? "text-emerald-500" : "text-red-500"}`}>
                {kpi.change}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
