"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDb } from "@/lib/db-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, FolderTree } from "lucide-react";

export function CategoryNav() {
  const { categories } = useDb();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const categoryTree = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  const getChildren = (parentId: string) => {
    return categories.filter((c) => c.parent_id === parentId);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (href: string) => pathname === href;

  if (categories.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {categoryTree.map((cat) => {
        const children = getChildren(cat.id);
        const hasChildren = children.length > 0;
        const isExpanded = expanded.has(cat.id);

        return (
          <div key={cat.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                isActive(`/categorias?cat=${cat.id}`)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
              onClick={() => {
                if (hasChildren) toggleExpand(cat.id);
              }}
            >
              {hasChildren ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              ) : (
                <div className="w-4" />
              )}
              <span className="text-base">{cat.icon}</span>
              <span className="flex-1 truncate">{cat.name}</span>
              {hasChildren && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                  {children.length}
                </span>
              )}
            </div>

            <AnimatePresence>
              {isExpanded && hasChildren && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 space-y-0.5">
                    {children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categorias?cat=${sub.id}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          isActive(`/categorias?cat=${sub.id}`)
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <span className="text-sm">{sub.icon}</span>
                        <span className="truncate">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
