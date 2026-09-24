"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useDb } from "@/lib/db-context";
import { calcMargin } from "@/data/products";
import { Package, AlertTriangle } from "lucide-react";

export function InventoryTable() {
  const { products } = useDb();
  const incomeProducts = products.filter((p) => p.type === "income");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <Package className="w-4 h-4" />
            Estoque de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum produto cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium">Produto</th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium">Categoria</th>
                    <th className="text-right py-3 px-3 text-muted-foreground font-medium">Preço</th>
                    <th className="text-right py-3 px-3 text-muted-foreground font-medium">Custo</th>
                    <th className="text-right py-3 px-3 text-muted-foreground font-medium">Margem</th>
                    <th className="text-center py-3 px-3 text-muted-foreground font-medium">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeProducts.map((p) => {
                    const margin = calcMargin(p.amount, p.cost);
                    const isLow = (p.stock || 0) <= (p.minStock || 5);
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                              <img src={p.images?.[0]} alt={p.description} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="text-foreground font-medium text-sm">{p.description}</div>
                              {p.sku && <div className="text-muted-foreground text-xs">{p.sku}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-foreground">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.amount)}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.cost)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={margin >= 40 ? "text-emerald-500" : margin >= 20 ? "text-yellow-500" : "text-red-500"}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                            <span className={isLow ? "text-red-500 font-medium" : "text-foreground"}>
                              {p.stock}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
