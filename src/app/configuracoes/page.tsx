"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { LayoutSelector } from "@/components/layout/layout-selector";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import {
  User, Bell, Shield, Palette, Loader2, Camera, Check, RefreshCw,
  Key, Download, Trash2, Info, Globe, ExternalLink, Zap, HardDrive, Accessibility,
  Save, CreditCard, Percent, DollarSign, Calendar
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";

const LOG_PREFIX = "[CONFIG]";
function log(msg: string, data?: unknown) {
  if (data !== undefined) console.log(`${LOG_PREFIX} ${msg}`, data);
  else console.log(`${LOG_PREFIX} ${msg}`);
}

export default function ConfiguracoesPage() {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState(profile?.username || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState({
    estoque: profile?.notifications?.estoque ?? true,
    vendas: profile?.notifications?.vendas ?? true,
    relatorios: profile?.notifications?.relatorios ?? false,
  });
  const [settings, setSettings] = useState({
    font_size: profile?.settings?.font_size ?? "14",
    reduce_motion: profile?.settings?.reduce_motion ?? false,
    high_contrast: profile?.settings?.high_contrast ?? false,
    preferred_payment_method: profile?.settings?.preferred_payment_method ?? "pix",
    default_tax_rate: profile?.settings?.default_tax_rate ?? 0,
    currency_format: profile?.settings?.currency_format ?? "BRL",
    date_format: profile?.settings?.date_format ?? "DD/MM/YYYY",
    layout: profile?.settings?.layout ?? "modern",
    color_mode: profile?.settings?.color_mode ?? "dark",
  });
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setAvatar(profile.avatar || "");
      setNotifs({
        estoque: profile.notifications?.estoque ?? true,
        vendas: profile.notifications?.vendas ?? true,
        relatorios: profile.notifications?.relatorios ?? false,
      });
      if (profile.settings) {
        setSettings(profile.settings);
        applySettings(profile.settings);
      }
    }
  }, [profile?.id, profile?.avatar, profile?.username, profile?.notifications, profile?.settings]);

  const applySettings = (s: typeof settings) => {
    document.documentElement.style.setProperty("--font-size-base", `${s.font_size}px`);
    document.documentElement.classList.toggle("reduce-motion", s.reduce_motion);
    document.documentElement.classList.toggle("high-contrast", s.high_contrast);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({
        username,
        avatar,
        notifications: notifs,
        settings,
      });
      if (result.error) {
        showToast("Erro ao salvar: " + result.error, "error");
      } else {
        showToast("Configurações salvas com sucesso!", "success");
      }
    } catch (e: any) {
      showToast("Erro ao salvar: " + (e?.message || ""), "error");
    }
    setSaving(false);
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Imagem muito grande (máx 2MB)", "error");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `avatars/${profile.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      setAvatar(publicUrl);
      showToast("Foto de perfil atualizada!", "success");
    } catch (err: any) {
      showToast("Erro ao enviar foto: " + (err.message || "Tente novamente."), "error");
    }
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    setAvatar("");
    showToast("Foto de perfil removida", "info");
  };

  const handleForceRefresh = async () => {
    await refreshProfile();
    showToast("Perfil recarregado!", "success");
  };

  const handleNotifToggle = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "font_size") {
      document.documentElement.style.setProperty("--font-size-base", `${value}px`);
    } else if (key === "reduce_motion") {
      document.documentElement.classList.toggle("reduce-motion", value as boolean);
    } else if (key === "high_contrast") {
      document.documentElement.classList.toggle("high-contrast", value as boolean);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        showToast("Senha alterada com sucesso!", "success");
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordModal(false);
        }, 2000);
      }
    } catch (e: any) {
      setPasswordError("Erro ao alterar senha: " + (e?.message || ""));
    }
    setChangingPassword(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    setExportSuccess(false);
    try {
      const [p, s, e, c, t, pr, ch] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("sales").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("product_tags").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("channels").select("*"),
      ]);
      const data = {
        exportDate: new Date().toISOString(),
        version: APP_VERSION,
        products: p.data || [],
        sales: s.data || [],
        expenses: e.data || [],
        categories: c.data || [],
        tags: t.data || [],
        profiles: pr.data || [],
        channels: ch.data || [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fn-dash-backup-completo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      showToast("Backup exportado com sucesso!", "success");
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e: any) {
      showToast("Erro ao exportar: " + (e?.message || ""), "error");
    }
    setExporting(false);
  };

  const sections = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "preferencias", label: "Preferências", icon: Zap },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "acessibilidade", label: "Acessibilidade", icon: Accessibility },
    { id: "dados", label: "Dados", icon: HardDrive },
    { id: "sistema", label: "Sistema", icon: Info },
  ];

  const paymentMethods = [
    { value: "pix", label: "PIX" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "debit_card", label: "Cartão de Débito" },
    { value: "cash", label: "Dinheiro" },
    { value: "bank_transfer", label: "Transferência Bancária" },
  ];

  const currencyFormats = [
    { value: "BRL", label: "R$ (Real)" },
    { value: "USD", label: "$ (Dólar)" },
    { value: "EUR", label: "€ (Euro)" },
  ];

  const dateFormats = [
    { value: "DD/MM/YYYY", label: "DD/MM/AAAA" },
    { value: "MM/DD/YYYY", label: "MM/DD/AAAA" },
    { value: "YYYY-MM-DD", label: "AAAA-MM-DD" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
              <p className="text-muted-foreground text-sm">Gerencie seu perfil, preferências e sistema</p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg shadow-violet-500/20"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Salvando..." : "Salvar Tudo"}
            </button>
          </motion.div>

          {/* Quick Nav */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sections.map((s) => (
              <button key={s.id}
                onClick={() => document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:border-[var(--ring)]/30"
                }`}
              >
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </motion.div>

          {/* ═══ ROW 1: Perfil + Aparência + Notificações ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Perfil */}
            <motion.div id="section-perfil" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <User className="w-4 h-4" /> Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer group flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
                        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                          : (username || profile?.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                          : <Camera className="w-4 h-4 text-white" />}
                      </div>
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleAvatarUpload} />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-sm font-medium">Foto de perfil</div>
                      <div className="text-muted-foreground text-[11px]">{uploading ? "Enviando..." : "Clique para escolher (máx 2MB)"}</div>
                      {avatar && <button onClick={handleRemoveAvatar} className="text-[11px] text-destructive hover:underline">Remover</button>}
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">Nome de usuário</label>
                    <input type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">E-mail</label>
                    <input type="email" value={profile?.email || ""} disabled
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="capitalize text-sm">{profile?.role || "user"}</span>
                    {profile?.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium ml-auto">Admin</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Aparência */}
            <motion.div id="section-aparencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Aparência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-t border-border pt-4">
                    <LayoutSelector />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notificações */}
            <motion.div id="section-notificacoes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {([
                    { key: "estoque" as const, label: "Estoque baixo", desc: "Alertas de estoque mínimo" },
                    { key: "vendas" as const, label: "Novas vendas", desc: "A cada venda registrada" },
                    { key: "relatorios" as const, label: "Relatórios semanais", desc: "Resumo de performance" },
                  ]).map((n) => (
                    <div key={n.key} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground text-sm font-medium block">{n.label}</span>
                        <span className="text-muted-foreground text-[11px]">{n.desc}</span>
                      </div>
                      <button onClick={() => handleNotifToggle(n.key)}
                        className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 flex-shrink-0 ml-2 ${notifs[n.key] ? "bg-[var(--ring)]" : "bg-muted"}`}>
                        <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all duration-200 ${notifs[n.key] ? "left-[20px]" : "left-[2px]"}`} />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ═══ ROW 2: Preferências + Acessibilidade + Dados ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Preferências */}
            <motion.div id="section-preferencias" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-violet-500" />
                      <span className="text-foreground text-sm font-medium">Forma de pagamento padrão</span>
                    </div>
                    <select
                      value={settings.preferred_payment_method}
                      onChange={(e) => handleSettingChange("preferred_payment_method", e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    >
                      {paymentMethods.map((pm) => (
                        <option key={pm.value} value={pm.value}>{pm.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-emerald-500" />
                      <span className="text-foreground text-sm font-medium">Taxa padrão (%)</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={settings.default_tax_rate}
                      onChange={(e) => handleSettingChange("default_tax_rate", parseFloat(e.target.value) || 0)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-amber-500" />
                      <span className="text-foreground text-sm font-medium">Moeda</span>
                    </div>
                    <select
                      value={settings.currency_format}
                      onChange={(e) => handleSettingChange("currency_format", e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    >
                      {currencyFormats.map((cf) => (
                        <option key={cf.value} value={cf.value}>{cf.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-cyan-500" />
                      <span className="text-foreground text-sm font-medium">Formato de data</span>
                    </div>
                    <select
                      value={settings.date_format}
                      onChange={(e) => handleSettingChange("date_format", e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    >
                      {dateFormats.map((df) => (
                        <option key={df.value} value={df.value}>{df.label}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Acessibilidade */}
            <motion.div id="section-acessibilidade" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <Accessibility className="w-4 h-4" /> Acessibilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground text-sm font-medium">Tamanho da fonte</span>
                      <span className="text-muted-foreground text-xs">{settings.font_size}px</span>
                    </div>
                    <div className="flex gap-1">
                      {["12", "13", "14", "15", "16"].map((fs) => (
                        <button key={fs} onClick={() => handleSettingChange("font_size", fs)}
                          className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
                            settings.font_size === fs ? "bg-[var(--ring)] text-[var(--background)]" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                          }`}>{fs}</button>
                      ))}
                    </div>
                  </div>
                  {[
                    { label: "Reduzir movimento", desc: "Desativa animações", key: "reduce_motion" as const },
                    { label: "Alto contraste", desc: "Aumenta contraste", key: "high_contrast" as const },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div>
                        <span className="text-foreground text-sm font-medium block">{item.label}</span>
                        <span className="text-muted-foreground text-[11px]">{item.desc}</span>
                      </div>
                      <button onClick={() => handleSettingChange(item.key, !settings[item.key])}
                        className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 flex-shrink-0 ml-2 ${settings[item.key] ? "bg-[var(--ring)]" : "bg-muted"}`}>
                        <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all duration-200 ${settings[item.key] ? "left-[20px]" : "left-[2px]"}`} />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Dados */}
            <motion.div id="section-dados" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <HardDrive className="w-4 h-4" /> Backup & Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button onClick={handleExportData} disabled={exporting}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors text-left">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-foreground text-sm font-semibold block">
                        {exporting ? "Exportando..." : exportSuccess ? "Backup salvo!" : "Fazer backup local"}
                      </span>
                      <span className="text-muted-foreground text-[11px]">Baixa arquivo JSON com todos os dados: produtos, vendas, despesas, categorias, tags, perfis e canais</span>
                    </div>
                    {exportSuccess && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Info className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <span className="text-foreground text-sm font-medium block">Importar dados</span>
                        <span className="text-muted-foreground text-[11px]">Restaurar de backup</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Em breve</span>
                    </div>
                  </div>
                  <button onClick={() => { localStorage.clear(); showToast("Cache limpo!", "info"); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-foreground text-sm font-medium block">Limpar cache</span>
                      <span className="text-muted-foreground text-[11px]">Remove dados temporários</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Segurança */}
            <motion.div id="section-seguranca" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <Key className="w-4 h-4" /> Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Senha", desc: "Alterar senha da conta", action: "Alterar", onClick: () => setShowPasswordModal(true) },
                    { label: "Sessões ativas", desc: "Dispositivos conectados", action: "Gerenciar", onClick: () => setShowSessionsModal(true) },
                    { label: "Autenticação 2FA", desc: "Camada extra de segurança", action: "Em breve", disabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div>
                        <span className="text-foreground text-sm font-medium">{item.label}</span>
                        <p className="text-muted-foreground text-[11px]">{item.desc}</p>
                      </div>
                      {item.disabled ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{item.action}</span>
                      ) : (
                        <button onClick={item.onClick} className="text-xs px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-accent transition-colors">{item.action}</button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sistema */}
            <motion.div id="section-sistema" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="bg-card border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <Info className="w-4 h-4" /> Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Versão", value: APP_VERSION, color: "text-violet-500" },
                      { label: "Cargo", value: profile?.role || "user", color: "text-amber-500" },
                      { label: "Banco", value: "Supabase", color: "text-emerald-500" },
                      { label: "Sync", value: "Tempo real", color: "text-cyan-500" },
                    ].map((item) => (
                      <div key={item.label} className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 text-center">
                        <div className="text-muted-foreground text-[10px] mb-0.5">{item.label}</div>
                        <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleForceRefresh}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-accent text-foreground text-sm font-medium rounded-xl border border-border transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Reload Profile
                  </button>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                    <Globe className="w-3 h-3" /> Documentação <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ═══ PASSWORD MODAL ═══ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-foreground font-semibold text-lg mb-1">Alterar Senha</h3>
            <p className="text-muted-foreground text-sm mb-4">Digite sua nova senha abaixo</p>
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">Nova senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1 block">Confirmar senha</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
              </div>
              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
              {passwordSuccess && <p className="text-emerald-400 text-xs">Senha alterada com sucesso!</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleChangePassword} disabled={changingPassword || !newPassword}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {changingPassword ? "Alterando..." : "Alterar Senha"}
              </button>
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); }}
                className="px-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border hover:bg-accent transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ SESSIONS MODAL ═══ */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSessionsModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-foreground font-semibold text-lg mb-1">Sessões Ativas</h3>
            <p className="text-muted-foreground text-sm mb-4">Dispositivos conectados à sua conta</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">Sessão atual</p>
                  <p className="text-muted-foreground text-[11px]">Este navegador agora</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">Ativa</span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs mt-4 text-center">
              Outras sessões aparecerão aqui quando você fizer login em outros dispositivos.
            </p>
            <button onClick={() => setShowSessionsModal(false)}
              className="w-full mt-4 px-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border hover:bg-accent transition-colors">
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}