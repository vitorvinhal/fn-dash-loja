"use client";

import { useState, useMemo } from "react";
import { useDb } from "@/lib/db-context";
import { Category, Tag } from "@/lib/supabase";
import { CategoryTreeItem } from "./category-tree-item";
import { TagManager } from "./tag-manager";
import { motion, AnimatePresence } from "framer-motion";
import { FolderTree, Tags, Plus, X, Loader2, Check, Database } from "lucide-react";

const PRESET_ICONS = ["👕", "👗", "👔", "👜", "💄", "🧴", "👟", "💍", "🕶️", "⌚", "🧸", "🎁", "📦", "🏷️", "⭐"];

export function CategoryManager() {
  const { categories, tags, addCategory, updateCategory, deleteCategory, categoriesBackend } = useDb();
  const [activeTab, setActiveTab] = useState<"categories" | "tags">("categories");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState<string | null>(null);
  const [newCatIcon, setNewCatIcon] = useState("👕");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const categoryTree = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    setSaveError("");
    const slug = newCatName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const maxOrder = categories.filter((c) => c.parent_id === newCatParent).reduce((max, c) => Math.max(max, c.sort_order), 0);

    const result = await addCategory({
      name: newCatName.trim(),
      slug,
      parent_id: newCatParent,
      icon: newCatIcon,
      color: "#64748b",
      sort_order: maxOrder + 1,
    });

    if (result.error) {
      setSaveError(result.error);
    } else if (result.data) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setNewCatName("");
      setNewCatParent(null);
      setShowNewCategory(false);
      if (newCatParent) setExpandedParents((prev) => new Set(prev).add(newCatParent));
    }
    setSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    const hasChildren = categories.some((c) => c.parent_id === id);
    if (hasChildren) {
      if (!confirm("Esta categoria tem subcategorias. Excluir todas?")) return;
      const children = categories.filter((c) => c.parent_id === id);
      for (const child of children) await deleteCategory(child.id);
    }
    await deleteCategory(id);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", value: categories.length.toString(), icon: FolderTree },
          { label: "Raízes", value: categories.filter((c) => !c.parent_id).length.toString() },
          { label: "Subcategorias", value: (categories.length - categories.filter((c) => !c.parent_id).length).toString() },
          { label: "Tags", value: tags.length.toString(), icon: Tags },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-secondary/50 border-border">
            {stat.icon && <stat.icon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-muted-foreground text-xs">{stat.label}:</span>
            <span className="font-bold text-sm text-foreground">{stat.value}</span>
          </div>
        ))}
        {categoriesBackend === "localStorage" && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-amber-500/10 border-amber-500/20">
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-500 text-xs font-medium">Salvo localmente</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "categories" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}>
          <FolderTree className="w-4 h-4" /> Categorias
        </button>
        <button onClick={() => setActiveTab("tags")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "tags" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}>
          <Tags className="w-4 h-4" /> Tags
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Organize seus produtos em categorias e subcategorias</p>
            <button onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl transition-opacity hover:opacity-90">
              <Plus className="w-4 h-4" /> Nova Categoria
            </button>
          </div>

          {/* New Category Form */}
          <AnimatePresence>
            {showNewCategory && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-foreground font-medium text-sm">Nova Categoria</h3>
                    <button onClick={() => setShowNewCategory(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Nome *</label>
                    <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ex: Roupas, Acessórios..."
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
                      autoFocus />
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Categoria Pai (opcional)</label>
                    <select value={newCatParent || ""} onChange={(e) => setNewCatParent(e.target.value || null)}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                      <option value="">Categoria raiz</option>
                      {categories.filter((c) => !c.parent_id).map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Ícone</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_ICONS.map((icon) => (
                        <button key={icon} type="button" onClick={() => setNewCatIcon(icon)}
                          className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                            newCatIcon === icon ? "border-accent bg-accent/10 scale-110" : "border-border hover:border-foreground/30"
                          }`}>{icon}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 items-center">
                    <button onClick={handleAddCategory} disabled={!newCatName.trim() || saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {saving ? "Salvando..." : saved ? "Criado!" : "Criar Categoria"}
                    </button>
                    <button onClick={() => { setShowNewCategory(false); setSaveError(""); }}
                      className="px-5 py-2.5 bg-secondary hover:bg-accent text-foreground text-sm rounded-xl transition-colors border border-border">
                      Cancelar
                    </button>
                    {saveError && <span className="text-red-400 text-xs ml-2">{saveError}</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Tree */}
          <div className="space-y-2">
            {categoryTree.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <FolderTree className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground text-sm mb-3">Nenhuma categoria criada</p>
                <button onClick={() => setShowNewCategory(true)} className="text-accent text-sm hover:underline">
                  Criar primeira categoria
                </button>
              </div>
            ) : (
              categoryTree.map((cat) => (
                <CategoryTreeItem key={cat.id} category={cat} children={getChildren(cat.id)}
                  allCategories={categories} expanded={expandedParents.has(cat.id)}
                  onToggle={() => toggleExpand(cat.id)} onUpdate={updateCategory}
                  onDelete={handleDeleteCategory}
                  onAddSub={(parentId) => { setNewCatParent(parentId); setShowNewCategory(true); }}
                  depth={0} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && <TagManager />}
    </div>
  );
}
