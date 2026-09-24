"use client";

import { useState } from "react";
import { useDb } from "@/lib/db-context";
import { Tag } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag as TagIcon } from "lucide-react";

const TAG_COLORS = [
  "#6366f1", "#a855f7", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#8b5cf6", "#f472b6", "#fb923c", "#10b981", "#64748b",
];

export function TagManager() {
  const { tags, addTag, updateTag, deleteTag } = useDb();
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [tagError, setTagError] = useState("");

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    setSaving(true);
    setTagError("");
    const result = await addTag({ name: newTagName.trim(), color: newTagColor });
    if (result) {
      setNewTagName("");
      setShowNewTag(false);
    } else {
      setTagError("Erro ao criar tag. Verifique se a tabela product_tags existe.");
    }
    setSaving(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await updateTag(id, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Excluir a tag "${name}"?`)) return;
    await deleteTag(id);
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Tags são labels livres para marcar produtos (ex: Promoção, Novo, Baixo Estoque)
        </p>
        <button
          onClick={() => setShowNewTag(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nova Tag
        </button>
      </div>

      {/* New Tag Form */}
      <AnimatePresence>
        {showNewTag && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-medium text-sm">Nova Tag</h3>
                <button onClick={() => setShowNewTag(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Nome *</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Promoção, Novo, Lançamento..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
              </div>

              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newTagColor === color
                          ? "border-foreground scale-110 ring-2 ring-foreground/30"
                          : "border-border/50 hover:scale-105"
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddTag}
                  disabled={!newTagName.trim() || saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? "Criando..." : "Criar Tag"}
                </button>
                <button
                  onClick={() => setShowNewTag(false)}
                  className="px-5 py-2.5 bg-secondary hover:bg-accent text-foreground text-sm rounded-xl transition-colors border border-border"
                >
                  Cancelar
                </button>
                {tagError && <span className="text-red-400 text-xs ml-2">{tagError}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags List */}
      {tags.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <TagIcon className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm mb-3">Nenhuma tag criada</p>
          <button
            onClick={() => setShowNewTag(true)}
            className="text-accent text-sm hover:underline"
          >
            Criar primeira tag
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
            >
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-28 bg-secondary border border-border rounded-lg px-2 py-1 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(tag.id)}
                  />
                  <div className="flex gap-1">
                    {TAG_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          editColor === c ? "border-foreground scale-110" : "border-border/50"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <button onClick={() => handleSaveEdit(tag.id)} className="text-accent hover:text-accent/80">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: tag.color }}
                  />
                  <span className="text-foreground text-sm font-medium">{tag.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(tag)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteTag(tag.id, tag.name)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
