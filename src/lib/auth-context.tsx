"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase, Profile } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type AuthResult = { error?: string; success?: string };

const LOG_PREFIX = "[AUTH]";

function log(msg: string, data?: unknown) {
  if (data !== undefined) {
    console.log(`${LOG_PREFIX} ${msg}`, data);
  } else {
    console.log(`${LOG_PREFIX} ${msg}`);
  }
}

function logError(msg: string, err?: unknown) {
  console.error(`${LOG_PREFIX} ERROR: ${msg}`, err ?? "");
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error?: string; success?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  updateProfile: async () => ({}),
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfileFromDb(userId: string): Promise<Profile | null> {
  log(`fetchProfileFromDb: buscanco profile para userId=${userId}`);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    logError("fetchProfileFromDb failed", error);
    return null;
  }

  log("fetchProfileFromDb: profile carregado", { id: data.id, email: data.email, avatar: data.avatar ? "(tem avatar)" : "(sem avatar)", username: data.username });
  return data;
}

async function ensureProfile(userId: string, email: string): Promise<Profile> {
  log(`ensureProfile: verificando profile para ${email}`);

  const existing = await fetchProfileFromDb(userId);

  if (existing) {
    // Only force admin role for vitorvinhal90@gmail.com, never override other roles
    if (email === "vitorvinhal90@gmail.com" && existing.role !== "admin") {
      log("ensureProfile: forçando role admin para vitorvinhal90");
      await supabase.from("profiles").upsert({ id: userId, role: "admin" }, { onConflict: "id" });
      existing.role = "admin";
    }
    if (!existing.notifications) existing.notifications = { estoque: true, vendas: true, relatorios: false };
  if (!existing.settings) existing.settings = {
    font_size: "14",
    reduce_motion: false,
    high_contrast: false,
    preferred_payment_method: "pix",
    default_tax_rate: 0,
    currency_format: "BRL",
    date_format: "DD/MM/YYYY",
    layout: "modern",
    color_mode: "dark",
  };
    log("ensureProfile: profile existente retornado", { avatar: existing.avatar ? "(tem)" : "(sem)", username: existing.username, role: existing.role });
    return existing;
  }

  log("ensureProfile: criando novo profile");
  const role = email === "vitorvinhal90@gmail.com" ? "admin" : "family";
  const newProfile: Profile = {
    id: userId,
    email,
    username: email.split("@")[0],
    role,
    avatar: "",
    notifications: { estoque: true, vendas: true, relatorios: false },
    settings: {
      font_size: "14",
      reduce_motion: false,
      high_contrast: false,
      preferred_payment_method: "pix",
      default_tax_rate: 0,
      currency_format: "BRL",
      date_format: "DD/MM/YYYY",
      layout: "modern",
      color_mode: "dark",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase
    .from("profiles")
    .upsert(newProfile, { onConflict: "id" });

  if (insertError) {
    logError("ensureProfile insert failed:", insertError);
  } else {
    log("ensureProfile: novo profile criado com sucesso");
  }

  return newProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<Profile | null>(null);
  const updateCounterRef = useRef(0);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Initial session load
  useEffect(() => {
    log("AuthProvider: carregando sessão inicial...");
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        log("AuthProvider: sessão encontrada, carregando profile", { userId: session.user.id });
        const p = await ensureProfile(session.user.id, session.user.email || "");
        setProfile(p);
        profileRef.current = p;
        log("AuthProvider: profile inicial carregado", { avatar: p.avatar ? "(tem)" : "(sem)", username: p.username });
      } else {
        log("AuthProvider: nenhuma sessão encontrada");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log(`AuthProvider: auth state change - event=${event}`);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Only load profile if we don't have one yet or if it's a different user
        const currentProfile = profileRef.current;
        if (!currentProfile || currentProfile.id !== session.user.id) {
          const p = await ensureProfile(session.user.id, session.user.email || "");
          setProfile(p);
          profileRef.current = p;
          log("AuthProvider: profile atualizado via auth state change");
        } else {
          log("AuthProvider: auth state change ignorado (profile já existe para este usuário)");
        }
      } else {
        setProfile(null);
        profileRef.current = null;
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription for profile changes
  useEffect(() => {
    if (!user) return;
    log(`AuthProvider: inscrevendo no realtime para profile userId=${user.id}`);

    const channel = supabase
      .channel(`profiles-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          log("AuthProvider: realtime event recebido", { event: payload.eventType, new: payload.new });
          const updated = payload.new as Profile;
          setProfile(updated);
          profileRef.current = updated;
          log("AuthProvider: profile atualizado via realtime", { avatar: updated.avatar ? "(tem)" : "(sem)", username: updated.username });
        }
      )
      .subscribe((status) => {
        log(`AuthProvider: realtime subscription status=${status}`);
      });

    return () => {
      log("AuthProvider: removendo realtime subscription");
      supabase.removeChannel(channel);
    };
  // only user?.id intentionally — reiniciar por objeto user causaria re-subscribes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    log("refreshProfile: forçando reload do profile do banco");
    const p = await fetchProfileFromDb(user.id);
    if (p) {
      setProfile(p);
      profileRef.current = p;
      log("refreshProfile: profile recarregado", { avatar: p.avatar ? "(tem)" : "(sem)" });
    }
  }, [user]);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    log(`signIn: tentando login para ${email}`);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logError("signIn failed", error.message);
        return { error: error.message };
      }
      log("signIn: login bem-sucedido");
      return {};
    } catch (e: unknown) {
      logError("signIn exception", e);
      return { error: "Erro de conexão. Verifique sua internet e tente novamente." };
    }
  }

  async function signUp(email: string, password: string, username?: string): Promise<AuthResult> {
    log(`signUp: criando conta para ${email}`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        logError("signUp failed", error.message);
        if (error.message.includes("already") || error.message.includes("registered")) {
          return { error: "Este e-mail já está cadastrado. Faça login." };
        }
        return { error: error.message };
      }
      if (data.user && data.session) {
        const p = await ensureProfile(data.user.id, data.user.email || "");
        setProfile(p);
        profileRef.current = p;
      }
      if (data.user && !data.session) {
        return { error: "", success: "Conta criada! Verifique seu e-mail para confirmar." };
      }
      log("signUp: conta criada com sucesso");
      return {};
    } catch (e: unknown) {
      logError("signUp exception", e);
      return { error: "Erro de conexão. Verifique sua internet e tente novamente." };
    }
  }

  async function signOut() {
    log("signOut: fazendo logout");
    await supabase.auth.signOut();
    setProfile(null);
    profileRef.current = null;
  }

  async function updateProfile(data: Partial<Profile>): Promise<{ error?: string }> {
    const currentUser = user;
    if (!currentUser) {
      logError("updateProfile: usuário não autenticado");
      return { error: "Usuário não autenticado." };
    }

    updateCounterRef.current++;
    const myCounter = updateCounterRef.current;
    log(`updateProfile [${myCounter}]: iniciando update`, { fields: Object.keys(data) });

    // Use current profile from ref (most up-to-date local state)
    const currentProfile = profileRef.current;
    if (!currentProfile) {
      logError(`updateProfile [${myCounter}]: profile ref is null`);
      return { error: "Profile não carregado." };
    }

    // Merge current profile with new data (local data takes priority)
    const updated = { ...currentProfile, ...data, updated_at: new Date().toISOString() };
    log(`updateProfile [${myCounter}]: dados mesclados`, { avatar: updated.avatar ? "(tem)" : "(sem)", username: updated.username, role: updated.role });

    // Optimistic update - set profile immediately before DB write
    setProfile(updated);
    profileRef.current = updated;

    const { error } = await supabase.from("profiles").upsert({
      id: currentUser.id,
      email: updated.email,
      username: updated.username,
      role: updated.role,
      avatar: updated.avatar,
      notifications: updated.notifications,
      settings: updated.settings,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    }, { onConflict: "id" });

    if (error) {
      logError(`updateProfile [${myCounter}]: upsert falhou`, error.message);
      // Revert to previous profile on error
      setProfile(currentProfile);
      profileRef.current = currentProfile;
      return { error: "Erro ao salvar: " + error.message };
    }

    log(`updateProfile [${myCounter}]: upsert concluído com sucesso`);

    return {};
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
