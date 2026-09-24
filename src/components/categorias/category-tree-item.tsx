"use client";

import { useState } from "react";
import { Category } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface CategoryTreeItemProps {
  category: Category;
  children: Category[];
  allCategories: Category[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddSub: (parentId: string) => void;
  depth: number;
}

export function CategoryTreeItem({
  category,
  children: subcats,
  allCategories,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddSub,
  depth,
}: CategoryTreeItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editIcon, setEditIcon] = useState(category.icon);

  const hasChildren = subcats.length > 0;

  const handleSave = async () => {
    if (!editName.trim()) return;
    const slug = editName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await onUpdate(category.id, { name: editName.trim(), slug, icon: editIcon });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir "${category.name}"?${hasChildren ? " Isso também excluirá " + subcats.length + " subcategoria(ões)." : ""}`)) return;
    await onDelete(category.id);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
          expanded ? "bg-secondary/30 border-accent/30" : "bg-card border-border hover:bg-secondary/20"
        }`}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Expand/collapse */}
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
            hasChildren ? "text-muted-foreground hover:text-foreground hover:bg-secondary" : "text-transparent cursor-default"
          }`}
        >
          {hasChildren && (
            expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Icon + Name */}
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              className="w-10 bg-secondary border border-border rounded-lg px-2 py-1 text-center text-sm outline-none"
              maxLength={4}
            />
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {category.icon && <span className="text-lg flex-shrink-0">{category.icon}</span>}
            <span className="text-foreground text-sm font-medium truncate">{category.name}</span>
            {hasChildren && (
              <span className="text-muted-foreground text-[10px] bg-secondary px-1.5 py-0.5 rounded-md">
                {subcats.length} sub
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {editing ? (
          <div className="flex items-center gap-1">
            <button onClick={handleSave} className="w-7 h-7 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setEditing(false); setEditName(category.name); setEditIcon(category.icon); }} className="w-7 h-7 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onAddSub(category.id)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Adicionar subcategoria">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} className="w-7 h-7 rounded-lg bg-secondary hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 mt-1">
              {subcats.map((sub) => (
                <CategoryTreeItem
                  key={sub.id}
                  category={sub}
                  children={allCategories.filter((c) => c.parent_id === sub.id)}
                  allCategories={allCategories}
                  expanded={expanded}
                  onToggle={() => {}}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddSub={onAddSub}
                  depth={depth + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
