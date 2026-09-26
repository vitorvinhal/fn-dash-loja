"use client";

import { useState, useRef, useMemo } from "react";
import { Product, ProductVariation, CHANNELS, generateSKU, ProductMeasurements } from "@/data/products";
import { motion } from "framer-motion";
import { X, Save, Plus, ImageIcon, Palette, Package, Check, ChevronDown, ChevronUp, Trash2, Tag, FolderTree } from "lucide-react";
import { useDb } from "@/lib/db-context";

interface ProductFormModalProps {
  onClose: () => void;
  onSave: (product: Product) => void;
  userName?: string;
  userAvatar?: string;
}

const PRESET_COLORS = [
  { name: "Preto", hex: "#000000" },
  { name: "Branco", hex: "#ffffff" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Vermelho", hex: "#ef4444" },
  { name: "Verde", hex: "#22c55e" },
  { name: "Amarelo", hex: "#eab308" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Roxo", hex: "#a855f7" },
  { name: "Laranja", hex: "#f97316" },
  { name: "Cinza", hex: "#6b7280" },
  { name: "Marrom", hex: "#78350f" },
  { name: "Bege", hex: "#d4a574" },
];

const PRESET_SIZES = ["PP", "P", "M", "G", "GG", "XG", "36", "38", "40", "42", "44", "46", "Único"];

const MEASURE_FIELDS: { key: keyof ProductMeasurements; label: string }[] = [
  { key: "width", label: "Largura (cm)" },
  { key: "length", label: "Comprimento (cm)" },
  { key: "bust", label: "Busto (cm)" },
  { key: "waist", label: "Cintura (cm)" },
  { key: "hip", label: "Quadril (cm)" },
];

const newVar = (): ProductVariation => ({
  size: "", color: "", colorHex: "#000000", stock: 0, sku: "",
  amount: 0, cost: 0, commissionPct: 0, shipping: 0,
  measurements: {},
});

export function ProductFormModal({ onClose, onSave, userName, userAvatar }: ProductFormModalProps) {
  const { categories, tags } = useDb();
  const [data, setData] = useState<Product>({
    id: "", date: new Date().toISOString().split("T")[0], description: "",
    amount: 0, type: "income", channel: "Loja Física", category: "Camisas",
    stock: 0, minStock: 5, cost: 0, commissionPct: 0, shipping: 0,
    sku: generateSKU("Camisas"), images: [], shopeeLink: "", tiktokLink: "",
    addedBy: userName || "", addedByAvatar: userAvatar || "", details: "", size: "", weight: 0,
    variations: [],
    hsCode: "", gstCode: "", dimensions: { length: 0, width: 0, height: 0 },
    shippingChannels: [], daysToShip: 2, condition: "new", isActive: true,
    tags: [],
  });
  const [hasVariations, setHasVariations] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedVar, setExpandedVar] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Build hierarchical category options
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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId];
      setData((d) => ({ ...d, tags: next }));
      return next;
    });
  };

  const updateField = (field: keyof Product, value: string | number | ProductVariation[] | string[]) => {
    setData((d) => {
      const updated = { ...d, [field]: value };
      if (field === "category") updated.sku = generateSKU(value as string);
      return updated;
    });
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
        setData((d) => ({ ...d, images: [...d.images, ev.target?.result as string] }));
        processed++;
        if (processed === toProcess.length) setUploading(false);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setData((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }));
  };

  const toggleVariations = (val: boolean) => {
    setHasVariations(val);
    if (val) {
      setData((d) => ({ ...d, variations: [newVar()], stock: 0 }));
      setExpandedVar(0);
    } else {
      setData((d) => ({ ...d, variations: [] }));
      setExpandedVar(null);
    }
  };

  const updateVar = (idx: number, field: keyof ProductVariation, value: string | number) => {
    setData((d) => {
      const vars = [...(d.variations || [])];
      vars[idx] = { ...vars[idx], [field]: value };
      return { ...d, variations: vars };
    });
  };

  const updateVarMeasurement = (idx: number, key: keyof ProductMeasurements, value: string) => {
    setData((d) => {
      const vars = [...(d.variations || [])];
      const m = { ...(vars[idx].measurements || {}) } as ProductMeasurements;
      const num = Number(value);
      if (value === "" || Number.isNaN(num)) delete m[key];
      else (m as Record<string, number>)[key] = num;
      vars[idx] = { ...vars[idx], measurements: m };
      return { ...d, variations: vars };
    });
  };

  const measurementsLabel = (v: ProductVariation) => {
    const m = v.measurements || {};
    const parts: string[] = [];
    for (const { key, label } of MEASURE_FIELDS) {
      const val = m[key];
      if (val) parts.push(`${label.replace(" (cm)", "")} ${val}cm`);
    }
    return parts.join(" · ");
  };

  const addNewVariation = () => {
    setData((d) => ({ ...d, variations: [...(d.variations || []), newVar()] }));
    setExpandedVar((data.variations?.length || 0));
  };

  const removeVariation = (idx: number) => {
    setData((d) => {
      const vars = (d.variations || []).filter((_, i) => i !== idx);
      return { ...d, variations: vars };
    });
    setExpandedVar(null);
  };

  const duplicateVariation = (idx: number) => {
    const v = data.variations![idx];
    const dup = { ...v, sku: "" };
    setData((d) => ({ ...d, variations: [...(d.variations || []), dup] }));
  };

  const handleSave = () => {
    if (!data.description.trim()) return;
    const totalStock = hasVariations && data.variations && data.variations.length > 0
      ? data.variations.reduce((sum, v) => sum + v.stock, 0)
      : data.stock;
    onSave({ ...data, id: `cl-${Date.now()}`, stock: totalStock });
  };

  const totalVarStock = data.variations?.reduce((s, v) => s + v.stock, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-lg">Novo Produto</h2>
              <p className="text-muted-foreground text-xs">Preencha as informações do produto</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ===== SEÇÃO 1: Imagens ===== */}
          <div>
            <label className="text-muted-foreground text-xs mb-2 block">Imagens do Produto (até 3)</label>
            <div className="flex gap-3">
              {data.images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {data.images.length < 3 && (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50">
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                      <span className="text-[9px] text-muted-foreground/40">Do PC</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {/* ===== SEÇÃO 2: Dados básicos ===== */}
          <div>
            <label className="text-muted-foreground text-xs mb-1.5 block">Nome do Produto *</label>
            <input type="text" value={data.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Ex: Vestido de Verão Floral" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground/50" />
          </div>

          <div>
            <label className="text-muted-foreground text-xs mb-1.5 block">Descrição / Detalhes</label>
            <textarea value={data.details || ""} onChange={(e) => updateField("details", e.target.value)} placeholder="Ex: Tecido leve, ideal para o verão..." rows={2} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground/50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Peso Unitário (kg)</label>
              <div className="relative">
                <input type="number" step="0.01" value={data.weight || ""} onChange={(e) => updateField("weight", Number(e.target.value))} placeholder="0,00" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">kg</span>
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Adicionado por</label>
              <div className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm flex items-center gap-2">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-[10px] font-bold">{(userName || "U").charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="font-medium">{userName || "Não identificado"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" /> Categoria
              </label>
              <select value={data.categoryId || ""} onChange={(e) => {
                const catId = e.target.value;
                const cat = categories.find((c) => c.id === catId);
                setData((d) => ({ ...d, categoryId: catId, category: cat?.name || "", sku: generateSKU(cat?.name || d.category) }));
              }} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                <option value="">Selecionar categoria...</option>
                {categoryTree.map((c) => (
                  <option key={c.id} value={c.id}>{"".padEnd(c.depth * 2, "\u00A0")}{c.icon} {c.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Canal de Venda</label>
              <select value={data.channel} onChange={(e) => updateField("channel", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                {CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== SEÇÃO 3: Toggle Variações ===== */}
          <div className="border border-border rounded-2xl p-4 bg-secondary/20">
            <div className="flex items-center gap-3 mb-3">
              <Palette className="w-5 h-5 text-accent" />
              <div>
                <label className="text-foreground text-sm font-medium">Variações do Produto</label>
                <p className="text-muted-foreground text-[11px]">Tamanhos ou cores diferentes? Configure cada uma com preço e estoque próprios.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleVariations(false)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${!hasVariations ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                {!hasVariations && <Check className="w-4 h-4" />}
                <Package className="w-4 h-4" />
                Sem variações
              </button>
              <button onClick={() => toggleVariations(true)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${hasVariations ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                {hasVariations && <Check className="w-4 h-4" />}
                <Palette className="w-4 h-4" />
                Com variações
              </button>
            </div>
          </div>

          {/* ===== SEM VARIAÇÕES ===== */}
          {!hasVariations && (
            <div className="space-y-4">
              <SectionTitle icon={<DollarSign className="w-4 h-4" />} title="Preço e Estoque" />
              <div className="grid grid-cols-2 gap-3">
                <PriceField label="Preço de Venda *" value={data.amount} onChange={(v) => updateField("amount", v)} />
                <PriceField label="Custo Unitário" value={data.cost} onChange={(v) => updateField("cost", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PctField label="Comissão (%)" value={data.commissionPct} onChange={(v) => updateField("commissionPct", v)} />
                <PriceField label="Frete" value={data.shipping} onChange={(v) => updateField("shipping", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IntField label="Estoque" value={data.stock} onChange={(v) => updateField("stock", v)} />
                <IntField label="Estoque Mínimo" value={data.minStock || 0} onChange={(v) => updateField("minStock", v)} />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">SKU</label>
                <input type="text" value={data.sku || ""} onChange={(e) => updateField("sku", e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
              </div>

              {/* Tamanho e Medidas */}
              <div className="border border-border rounded-2xl p-4 bg-secondary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="text-foreground text-sm font-medium">Tamanho e Medidas</span>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px] mb-1 block">Tamanho</label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {PRESET_SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => updateField("size", data.size === s ? "" : s)} className={`px-3 py-1 text-xs rounded-lg border transition-colors ${data.size === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={data.size || ""} onChange={(e) => updateField("size", e.target.value)} placeholder="Ou digite com medida, ex: M 5cm de largura" className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEASURE_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-muted-foreground text-[10px] mb-1 block">{label}</label>
                      <div className="relative">
                        <input type="number" step="0.5" value={(data.measurements || {})[key] ?? ""}
                          onChange={(e) => {
                            const m = { ...(data.measurements || {}) } as ProductMeasurements;
                            const num = Number(e.target.value);
                            if (e.target.value === "" || Number.isNaN(num)) delete m[key];
                            else (m as Record<string, number>)[key] = num;
                            setData((d) => ({ ...d, measurements: m }));
                          }}
                          placeholder="—" className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring pr-8" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px]">cm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== COM VARIAÇÕES ===== */}
          {hasVariations && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<Palette className="w-4 h-4" />} title={`${data.variations?.length || 0} Variação(ões)`} />
                {data.variations && data.variations.length > 0 && (
                  <span className="text-muted-foreground text-[11px]">Estoque total: {totalVarStock} un.</span>
                )}
              </div>

              {/* Lista de variações */}
              {data.variations && data.variations.map((v, i) => {
                const isOpen = expandedVar === i;
                return (
                  <div key={i} className={`border rounded-2xl transition-all ${isOpen ? "border-accent bg-secondary/10" : "border-border bg-secondary/30"}`}>
                    {/* Header compacto */}
                    <button onClick={() => setExpandedVar(isOpen ? null : i)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      {v.image ? (
                        <img src={v.image} alt="" className="w-6 h-6 rounded-full object-cover border border-border flex-shrink-0" />
                      ) : v.colorHex && v.colorHex !== "#000000" ? (
                        <span className="w-6 h-6 rounded-full border border-border flex-shrink-0" style={{ background: v.colorHex }} />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground flex-shrink-0">{i + 1}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          {v.color && <span className="font-medium">{v.color}</span>}
                          {v.size && <span className="text-muted-foreground">· {v.size}</span>}
                          {!v.color && !v.size && <span className="text-muted-foreground italic">Variação {i + 1}</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                          <span>{v.size || "Tamanho?"}</span>
                          {v.color && <span>{v.color}</span>}
                          <span>{v.stock} un.</span>
                          {(v.amount || 0) > 0 && <span>R$ {v.amount!.toFixed(2)}</span>}
                        </div>
                        {measurementsLabel(v) && (
                          <div className="text-[9px] text-muted-foreground/80 mt-0.5 truncate">{measurementsLabel(v)}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); duplicateVariation(i); }} className="w-7 h-7 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Duplicar">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeVariation(i); }} className="w-7 h-7 rounded-lg bg-secondary hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors" title="Remover">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Detalhes expandidos */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {/* Tamanho */}
                        <div>
                          <label className="text-muted-foreground text-[10px] mb-1 block">Tamanho</label>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {PRESET_SIZES.map((s) => (
                              <button key={s} type="button" onClick={() => updateVar(i, "size", v.size === s ? "" : s)} className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${v.size === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                                {s}
                              </button>
                            ))}
                          </div>
                          <input type="text" value={v.size || ""} onChange={(e) => updateVar(i, "size", e.target.value)} placeholder="Ou digite com medida, ex: M 5cm de largura" className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring" />
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                            {MEASURE_FIELDS.map(({ key, label }) => (
                              <div key={key}>
                                <label className="text-muted-foreground text-[9px] mb-0.5 block">{label}</label>
                                <div className="relative">
                                  <input type="number" step="0.5" value={(v.measurements || {})[key] ?? ""}
                                    onChange={(e) => updateVarMeasurement(i, key, e.target.value)}
                                    placeholder="—" className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground text-[11px] outline-none focus:ring-2 focus:ring-ring pr-7" />
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[8px]">cm</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cor */}
                        <div>
                          <label className="text-muted-foreground text-[10px] mb-1 block">Cor</label>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {PRESET_COLORS.map((c) => (
                              <button key={c.name} type="button" onClick={() => { updateVar(i, "color", v.color === c.name ? "" : c.name); updateVar(i, "colorHex", c.hex); }} title={c.name} className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${v.color === c.name ? "border-accent scale-110 ring-2 ring-accent/30" : "border-border/50 hover:scale-105 hover:border-foreground/30"}`} style={{ background: c.hex }}>
                                {v.color === c.name && <span className="text-[8px] font-bold" style={{ color: c.hex === "#ffffff" || c.hex === "#eab308" ? "#000" : "#fff" }}>✓</span>}
                              </button>
                            ))}
                          </div>
                          <input type="text" value={v.color || ""} onChange={(e) => updateVar(i, "color", e.target.value)} placeholder="Nome da cor..." className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring" />
                        </div>

                        {/* Estoque + Preço */}
                        <div className="grid grid-cols-2 gap-2">
                          <IntField label="Estoque" value={v.stock} onChange={(val) => updateVar(i, "stock", val)} small />
                          <PriceField label="Preço de Venda" value={v.amount || 0} onChange={(val) => updateVar(i, "amount", val)} small />
                        </div>

                        {/* Custo + Comissão + Frete */}
                        <div className="grid grid-cols-3 gap-2">
                          <PriceField label="Custo" value={v.cost || 0} onChange={(val) => updateVar(i, "cost", val)} small />
                          <PctField label="Comissão" value={v.commissionPct || 0} onChange={(val) => updateVar(i, "commissionPct", val)} small />
                          <PriceField label="Frete" value={v.shipping || 0} onChange={(val) => updateVar(i, "shipping", val)} small />
                        </div>

                        {/* SKU */}
                        <div>
                          <label className="text-muted-foreground text-[10px] mb-1 block">SKU</label>
                          <input type="text" value={v.sku || ""} onChange={(e) => updateVar(i, "sku", e.target.value)} placeholder={`Ex: ${data.sku || "PROD"}-${(v.size || "X").slice(0, 3).toUpperCase()}-${(v.color || "C").slice(0, 3).toUpperCase()}`} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-xs font-mono outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground/40" />
                        </div>

                        {/* Foto da variação (opcional) */}
                        <div>
                          <label className="text-muted-foreground text-[10px] mb-1 block">Foto da Variação (opcional)</label>
                          <div className="flex items-center gap-2">
                            {v.image ? (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border group flex-shrink-0">
                                <img src={v.image} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => updateVar(i, "image", "")} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="w-14 h-14 rounded-lg border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors flex-shrink-0">
                                <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                                <span className="text-[7px] text-muted-foreground/40">Foto</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => updateVar(i, "image", ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                  e.target.value = "";
                                }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Botão adicionar variação */}
              <button onClick={addNewVariation} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent transition-all text-sm font-medium">
                <Plus className="w-4 h-4" />
                Adicionar outra variação
              </button>
            </div>
          )}

          {/* ===== Links ===== */}
          <div className="space-y-2">
            <label className="text-muted-foreground text-xs block">Links de Venda (opcional)</label>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-medium rounded-md w-16 text-center">Shopee</span>
              <input type="url" value={data.shopeeLink || ""} onChange={(e) => updateField("shopeeLink", e.target.value)} placeholder="https://shopee.com.br/..." className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-pink-500/10 text-pink-500 text-[10px] font-medium rounded-md w-16 text-center">TikTok</span>
              <input type="url" value={data.tiktokLink || ""} onChange={(e) => updateField("tiktokLink", e.target.value)} placeholder="https://tiktok.com/@shop/..." className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* ===== Botões ===== */}
          <div className="flex gap-3 pt-3">
            <button onClick={handleSave} disabled={!data.description.trim()} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              <Save className="w-4 h-4" />
              Criar Produto
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-secondary hover:bg-accent text-foreground rounded-xl transition-colors text-sm border border-border">
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---- Mini componentes de campo ---- */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-accent">{icon}</span>
      <span className="text-foreground text-sm font-medium">{title}</span>
    </div>
  );
}

function PriceField({ label, value, onChange, small }: { label: string; value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div>
      <label className="text-muted-foreground text-[11px] mb-1 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
        <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} placeholder="0,00" className={`w-full bg-secondary border border-border rounded-xl pl-8 pr-3 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring ${small ? "py-2" : "py-2.5"}`} />
      </div>
    </div>
  );
}

function PctField({ label, value, onChange, small }: { label: string; value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div>
      <label className="text-muted-foreground text-[11px] mb-1 block">{label}</label>
      <div className="relative">
        <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} placeholder="0" className={`w-full bg-secondary border border-border rounded-xl px-3 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring ${small ? "py-2" : "py-2.5"}`} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">%</span>
      </div>
    </div>
  );
}

function IntField({ label, value, onChange, small }: { label: string; value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div>
      <label className="text-muted-foreground text-[11px] mb-1 block">{label}</label>
      <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} placeholder="0" className={`w-full bg-secondary border border-border rounded-xl px-3 text-foreground text-xs outline-none focus:ring-2 focus:ring-ring ${small ? "py-2" : "py-2.5"}`} />
    </div>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
