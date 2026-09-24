"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase, Profile } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Loader2, RefreshCw, Trash2, Check, Database,
  Package, ShoppingCart, DollarSign, Activity, Search, Download,
  Settings, BarChart3, Clock, HardDrive, Wrench,
  Zap, RotateCcw, Camera, X, Save, UserCog, Key,
  Eye, EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";

async function adminHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DATABASE SETUP COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function DatabaseSetup({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [status, setStatus] = useState<"idle" | "checking" | "loading" | "success" | "error" | "tablesExist">("checking");
  const [message, setMessage] = useState("Verificando tabelas...");

  const checkTables = async () => {
    setStatus("checking");
    setMessage("Verificando tabelas...");
    try {
      const res = await fetch("/api/setup/tables", { headers: await adminHeaders() });
      const data = await res.json();
      if (data.ok && data.tablesExist) {
        setStatus("tablesExist");
        setMessage("Tabelas de categorias e tags já existem no banco!");
        onSetupComplete();
      } else {
        setStatus("idle");
        setMessage(data.message || "Tabelas não encontradas");
      }
    } catch {
      setStatus("error");
      setMessage("Erro ao verificar tabelas");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => checkTables(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetup = async () => {
    setStatus("loading");
    setMessage("Criando tabelas...");
    try {
      const res = await fetch("/api/setup/tables", { method: "POST", headers: await adminHeaders() });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        setMessage(data.message || "Tabelas criadas com sucesso!");
        onSetupComplete();
      } else {
        setStatus("error");
        setMessage(data.message || "Erro ao criar tabelas");
      }
    } catch {
      setStatus("error");
      setMessage("Erro de conexão com o servidor");
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(`-- FN Dash Loja — Categorias + Tags
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  icon text DEFAULT '',
  color text DEFAULT '#64748b',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, parent_id)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_tags_all" ON public.product_tags FOR ALL USING (true) WITH CHECK (true);`);
    setMessage("SQL copiado!");
    setStatus("success");
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-foreground text-sm font-semibold mb-1">Configuração do Banco de Dados</h3>
            {status === "tablesExist" ? (
              <>
                <p className="text-emerald-400 text-xs mb-3">Tabelas de categorias e tags já existem!</p>
                <button onClick={checkTables}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-accent transition-colors border border-border">
                  <RefreshCw className="w-3.5 h-3.5" /> Verificar novamente
                </button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-xs mb-4">Execute o SQL para criar as tabelas necessárias.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleSetup} disabled={status === "loading" || status === "checking"}
                    className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                    {status === "loading" ? "Criando..." : "Criar tabelas"}
                  </button>
                  <button onClick={copySql}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-accent transition-colors border border-border">
                    <Download className="w-3.5 h-3.5" /> Copiar SQL
                  </button>
                  <a href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-accent transition-colors border border-border">
                    Abrir Supabase SQL
                  </a>
                </div>
              </>
            )}
            {message && status !== "tablesExist" && (
              <p className={`text-xs mt-3 ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EDIT USER MODAL
   ═══════════════════════════════════════════════════════════════════ */
interface EditUserModalProps {
  profile: Profile;
  onClose: () => void;
  onSave: (updated: Profile) => void;
}

function EditUserModal({ profile: p, onClose, onSave }: EditUserModalProps) {
  const [email, setEmail] = useState(p.email);
  const [username, setUsername] = useState(p.username || "");
  const [avatar, setAvatar] = useState(p.avatar || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "family">(p.role);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage("Imagem muito grande (máx 2MB)"); setMessageType("error"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `avatars/${p.id}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatar(urlData.publicUrl + "?t=" + Date.now());
      setMessage("Foto atualizada!");
      setMessageType("success");
    } catch (err: unknown) {
      setMessage("Erro ao enviar: " + getErrorMessage(err, "Tente novamente"));
      setMessageType("error");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      // Validate password if provided
      if (newPassword) {
        if (newPassword.length < 6) { setMessage("Senha deve ter pelo menos 6 caracteres"); setMessageType("error"); setSaving(false); return; }
        if (newPassword !== confirmPassword) { setMessage("Senhas não coincidem"); setMessageType("error"); setSaving(false); return; }
      }

      const updates: Record<string, string | boolean | null> = {
        username: username.trim() || null,
        avatar: avatar || null,
        role,
        updated_at: new Date().toISOString(),
      };

      // Use admin API route for email/password changes or profile updates
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: await adminHeaders(),
        body: JSON.stringify({
          userId: p.id,
          email: email !== p.email ? email : undefined,
          password: newPassword || undefined,
          ...updates,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);

      setMessage("Perfil salvo com sucesso!");
      setMessageType("success");
      onSave({ ...p, ...updates, email } as Profile);
      setTimeout(() => { onClose(); }, 1500);
    } catch (err: unknown) {
      setMessage("Erro ao salvar: " + getErrorMessage(err, "Tente novamente"));
      setMessageType("error");
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold text-sm">Editar Usuário</h2>
              <p className="text-muted-foreground text-xs">{email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : (username || p.email)[0].toUpperCase()}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">{username || "Sem nome"}</p>
              <p className="text-muted-foreground text-xs">{p.email}</p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="text-[10px] text-violet-500 hover:text-violet-400 transition-colors">
                  {uploading ? "Enviando..." : "Alterar foto"}
                </button>
                {avatar && (
                  <button onClick={() => setAvatar("")}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-muted-foreground text-xs mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
            {email !== p.email && (
              <p className="text-amber-500 text-[10px] mt-1">O email será atualizado no auth e no perfil</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="text-muted-foreground text-xs mb-1.5 block">Nome de usuário</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de exibição"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Role */}
          <div>
            <label className="text-muted-foreground text-xs mb-1.5 block">Cargo</label>
            <div className="flex gap-2">
              {(["admin", "family"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    role === r
                      ? r === "admin" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-secondary text-muted-foreground border-border hover:bg-accent"
                  }`}>
                  {r === "admin" ? "Administrador" : "Usuário"}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-medium">Alterar senha</span>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 pr-10 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              )}
              {newPassword && newPassword.length < 6 && (
                <p className="text-amber-500 text-[10px]">A senha deve ter pelo menos 6 caracteres</p>
              )}
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-[10px]">As senhas não coincidem</p>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <p className={`text-xs ${messageType === "error" ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border bg-secondary/30">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-secondary hover:bg-accent text-foreground border border-border transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
interface TableCount { table: string; count: number; }

export default function AdminPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "system" | "database">("users");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile && profile.role !== "admin") { router.push("/"); return; }
    if (profile) { loadProfiles(); loadTableCounts(); }
  }, [profile, router]);

  async function loadProfiles() {
    setLoading(true); setError(null);
    try {
      const { data, error: q } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (q) { setError("Erro ao carregar: " + q.message); setProfiles([]); }
      else setProfiles(data || []);
    } catch (e: unknown) { setError("Erro de conexão: " + getErrorMessage(e, "")); setProfiles([]); }
    setLoading(false);
  }

  async function loadTableCounts() {
    setLoadingTables(true);
    const tables = ["profiles", "products", "sales", "expenses", "categories", "product_tags", "channels"];
    const counts: TableCount[] = [];
    for (const t of tables) {
      try {
        const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
        counts.push({ table: t, count: count || 0 });
      } catch { counts.push({ table: t, count: 0 }); }
    }
    setTableCounts(counts);
    setLoadingTables(false);
  }

  async function toggleRole(p: Profile) {
    if (p.id === user?.id) return;
    const newRole = p.role === "admin" ? "family" : "admin";
    setActionLoading(p.id);
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole, updated_at: new Date().toISOString() }).eq("id", p.id);
      if (error) alert("Erro ao alterar cargo: " + error.message);
      else setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, role: newRole } : x)));
    } catch (e: unknown) { alert("Erro: " + getErrorMessage(e, "")); }
    setActionLoading(null);
  }

  async function deleteUser(p: Profile) {
    if (p.id === user?.id) return;
    if (!confirm(`Excluir "${p.username || p.email}"? Todos os dados serão perdidos.`)) return;
    setActionLoading(p.id);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", p.id);
      if (error) alert("Erro ao excluir: " + error.message);
      else setProfiles((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e: unknown) { alert("Erro: " + getErrorMessage(e, "")); }
    setActionLoading(null);
  }

  async function clearTable(tableName: string) {
    if (!confirm(`Tem certeza que deseja limpar a tabela "${tableName}"? Todos os dados serão perdidos!`)) return;
    try {
      const { error } = await supabase.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) alert("Erro: " + error.message);
      else loadTableCounts();
    } catch (e: unknown) { alert("Erro: " + getErrorMessage(e, "")); }
  }

  async function exportTable(tableName: string) {
    try {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `fn-dash-${tableName}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e: unknown) { alert("Erro ao exportar: " + getErrorMessage(e, "")); }
  }

  if (profile && profile.role !== "admin") return null;

  const filteredProfiles = profiles.filter((p) =>
    !search || (p.username || "").toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = tableCounts.find((t) => t.table === "products")?.count || 0;
  const totalSales = tableCounts.find((t) => t.table === "sales")?.count || 0;
  const totalExpenses = tableCounts.find((t) => t.table === "expenses")?.count || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-6 h-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            </div>
            <p className="text-muted-foreground text-sm">Gerencie usuários, dados e configurações do sistema</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-2">
            {[
              { id: "users" as const, label: "Usuários", icon: Users },
              { id: "database" as const, label: "Banco de Dados", icon: Database },
              { id: "system" as const, label: "Sistema", icon: Settings },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ USERS TAB ═══ */}
          {activeTab === "users" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Usuários", value: profiles.length, icon: Users, color: "text-blue-500" },
                  { label: "Admins", value: profiles.filter((p) => p.role === "admin").length, icon: Shield, color: "text-amber-500" },
                  { label: "Família", value: profiles.filter((p) => p.role === "family").length, icon: Users, color: "text-emerald-500" },
                  { label: "Produtos", value: totalProducts, icon: Package, color: "text-violet-500" },
                ].map((s) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground text-xs">{s.label}</span>
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-foreground">{s.value}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-muted-foreground font-medium">Usuários Registrados</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground outline-none focus:ring-1 focus:ring-ring w-44" />
                        </div>
                        <button onClick={loadProfiles} disabled={loading}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Recarregar">
                          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : error ? (
                      <div className="text-center py-10 space-y-3">
                        <p className="text-destructive text-sm">{error}</p>
                        <button onClick={loadProfiles} className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-accent transition-colors">
                          Tentar novamente
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="hidden sm:flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground font-medium">
                          <div className="w-10" /><div className="flex-1">Usuário</div>
                          <div className="w-28 text-center">Cargo</div>
                          <div className="w-20 text-center">Cadastro</div>
                          <div className="w-24 text-center">Ações</div>
                        </div>
                        {filteredProfiles.map((p) => {
                          const isMe = p.id === user?.id;
                          const isLoading = actionLoading === p.id;
                          return (
                            <div key={p.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                              isMe ? "border-amber-500/30 bg-amber-500/5" : "border-border hover:bg-secondary/50"}`}>
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                                {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                  : (p.username || p.email)[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                                  {p.username || "Sem nome"}
                                  {isMe && <span className="text-[10px] text-amber-500">(você)</span>}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                              </div>
                              <div className="w-28 flex justify-center">
                                <button onClick={() => toggleRole(p)} disabled={isMe || isLoading}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                                    p.role === "admin" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                                      : "bg-secondary text-muted-foreground border-border hover:bg-accent"
                                  } ${isMe ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  {p.role}
                                </button>
                              </div>
                              <div className="w-20 text-center hidden sm:block">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                                </span>
                              </div>
                              <div className="w-24 flex justify-center gap-1">
                                <button onClick={() => setEditingUser(p)} disabled={isLoading}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors" title="Editar">
                                  <UserCog className="w-4 h-4" />
                                </button>
                                {!isMe && (
                                  <button onClick={() => deleteUser(p)} disabled={isLoading}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {filteredProfiles.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">Nenhum usuário encontrado</div>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {/* ═══ DATABASE TAB ═══ */}
          {activeTab === "database" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <Database className="w-4 h-4" /> Tabelas do Banco
                    </CardTitle>
                    <button onClick={loadTableCounts} disabled={loadingTables}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className={`w-4 h-4 ${loadingTables ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTables ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="space-y-2">
                      {tableCounts.map((t) => (
                        <div key={t.table} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                              <HardDrive className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="text-foreground text-sm font-medium">{t.table}</span>
                              <p className="text-muted-foreground text-[11px]">{t.count} registros</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => exportTable(t.table)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Exportar JSON">
                              <Download className="w-4 h-4" />
                            </button>
                            {t.table !== "profiles" && (
                              <button onClick={() => clearTable(t.table)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Limpar tabela">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ SYSTEM TAB ═══ */}
          {activeTab === "system" && (
            <div className="space-y-4">
              <DatabaseSetup onSetupComplete={loadTableCounts} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-card border-border h-full">
                    <CardHeader><CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Resumo Geral
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: "Produtos cadastrados", value: totalProducts, icon: Package, color: "text-violet-500" },
                        { label: "Vendas registradas", value: totalSales, icon: ShoppingCart, color: "text-emerald-500" },
                        { label: "Despesas registradas", value: totalExpenses, icon: DollarSign, color: "text-amber-500" },
                        { label: "Usuários ativos", value: profiles.length, icon: Users, color: "text-blue-500" },
                        { label: "Categorias criadas", value: tableCounts.find((t) => t.table === "categories")?.count || 0, icon: Activity, color: "text-pink-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                          <div className="flex items-center gap-2">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <span className="text-foreground text-sm">{item.label}</span>
                          </div>
                          <span className="text-foreground text-sm font-bold">{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Card className="bg-card border-border h-full">
                    <CardHeader><CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Informações
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: "Seu ID", value: user?.id?.slice(0, 12) + "..." || "—" },
                        { label: "Seu cargo", value: profile?.role || "—" },
                        { label: "Total de tabelas", value: tableCounts.length.toString() },
                        { label: "Último login", value: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                          <span className="text-muted-foreground text-sm">{item.label}</span>
                          <span className="text-foreground text-sm font-medium font-mono">{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="bg-card border-border h-full">
                    <CardHeader><CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Ações Rápidas
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: "Limpar cache local", desc: "Remove dados do navegador", icon: RotateCcw, color: "text-orange-500", action: () => { localStorage.clear(); alert("Cache limpo!"); } },
                        { label: "Recarregar tudo", desc: "Force reload dos dados", icon: RefreshCw, color: "text-blue-500", action: () => { loadProfiles(); loadTableCounts(); } },
                        { label: "Exportar dados", desc: "Backup completo em JSON", icon: Download, color: "text-emerald-500", action: async () => {
                          const [p, s, e] = await Promise.all([
                            supabase.from("products").select("*"),
                            supabase.from("sales").select("*"),
                            supabase.from("expenses").select("*"),
                          ]);
                          const data = { exportDate: new Date().toISOString(), products: p.data || [], sales: s.data || [], expenses: e.data || [] };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url;
                          a.download = `fn-dash-backup-${new Date().toISOString().slice(0, 10)}.json`;
                          a.click(); URL.revokeObjectURL(url);
                        }},
                      ].map((item) => (
                        <button key={item.label} onClick={item.action}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <span className="text-foreground text-sm font-medium block">{item.label}</span>
                            <span className="text-muted-foreground text-[11px]">{item.desc}</span>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            profile={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={(updated) => {
              setProfiles((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
              setEditingUser(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
