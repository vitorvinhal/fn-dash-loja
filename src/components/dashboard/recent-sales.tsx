"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useDb } from "@/lib/db-context";
import { ShoppingCart, Package } from "lucide-react";

export function RecentSales() {
  const { sales, products } = useDb();

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const getProductImage = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.images?.[0] || null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma venda registrada
              </div>
            ) : (
              recentSales.map((sale, i) => {
                const img = getProductImage(sale.productId);
                return (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-foreground text-sm font-medium">{sale.productName}</div>
                        <div className="text-muted-foreground text-xs">
                          {sale.qty}x · {new Date(sale.date).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground text-sm font-bold">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.totalAmount)}
                      </div>
                      <div className="text-emerald-500 text-xs">
                        +{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.profit)}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
