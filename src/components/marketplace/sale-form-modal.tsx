"use client";

import { useState } from "react";
import { Product, Sale, CHANNELS, PAYMENT_METHODS, PaymentMethod } from "@/data/products";
import { motion } from "framer-motion";
import { X, ShoppingCart, CreditCard, Smartphone, DollarSign } from "lucide-react";

interface SaleFormModalProps {
  product: Product;
  onClose: () => void;
  onSave: (sale: Sale) => void;
  userName?: string;
  userAvatar?: string;
}

const PAYMENT_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  debito: CreditCard,
  pix: Smartphone,
  credito: CreditCard,
  dinheiro: DollarSign,
};

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  debito: "#3b82f6",
  pix: "#22c55e",
  credito: "#f59e0b",
  dinheiro: "#a1a1aa",
};

export function SaleFormModal({ product, onClose, onSave, userName, userAvatar }: SaleFormModalProps) {
  const [qty, setQty] = useState(1);
  const [channel, setChannel] = useState(product.channel || "Loja Física");
  const [unitPrice, setUnitPrice] = useState(product.amount);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");

  const totalAmount = qty * unitPrice;
  const totalCost = qty * product.cost;
  const totalShipping = qty * product.shipping;
  const totalProfit = (totalAmount - totalCost) * (1 - (product.commissionPct || 0) / 100) - totalShipping;

  const handleSave = () => {
    if (qty <= 0 || qty > product.stock) return;
    const sale: Sale = {
      id: `sh-${Date.now()}`, productId: product.id, productName: product.description,
      qty, unitPrice, totalAmount, channel, date, profit: totalProfit,
      paymentMethod,
      commissionPct: product.commissionPct, shipping: product.shipping,
      registeredBy: userName || "",
      registeredByAvatar: userAvatar || "",
    };
    onSave(sale);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-lg">Lançar Venda</h2>
              <p className="text-muted-foreground text-xs">{product.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Registered by */}
          {userName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 border border-border/50 rounded-xl px-3 py-2">
              <span>Venda registrada por</span>
              <div className="flex items-center gap-1.5 bg-secondary px-2 py-0.5 rounded-md">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-[8px] font-bold">{(userName || "U").charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="text-foreground font-medium">{userName}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-secondary/50 border border-border rounded-2xl">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-foreground font-semibold text-sm">{product.description}</div>
              <div className="text-muted-foreground text-xs">{product.category} · {product.sku}</div>
              <div className="text-foreground font-bold text-sm mt-0.5">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.amount)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">Estoque</div>
              <div className={`text-lg font-black ${product.stock <= (product.minStock || 5) ? "text-yellow-500" : "text-foreground"}`}>
                {product.stock}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Quantidade</label>
              <input type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              {qty > product.stock && <p className="text-red-500 text-[11px] mt-1">Estoque insuficiente</p>}
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Preço Unitário (R$)</label>
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Canal de Venda</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                {CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1.5 block">Data da Venda</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none" />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-xs mb-2 block">Forma de Pagamento</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = PAYMENT_ICONS[pm.value];
                const isSelected = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      isSelected
                        ? "border-foreground bg-foreground/5 shadow-sm"
                        : "border-border bg-secondary hover:border-foreground/30"
                    }`}
                  >
                    <Icon size={18} style={{ color: isSelected ? PAYMENT_COLORS[pm.value] : "hsl(var(--muted-foreground))" }} />
                    <span className={`text-[10px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {pm.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-2xl p-4 space-y-3">
            <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Resumo da Venda</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total da Venda</span>
                <span className="text-foreground font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo Total</span>
                <span className="text-muted-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalCost)}</span>
              </div>
              {product.commissionPct > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comissão ({product.commissionPct}%)</span>
                  <span className="text-orange-500">-{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAmount * product.commissionPct / 100)}</span>
                </div>
              )}
              {product.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-orange-500">-{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalShipping)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground font-medium">Lucro Real</span>
                <span className={`text-lg font-black ${totalProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={qty <= 0 || qty > product.stock} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              <ShoppingCart className="w-4 h-4" />
              Confirmar Venda
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
