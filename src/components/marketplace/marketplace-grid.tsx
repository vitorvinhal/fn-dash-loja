"use client";

import { useState, useEffect, useMemo } from "react";
import { Product, Sale, CHANNELS } from "@/data/products";
import { ProductCard } from "./product-card";
import { ProductDetailModal } from "./product-detail-modal";
import { ProductFormModal } from "./product-form-modal";
import { SaleFormModal } from "./sale-form-modal";
import { motion } from "framer-motion";
import { Search, Plus, X, Filter, Download, FileSpreadsheet } from "lucide-react";
import { useDb } from "@/lib/db-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { exportToShopee, exportToTikTok, exportStockReport } from "@/lib/export-marketplace";

interface MarketplaceGridProps {
  initialProductId?: string | null;
}

export function MarketplaceGrid({ initialProductId }: MarketplaceGridProps) {
  const { products, addProduct, updateProduct, deleteProduct, addSale, categories, tags } = useDb();
  const { profile } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("todas");
  const [selectedTagId, setSelectedTagId] = useState("todas");
  const [channel, setChannel] = useState("todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [productOpened, setProductOpened] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Build category tree for filter
  const categoryTree = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id);
    const result: { id: string; name: string; fullName: string; icon: string }[] = [];
    const walk = (cats: typeof roots, prefix: string) => {
      for (const cat of cats) {
        result.push({ id: cat.id, name: cat.name, fullName: prefix ? `${prefix} > ${cat.name}` : cat.name, icon: cat.icon });
        const children = categories.filter((c) => c.parent_id === cat.id);
        if (children.length) walk(children, prefix ? `${prefix} > ${cat.name}` : cat.name);
      }
    };
    walk(roots, "");
    return result;
  }, [categories]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (initialProductId && !productOpened) {
      const p = products.find((pr) => pr.id === initialProductId);
      if (p) {
        const timer = setTimeout(() => {
          setSelectedProduct(p);
          setProductOpened(true);
          router.replace("/marketplace", { scroll: false });
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [initialProductId, products, productOpened, router]);

  const filtered = products.filter((p) => {
    const matchSearch = p.description.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategoryId === "todas" || p.categoryId === selectedCategoryId || p.category === selectedCategoryId;
    const matchChannel = channel === "todos" || p.channel === channel;
    const matchTag = selectedTagId === "todas" || (p.tags && p.tags.includes(selectedTagId));
    return matchSearch && matchCategory && matchChannel && matchTag;
  });

  const totalRevenue = products.filter((p) => p.type === "income").reduce((s, p) => s + p.amount, 0);
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 5)).length;

  const handleSaveProduct = async (product: Product) => {
    await addProduct(product);
    setShowAddForm(false);
    showToast("Produto criado com sucesso!");
  };

  const handleUpdateProduct = async (product: Product) => {
    await updateProduct(product.id, product);
    setSelectedProduct(null);
    showToast("Produto atualizado!");
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setSelectedProduct(null);
    showToast("Produto excluído.");
  };

  const handleSaveSale = async (sale: Sale) => {
    await addSale(sale);
    setSaleProduct(null);
    showToast("Venda registrada com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Receita", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue) },
          { label: "Estoque Total", value: totalStock.toString() },
          ...(lowStockCount > 0 ? [{ label: "Estoque Baixo", value: `${lowStockCount} produtos`, warn: true }] : []),
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${stat.warn ? "bg-yellow-500/10 border-yellow-500/20" : "bg-secondary/50 border-border"}`}
          >
            <span className="text-muted-foreground text-xs">{stat.label}:</span>
            <span className={`font-bold text-sm ${stat.warn ? "text-yellow-500" : "text-foreground"}`}>{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2.5 flex-1 focus-within:ring-2 focus-within:ring-ring/30 transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input data-testid="search-input" type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full" />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none max-w-[200px]">
          <option value="todas">Todas categorias</option>
          {categoryTree.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.fullName}</option>
          ))}
        </select>
        <select value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none max-w-[160px]">
          <option value="todas">Todas tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
          <option value="todos">Todos canais</option>
          {CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <motion.button
          data-testid="new-product-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </motion.button>

        {/* Export Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground text-sm font-medium rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </motion.button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-50"
              >
                <div className="p-1">
                  <button
                    onClick={() => { exportToShopee(filtered); setShowExportMenu(false); showToast("Exportado para Shopee!"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                    <div className="text-left">
                      <div className="font-medium">Shopee</div>
                      <div className="text-xs text-muted-foreground">CSV para importação</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { exportToTikTok(filtered); setShowExportMenu(false); showToast("Exportado para TikTok Shop!"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                    <div className="text-left">
                      <div className="font-medium">TikTok Shop</div>
                      <div className="text-xs text-muted-foreground">CSV para importação</div>
                    </div>
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => { exportStockReport(filtered); setShowExportMenu(false); showToast("Relatório de estoque exportado!"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <div className="text-left">
                      <div className="font-medium">Relatório de Estoque</div>
                      <div className="text-xs text-muted-foreground">CSV completo com status</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div data-testid="product-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div data-testid="empty-state" className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Filter className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSave={handleUpdateProduct} onDelete={handleDeleteProduct} onSale={(p) => { setSelectedProduct(null); setSaleProduct(p); }} />
      )}
      {showAddForm && <ProductFormModal onClose={() => setShowAddForm(false)} onSave={handleSaveProduct} userName={profile?.username || profile?.email?.split("@")[0] || ""} userAvatar={profile?.avatar || ""} />}
      {saleProduct && <SaleFormModal product={saleProduct} onClose={() => setSaleProduct(null)} onSave={handleSaveSale} userName={profile?.username || profile?.email?.split("@")[0] || ""} userAvatar={profile?.avatar || ""} />}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-foreground text-background text-sm font-medium rounded-xl shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
