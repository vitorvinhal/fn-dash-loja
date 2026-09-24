"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDb } from "@/lib/db-context";
import { EXPENSE_CATEGORIES, Expense } from "@/data/products";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Droplets, Wifi, Zap, FileText, Plus, Trash2, Edit3,
  CheckCircle2, Circle, DollarSign, TrendingDown, Loader2,
  Receipt, Calendar, AlertTriangle, ShoppingBag, Save
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  "Aluguel": Home,
  "Água": Droplets,
  "Luz": Zap,
  "Internet": Wifi,
  "IPTU": FileText,
  "Telefone": Receipt,
  "Transporte": TrendingDown,
  "Embalagens": Receipt,
  "Compra de Produtos": ShoppingBag,
  "Outros": DollarSign,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Aluguel": "#f472b6",
  "Água": "#22d3ee",
  "Luz": "#facc15",
  "Internet": "#a78bfa",
  "IPTU": "#fb923c",
  "Telefone": "#34d399",
  "Transporte": "#f87171",
  "Embalagens": "#818cf8",
  "Compra de Produtos": "#2dd4bf",
  "Outros": "#94a3b8",
};

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, "Compra de Produtos"];

export default function DespesasPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useDb();
  const [showForm, setShowForm] = useState(false);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: "Aluguel", description: "", amount: 0, dueDate: new Date().toISOString().split("T")[0], recurring: true });
  const [saving, setSaving] = useState(false);

  const rent = useMemo(() => expenses.find((e) => e.category === "Aluguel"), [expenses]);
  const utilities = useMemo(() => expenses.filter((e) => !["Aluguel", "IPTU", "Compra de Produtos"].includes(e.category)), [expenses]);
  const iptu = useMemo(() => expenses.find((e) => e.category === "IPTU"), [expenses]);
  const compras = useMemo(() => expenses.filter((e) => e.category === "Compra de Produtos"), [expenses]);

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalPaid = useMemo(() => expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalPending = totalExpenses - totalPaid;

  const rentAmount = rent?.amount || 0;
  const rentPaid = rent?.paid ? rentAmount : 0;
  const rentProgress = rentAmount > 0 ? (rentPaid / rentAmount) * 100 : 0;

  const openAdd = () => {
    setEditingExp(null);
    setForm({ category: "Aluguel", description: "", amount: 0, dueDate: new Date().toISOString().split("T")[0], recurring: true });
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingExp(exp);
    setForm({ category: exp.category, description: exp.description, amount: exp.amount, dueDate: exp.dueDate, recurring: exp.recurring });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description.trim() || form.amount <= 0) return;
    setSaving(true);
    if (editingExp) {
      await updateExpense(editingExp.id, { ...form });
    } else {
      await addExpense({ id: `exp-${Date.now()}`, ...form, paid: false });
    }
    setForm({ category: "Aluguel", description: "", amount: 0, dueDate: new Date().toISOString().split("T")[0], recurring: true });
    setEditingExp(null);
    setShowForm(false);
    setSaving(false);
  };

  const handleTogglePaid = async (exp: Expense) => {
    await updateExpense(exp.id, {
      paid: !exp.paid,
      paidDate: !exp.paid ? new Date().toISOString().split("T")[0] : undefined,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Despesas</h1>
              <p className="text-muted-foreground text-sm">Controle de gastos da loja</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              Nova Despesa
            </button>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Despesas", value: `R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "#f87171" },
              { label: "Pago", value: `R$ ${totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: CheckCircle2, color: "#34d399" },
              { label: "Pendente", value: `R$ ${totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: AlertTriangle, color: "#fbbf24" },
              { label: "Compras Estoque", value: `R$ ${compras.reduce((s, e) => s + e.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: ShoppingBag, color: "#2dd4bf" },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Card className="bg-card rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                    <div className="text-xl font-bold text-foreground">{kpi.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Rent Progress */}
          {rent && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Aluguel</span>
                    <button onClick={() => openEdit(rent)} className="hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-foreground font-semibold">{rent.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Vencimento: {new Date(rent.dueDate).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        R$ {rentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => handleTogglePaid(rent)}
                        className={`text-xs font-medium mt-1 px-3 py-1 rounded-lg transition-colors ${rent.paid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"}`}
                      >
                        {rent.paid ? "Pago" : "Marcar como pago"}
                      </button>
                    </div>
                  </div>
                  <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rentProgress}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: rent.paid ? "#34d399" : "linear-gradient(90deg, #f87171, #fbbf24)" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{rent.paid ? "Quitado" : `Resta R$ ${(rentAmount - rentPaid).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</span>
                    <span>{Math.round(rentProgress)}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Utilities + IPTU */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-card rounded-3xl h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Zap className="w-4 h-4" /> Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {utilities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço cadastrado</p>
                  ) : (
                    utilities.map((exp) => {
                      const Icon = CATEGORY_ICONS[exp.category] || DollarSign;
                      const color = CATEGORY_COLORS[exp.category] || "#94a3b8";
                      return (
                        <div key={exp.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50 group">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground text-sm font-medium truncate">{exp.description}</div>
                            <div className="text-xs text-muted-foreground">
                              Vence: {new Date(exp.dueDate).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="text-foreground font-semibold text-sm">
                                R$ {exp.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                              <button
                                onClick={() => handleTogglePaid(exp)}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${exp.paid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                              >
                                {exp.paid ? "Pago" : "Pendente"}
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(exp)} className="hover:text-accent p-1 rounded-lg hover:bg-accent/10 text-muted-foreground">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => deleteExpense(exp.id)} className="hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* IPTU */}
            {iptu && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="bg-card rounded-3xl h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> IPTU</span>
                      <button onClick={() => openEdit(iptu)} className="hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fb923c15" }}>
                          <FileText className="w-5 h-5" style={{ color: "#fb923c" }} />
                        </div>
                        <div>
                          <div className="text-foreground text-sm font-medium">{iptu.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Vence: {new Date(iptu.dueDate).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="text-foreground font-semibold">
                            R$ {iptu.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          <button
                            onClick={() => handleTogglePaid(iptu)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${iptu.paid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                          >
                            {iptu.paid ? "Pago" : "Pendente"}
                          </button>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(iptu)} className="hover:text-accent p-1 rounded-lg hover:bg-accent/10 text-muted-foreground">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => deleteExpense(iptu.id)} className="hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Compras de Produtos */}
          {compras.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="bg-card rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="w-4 h-4" /> Compras de Produtos (Estoque)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {compras.map((exp) => (
                    <div key={exp.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50 group">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#2dd4bf15" }}>
                        <ShoppingBag className="w-5 h-5" style={{ color: "#2dd4bf" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground text-sm font-medium truncate">{exp.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Vence: {new Date(exp.dueDate).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="text-foreground font-semibold text-sm">
                            R$ {exp.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          <button
                            onClick={() => handleTogglePaid(exp)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${exp.paid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                          >
                            {exp.paid ? "Pago" : "Pendente"}
                          </button>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(exp)} className="hover:text-accent p-1 rounded-lg hover:bg-accent/10 text-muted-foreground">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => deleteExpense(exp.id)} className="hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* All Expenses List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-4 h-4" /> Todas as Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhuma despesa cadastrada</p>
                  ) : (
                    expenses.map((exp, i) => {
                      const Icon = CATEGORY_ICONS[exp.category] || DollarSign;
                      const color = CATEGORY_COLORS[exp.category] || "#94a3b8";
                      return (
                        <motion.div
                          key={exp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50 group hover:bg-secondary/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground text-sm font-medium truncate">{exp.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {exp.category} · Vence: {new Date(exp.dueDate).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="text-foreground font-semibold text-sm">
                                R$ {exp.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                              <button
                                onClick={() => handleTogglePaid(exp)}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${exp.paid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                              >
                                {exp.paid ? "Pago" : "Pendente"}
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(exp)} className="hover:text-accent p-1 rounded-lg hover:bg-accent/10 text-muted-foreground">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => deleteExpense(exp.id)} className="hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add/Edit Expense Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => { setShowForm(false); setEditingExp(null); }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl"
              >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-foreground font-bold">{editingExp ? "Editar Despesa" : "Nova Despesa"}</h3>
                  <button onClick={() => { setShowForm(false); setEditingExp(null); }} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Categoria</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none">
                      {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Descrição</label>
                    <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex: Conta de Luz - Setembro" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted-foreground text-xs mb-1.5 block">Valor</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <input type="number" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} placeholder="0,00" className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-xs mb-1.5 block">Vencimento</label>
                      <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} className="w-4 h-4 rounded border-border accent-violet-500" />
                    <span className="text-sm text-muted-foreground">Despesa recorrente (mensal)</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSave} disabled={!form.description.trim() || form.amount <= 0} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 text-sm">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingExp ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingExp ? "Salvar Alterações" : "Adicionar"}
                    </button>
                    <button onClick={() => { setShowForm(false); setEditingExp(null); }} className="px-6 py-3 bg-secondary hover:bg-accent text-foreground rounded-xl transition-colors text-sm border border-border">
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
