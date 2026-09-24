"use client";

import { useState, useMemo } from "react";
import { Product, calcUnitProfit } from "@/data/products";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useDb } from "@/lib/db-context";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  index?: number;
}

export function ProductCard({ product, onClick, index = 0 }: ProductCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const { categories, tags } = useDb();
  const profit = calcUnitProfit(product.amount, product.cost, product.commissionPct, product.shipping);
  const isLow = (product.stock || 0) <= (product.minStock || 5);
  const isOut = product.stock === 0;
  const imgs = product.images?.length ? product.images : [];

  const category = useMemo(() => {
    if (product.categoryId) return categories.find((c) => c.id === product.categoryId);
    return categories.find((c) => c.name === product.category);
  }, [product.categoryId, product.category, categories]);

  const productTags = useMemo(() => {
    if (!product.tags || product.tags.length === 0) return [];
    return product.tags.map((t) => tags.find((tag) => tag.id === t)).filter(Boolean).slice(0, 3);
  }, [product.tags, tags]);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i === 0 ? imgs.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i === imgs.length - 1 ? 0 : i + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      {/* Image gallery */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imgs[imgIdx]}
          alt={product.description}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Gallery nav */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 glass text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 glass text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === imgIdx ? "bg-white w-4" : "bg-white/40 w-1.5"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {product.shopeeLink && (
            <span className="px-2 py-0.5 bg-orange-500/90 text-white text-[10px] font-medium rounded-full glass">
              Shopee
            </span>
          )}
          {product.tiktokLink && (
            <span className="px-2 py-0.5 bg-pink-500/90 text-white text-[10px] font-medium rounded-full glass">
              TikTok
            </span>
          )}
        </div>

        {isOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
              SEM ESTOQUE
            </span>
          </div>
        )}

        {isLow && !isOut && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 bg-yellow-500/90 text-black text-[10px] font-bold rounded-full">
              Baixo
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg">
            <Eye className="w-3.5 h-3.5" />
            Ver Detalhes
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-medium rounded-md border border-border flex items-center gap-1">
            {category?.icon && <span className="text-[10px]">{category.icon}</span>}
            {category?.name || product.category}
          </span>
          <span className="text-muted-foreground text-[10px]">{product.channel}</span>
          {productTags.map((tag) => tag && (
            <span key={tag.id} className="px-1.5 py-0.5 rounded-md text-[9px] font-medium border border-border/50" style={{ background: `${tag.color}15`, color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>

        <h3 className="text-foreground font-semibold text-sm mb-1 line-clamp-1 group-hover:text-foreground/80 transition-colors">
          {product.description}
        </h3>

        {product.addedBy && (
          <p className="text-muted-foreground text-[10px] mb-3 flex items-center gap-1.5">
            <span>Adicionado por</span>
            {product.addedByAvatar ? (
              <img src={product.addedByAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover inline-block" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-accent/20 inline-flex items-center justify-center text-accent text-[7px] font-bold">{(product.addedBy || "U").charAt(0).toUpperCase()}</span>
            )}
            <span className="text-foreground/70 font-medium">{product.addedBy}</span>
          </p>
        )}
        {!product.addedBy && <div className="mb-3" />}

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xl font-black text-foreground">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.amount)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Lucro: <span className="text-emerald-500 font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(profit)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground mb-0.5">Estoque</div>
            <div className={`text-lg font-black ${isOut ? "text-red-500" : isLow ? "text-yellow-500" : "text-foreground"}`}>
              {product.stock}
            </div>
          </div>
        </div>

        {product.sku && (
          <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground font-mono">
            SKU: {product.sku}
          </div>
        )}
      </div>
    </motion.div>
  );
}
