"use client";

import { useState, useRef, useMemo } from "react";
import { Product, calcMargin, calcUnitProfit, CHANNELS } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Edit3, Trash2, ExternalLink, ShoppingCart, Save, Upload, TrendingUp, Package, DollarSign, ImageIcon, Download } from "lucide-react";
import { useDb } from "@/lib/db-context";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete: (id: string) => void;
  onSale: (product: Product) => void;
}

export function ProductDetailModal({ product, onClose, onSave, onDelete, onSale }: ProductDetailModalProps) {
  const { categories, tags } = useDb();
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Product>({ ...product });
  const [imgIdx, setImgIdx] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryTree = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id);
    const result: { id: string; name: string; fullName: string; icon: string; depth: number }[] = [];
    const walk = (cats: typeof roots, prefix: string, depth: number) => {
      for (const cat of cats) {
        result.push({ id: cat.id, name: cat.name, fullName: prefix ? `${prefix} > ${cat.name}` : cat.name, icon: cat.icon, depth });
        const children = categories.filter((c) => c.parent_id === cat.id);
        if (children.length) walk(children, prefix ? `${prefix} > ${cat.name}` : cat.name, depth + 1);
      }
    };
    walk(roots, "", 0);
    return result;
  }, [categories]);

  const currentCategory = useMemo(() => {
    if (data.categoryId) return categories.find((c) => c.id === data.categoryId);
    return categories.find((c) => c.name === data.category);
  }, [data.categoryId, data.category, categories]);

  const productTags = useMemo(() => {
    if (!data.tags || data.tags.length === 0) return [];
    return data.tags.map((t) => tags.find((tag) => tag.id === t)).filter(Boolean);
  }, [data.tags, tags]);

  const margin = calcMargin(data.amount, data.cost);
  const profit = calcUnitProfit(data.amount, data.cost, data.commissionPct, data.shipping);
  const costPlusShipping = data.cost + data.shipping;
  const isLow = (data.stock || 0) <= (data.minStock || 5);

  const updateField = (field: keyof Product, value: string | number) => {
    setData((d) => ({ ...d, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const remaining = 3 - data.images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    let processed = 0;
    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setData((d) => ({ ...d, images: [...d.images, base64] }));
        processed++;
        if (processed === toProcess.length) setUploading(false);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const addImage = () => {
    if (newImageUrl.trim() && data.images.length < 3) {
      setData((d) => ({ ...d, images: [...d.images, newImageUrl.trim()] }));
      setNewImageUrl("");
    }
  };

  const removeImage = (idx: number) => {
    setData((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }));
  };

  const downloadImage = (imgSrc: string, name: string) => {
    const link = document.createElement("a");
    link.href = imgSrc;
    link.download = `${name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    onSave(data);
    setEditing(false);
  };

  const recommendedPrice = data.cost > 0
    ? data.cost / (1 - (data.commissionPct || 0) / 100) + data.shipping
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 glass"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/90 glass border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-lg">
                {editing ? "Editando Produto" : "Detalhes do Produto"}
              </h2>
              <p className="text-muted-foreground text-xs">{data.sku || "Sem SKU"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-xl transition-colors hover:opacity-90">
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button onClick={() => { setData({ ...product }); setEditing(false); }} className="px-4 py-2 bg-secondary hover:bg-accent text-foreground text-sm rounded-xl transition-colors">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-accent text-foreground text-sm font-medium rounded-xl transition-colors border border-border">
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button onClick={() => onSale(data)} className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-xl transition-colors hover:opacity-90">
                  <ShoppingCart className="w-4 h-4" />
                  Vender
                </button>
              </>
            )}
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Images */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary mb-3 group/main">
              <img src={data.images[imgIdx] || "/placeholder.png"} alt={data.description} className="w-full h-full object-cover" />
              {data.images[imgIdx] && (
                <button onClick={() => downloadImage(data.images[imgIdx], data.description)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 glass text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover/main:opacity-100" title="Baixar imagem">
                  <Download className="w-4 h-4" />
                </button>
              )}
              {data.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i === 0 ? data.images.length - 1 : i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 glass text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx((i) => (i === data.images.length - 1 ? 0 : i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 glass text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {data.images.map((img, i) => (
                <div key={i} className="relative group/thumb">
                  <button onClick={() => setImgIdx(i)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? "border-foreground" : "border-transparent hover:border-foreground/50"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                  {editing && (
                    <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editing && data.images.length < 3 && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input type="url" placeholder="URL da imagem..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={addImage} className="px-3 py-2 bg-secondary hover:bg-accent text-foreground rounded-xl transition-colors border border-border">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-accent text-foreground rounded-xl transition-colors border border-border text-sm">
                  {uploading ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {uploading ? "Enviando..." : "Enviar imagem do PC"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-5">
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Nome do Produto</label>
              {editing ? (
                <input type="text" value={data.description} onChange={(e) => updateField("description", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              ) : (
                <h3 className="text-foreground font-bold text-xl">{data.description}</h3>
              )}
            </div>

            {data.addedBy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Adicionado por</span>
                {data.addedByAvatar ? (
                  <img src={data.addedByAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-accent/20 inline-flex items-center justify-center text-accent text-[9px] font-bold">{(data.addedBy || "U").charAt(0).toUpperCase()}</span>
                )}
                <span className="text-foreground font-medium bg-secondary px-2 py-0.5 rounded-md">{data.addedBy}</span>
              </div>
            )}

            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Descrição / Detalhes</label>
              {editing ? (
                <textarea value={data.details || ""} onChange={(e) => updateField("details", e.target.value)} rows={3} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
              ) : (
                <p className="text-foreground/80 text-sm">{data.details || "Sem descrição"}</p>
              )}
            </div>

            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Tamanho</label>
              {editing ? (
                <input type="text" value={data.size || ""} onChange={(e) => updateField("size", e.target.value)} placeholder="P, M, G, 38, Único" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              ) : (
                <span className="text-foreground text-sm">{data.size || "Não informado"}</span>
              )}
            </div>

            {data.weight ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Peso:</span>
                <span className="text-foreground font-medium bg-secondary px-2 py-0.5 rounded-md">{data.weight} kg</span>
              </div>
            ) : null}

            {/* Variações */}
            {data.variations && data.variations.length > 0 && !editing && (
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Variações</label>
                <div className="flex flex-wrap gap-2">
                  {data.variations.map((v, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2.5 py-1 text-xs">
                      {v.colorHex && <span className="w-3 h-3 rounded-full border border-border flex-shrink-0" style={{ background: v.colorHex }} />}
                      {v.color && <span className="text-foreground font-medium">{v.color}</span>}
                      {v.size && <span className="text-muted-foreground">/ {v.size}</span>}
                      <span className="text-muted-foreground/60">· {v.stock}un</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Categoria</label>
                {editing ? (
                  <select value={data.categoryId || ""} onChange={(e) => {
                    const catId = e.target.value;
                    const cat = categories.find((c) => c.id === catId);
                    setData((d) => ({ ...d, categoryId: catId, category: cat?.name || d.category }));
                  }} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                    <option value="">Selecionar...</option>
                    {categoryTree.map((c) => (
                      <option key={c.id} value={c.id}>{"".padEnd(c.depth * 2, "\u00A0")}{c.icon} {c.fullName}</option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-secondary text-muted-foreground text-xs font-medium rounded-md border border-border">
                    {currentCategory?.icon && <span>{currentCategory.icon}</span>}
                    {currentCategory?.name || data.category}
                  </span>
                )}
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Canal</label>
                {editing ? (
                  <select value={data.channel} onChange={(e) => updateField("channel", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                    {CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                ) : (
                  <span className="text-foreground text-sm">{data.channel}</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {productTags.length > 0 && !editing && (
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {productTags.map((tag) => tag && (
                    <span key={tag.id} className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-border/50" style={{ background: `${tag.color}15`, color: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Preço de Venda (R$)</label>
                {editing ? (
                  <input type="number" value={data.amount} onChange={(e) => updateField("amount", Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                ) : (
                  <div className="text-2xl font-black text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.amount)}
                  </div>
                )}
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Custo Unitário (R$)</label>
                {editing ? (
                  <input type="number" value={data.cost} onChange={(e) => updateField("cost", Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                ) : (
                  <div className="text-lg font-bold text-muted-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.cost)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Comissão (%)</label>
                {editing ? (
                  <input type="number" value={data.commissionPct} onChange={(e) => updateField("commissionPct", Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                ) : (
                  <span className="text-foreground text-sm">{data.commissionPct}%</span>
                )}
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Frete (R$)</label>
                {editing ? (
                  <input type="number" value={data.shipping} onChange={(e) => updateField("shipping", Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                ) : (
                  <span className="text-foreground text-sm">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.shipping)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Estoque Atual</label>
                {editing ? (
                  <input type="number" value={data.stock} onChange={(e) => updateField("stock", Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                ) : (
                  <div className={`text-lg font-bold ${isLow ? "text-yellow-500" : "text-foreground"}`}>
                    {data.stock} unidades
                  </div>
                )}
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Estoque Mínimo</label>
                {editing ? (
                  <input type="number" value={data.minStock || 5} onChange={(e) => updateField("minStock", Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                ) : (
                  <span className="text-foreground text-sm">{data.minStock || 5} unidades</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">SKU</label>
              {editing ? (
                <input type="text" value={data.sku || ""} onChange={(e) => updateField("sku", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
              ) : (
                <span className="text-foreground text-sm font-mono">{data.sku || "—"}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground text-xs block">Links de Venda</label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-medium rounded-md">Shopee</span>
                    <input type="url" value={data.shopeeLink || ""} onChange={(e) => updateField("shopeeLink", e.target.value)} placeholder="https://shopee.com.br/..." className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-pink-500/10 text-pink-500 text-[10px] font-medium rounded-md">TikTok</span>
                    <input type="url" value={data.tiktokLink || ""} onChange={(e) => updateField("tiktokLink", e.target.value)} placeholder="https://tiktok.com/@shop/..." className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {data.shopeeLink && (
                    <a href={data.shopeeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 text-xs rounded-lg hover:bg-orange-500/20 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Shopee
                    </a>
                  )}
                  {data.tiktokLink && (
                    <a href={data.tiktokLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 text-pink-500 text-xs rounded-lg hover:bg-pink-500/20 transition-colors">
                      <ExternalLink className="w-3 h-3" /> TikTok
                    </a>
                  )}
                  {!data.shopeeLink && !data.tiktokLink && <span className="text-muted-foreground text-sm">Nenhum link cadastrado</span>}
                </div>
              )}
            </div>

            <div className="bg-secondary/50 border border-border rounded-2xl p-4 space-y-3">
              <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Análise de Lucro</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Lucro/Unidade</div>
                    <div className="text-sm font-bold text-emerald-500">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(profit)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Margem</div>
                    <div className={`text-sm font-bold ${margin >= 40 ? "text-emerald-500" : margin >= 20 ? "text-yellow-500" : "text-red-500"}`}>
                      {margin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Custo + Frete: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(costPlusShipping)}
              </div>
              {editing && recommendedPrice > 0 && (
                <div className="text-[11px] text-foreground bg-secondary rounded-lg px-3 py-2 border border-border">
                  Preço sugerido (margem 40%): <span className="font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(recommendedPrice / 0.6)}
                  </span>
                </div>
              )}
            </div>

            {!editing && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => onDelete(data.id)} className="flex items-center gap-1.5 px-4 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium rounded-xl border border-destructive/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
