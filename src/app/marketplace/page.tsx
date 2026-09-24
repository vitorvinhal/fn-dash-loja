"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MarketplaceGrid } from "@/components/marketplace/marketplace-grid";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Produtos</h1>
            <p className="text-muted-foreground text-sm">Gerencie seu estoque, visualize detalhes e lance vendas</p>
          </motion.div>
          <MarketplaceGrid initialProductId={productId} />
        </div>
      </main>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceContent />
    </Suspense>
  );
}
