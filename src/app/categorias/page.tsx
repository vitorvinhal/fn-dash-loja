"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CategoryManager } from "@/components/categorias/category-manager";
import { motion } from "framer-motion";

export default function CategoriasPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Categorias & Tags</h1>
            <p className="text-muted-foreground text-sm">Organize seus produtos com categorias, subcategorias e tags</p>
          </motion.div>
          <CategoryManager />
        </div>
      </main>
    </div>
  );
}
