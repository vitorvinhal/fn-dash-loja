"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Product, Sale, Expense } from "@/data/products";
import { Category, Tag } from "@/lib/supabase";

const LOG_PREFIX = "[DB]";
const LS_CATEGORIES = "fn_dash_categories";
const LS_TAGS = "fn_dash_tags";

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

function loadLS<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveLS(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

interface DbContextType {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  lastSync: Date | null;
  syncStatus: "ok" | "error" | "local";
  categoriesBackend: "supabase" | "localStorage";
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, "id" | "created_at" | "updated_at">) => Promise<{ data: Category | null; error?: string }>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTag: (tag: Omit<Tag, "id" | "created_at">) => Promise<Tag | null>;
  updateTag: (id: string, data: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const DbContext = createContext<DbContextType>({
  products: [],
  sales: [],
  expenses: [],
  categories: [],
  tags: [],
  loading: true,
  lastSync: null,
  syncStatus: "local",
  categoriesBackend: "localStorage",
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  addSale: async () => {},
  deleteSale: async () => {},
  addExpense: async () => {},
  updateExpense: async () => {},
  deleteExpense: async () => {},
  addCategory: async () => ({ data: null }),
  updateCategory: async () => {},
  deleteCategory: async () => {},
  addTag: async () => null,
  updateTag: async () => {},
  deleteTag: async () => {},
  reload: async () => {},
});

export function useDb() {
  return useContext(DbContext);
}

export function DbProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    const CURRENT_VERSION = "2.1";
    const stored = localStorage.getItem("fn_dash_data_version");
    if (stored !== CURRENT_VERSION) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("fn_") || k.startsWith("supabase"));
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem("fn_dash_data_version", CURRENT_VERSION);
    }
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<"ok" | "error" | "local">("local");
  const [categoriesBackend, setCategoriesBackend] = useState<"supabase" | "localStorage">("localStorage");

  const loadFromSupabase = useCallback(async () => {
    if (!user) return;
    log("loadFromSupabase: carregando dados...");
    try {
      const [prodRes, saleRes, expRes] = await Promise.all([
        supabase.from("products").select("id, data"),
        supabase.from("sales").select("id, data"),
        supabase.from("expenses").select("id, data"),
      ]);

      let catRes = { data: null as any, error: null as any };
      let tagRes = { data: null as any, error: null as any };
      let catTableExists = false;
      let tagTableExists = false;

      try {
        catRes = await supabase.from("categories").select("*").order("sort_order");
        if (!catRes.error) catTableExists = true;
      } catch {}
      try {
        tagRes = await supabase.from("product_tags").select("*").order("name");
        if (!tagRes.error) tagTableExists = true;
      } catch {}

      if (catTableExists && catRes.data) {
        setCategories(catRes.data);
        setCategoriesBackend("supabase");
        log(`loadFromSupabase: ${catRes.data.length} categorias do Supabase`);
      } else {
        const localCats = loadLS<Category>(LS_CATEGORIES, []);
        setCategories(localCats);
        setCategoriesBackend("localStorage");
        log(`loadFromSupabase: ${localCats.length} categorias do localStorage`);
      }

      if (tagTableExists && tagRes.data) {
        setTags(tagRes.data);
        log(`loadFromSupabase: ${tagRes.data.length} tags do Supabase`);
      } else {
        const localTags = loadLS<Tag>(LS_TAGS, []);
        setTags(localTags);
        log(`loadFromSupabase: ${localTags.length} tags do localStorage`);
      }

      if (prodRes.error || saleRes.error || expRes.error) {
        logError("Supabase errors:", { prod: prodRes.error, sale: saleRes.error, exp: expRes.error });
        setSyncStatus("error");
        return;
      }

      if (prodRes.data && prodRes.data.length > 0) {
        setProducts(prodRes.data.map((r) => r.data as Product));
      }
      if (saleRes.data && saleRes.data.length > 0) {
        setSales(saleRes.data.map((r) => r.data as Sale));
      }
      if (expRes.data && expRes.data.length > 0) {
        setExpenses(expRes.data.map((r) => r.data as Expense));
      }

      setLastSync(new Date());
      setSyncStatus("ok");
      log("loadFromSupabase: dados carregados com sucesso");
    } catch (e) {
      logError("Failed to load from Supabase:", e);
      setSyncStatus("error");
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await loadFromSupabase();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [loadFromSupabase]);

  useEffect(() => {
    if (!user) return;

    const prodChannel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const row = payload.new as { id: string; data: Product };
          setProducts((prev) => {
            const exists = prev.findIndex((p) => p.id === row.id);
            if (exists >= 0) {
              const next = [...prev];
              next[exists] = row.data;
              return next;
            }
            return [...prev, row.data];
          });
          setLastSync(new Date());
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as { id: string };
          setProducts((prev) => prev.filter((p) => p.id !== row.id));
        }
      })
      .subscribe();

    const saleChannel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const row = payload.new as { id: string; data: Sale };
          setSales((prev) => {
            const exists = prev.findIndex((s) => s.id === row.id);
            if (exists >= 0) {
              const next = [...prev];
              next[exists] = row.data;
              return next;
            }
            return [row.data, ...prev];
          });
          setLastSync(new Date());
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as { id: string };
          setSales((prev) => prev.filter((s) => s.id !== row.id));
        }
      })
      .subscribe();

    const expChannel = supabase
      .channel("expenses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const row = payload.new as { id: string; data: Expense };
          setExpenses((prev) => {
            const exists = prev.findIndex((e) => e.id === row.id);
            if (exists >= 0) {
              const next = [...prev];
              next[exists] = row.data;
              return next;
            }
            return [...prev, row.data];
          });
          setLastSync(new Date());
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as { id: string };
          setExpenses((prev) => prev.filter((e) => e.id !== row.id));
        }
      })
      .subscribe();

    let catChannel: any = null;
    try {
      catChannel = supabase
        .channel("categories-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
          supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
            if (data) setCategories(data);
          });
        })
        .subscribe();
    } catch {}

    let tagChannel: any = null;
    try {
      tagChannel = supabase
        .channel("tags-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "product_tags" }, () => {
          supabase.from("product_tags").select("*").order("name").then(({ data }) => {
            if (data) setTags(data);
          });
        })
        .subscribe();
    } catch {}

    return () => {
      supabase.removeChannel(prodChannel);
      supabase.removeChannel(saleChannel);
      supabase.removeChannel(expChannel);
      if (catChannel) supabase.removeChannel(catChannel);
      if (tagChannel) supabase.removeChannel(tagChannel);
    };
  }, [user]);

  const addProduct = async (product: Product) => {
    setProducts((prev) => [...prev, product]);
    try {
      await supabase.from("products").upsert({ id: product.id, data: product }, { onConflict: "id" });
    } catch (e) { console.warn("Failed to save product:", e); }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    try {
      const full = products.find((p) => p.id === id);
      if (full) await supabase.from("products").upsert({ id, data: { ...full, ...data } }, { onConflict: "id" });
    } catch (e) { console.warn("Failed to update product:", e); }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try { await supabase.from("products").delete().eq("id", id); } catch (e) { console.warn("Failed to delete product:", e); }
  };

  const addSale = async (sale: Sale) => {
    setSales((prev) => [sale, ...prev]);
    setProducts((prev) =>
      prev.map((p) => (p.id === sale.productId ? { ...p, stock: Math.max(0, p.stock - sale.qty) } : p))
    );
    try {
      await supabase.from("sales").upsert({ id: sale.id, data: sale }, { onConflict: "id" });
      const prod = products.find((p) => p.id === sale.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - sale.qty);
        await supabase.from("products").upsert({ id: prod.id, data: { ...prod, stock: newStock } }, { onConflict: "id" });
      }
    } catch (e) { console.warn("Failed to save sale:", e); }
  };

  const deleteSale = async (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
    try { await supabase.from("sales").delete().eq("id", id); } catch (e) { console.warn("Failed to delete sale:", e); }
  };

  const addExpense = async (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
    try {
      await supabase.from("expenses").upsert({ id: expense.id, data: expense }, { onConflict: "id" });
    } catch (e) { console.warn("Failed to save expense:", e); }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    try {
      const full = expenses.find((e) => e.id === id);
      if (full) await supabase.from("expenses").upsert({ id, data: { ...full, ...data } }, { onConflict: "id" });
    } catch (e) { console.warn("Failed to update expense:", e); }
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    try { await supabase.from("expenses").delete().eq("id", id); } catch (e) { console.warn("Failed to delete expense:", e); }
  };

  // =============================================
  // Categories CRUD (Supabase or localStorage)
  // =============================================
  const addCategory = async (cat: Omit<Category, "id" | "created_at" | "updated_at">): Promise<{ data: Category | null; error?: string }> => {
    log("addCategory:", { name: cat.name, parent_id: cat.parent_id, backend: categoriesBackend });
    const now = new Date().toISOString();
    const newCat: Category = {
      ...cat,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    if (categoriesBackend === "supabase") {
      try {
        const { data, error } = await supabase.from("categories").insert(cat).select().single();
        if (error) {
          logError("addCategory failed", error);
          return { data: null, error: error.message || "Erro ao criar categoria" };
        }
        log("addCategory: sucesso (Supabase)", { id: data.id });
        return { data };
      } catch (e: any) {
        logError("addCategory exception", e);
        return { data: null, error: e?.message || "Erro de conexão" };
      }
    }

    // localStorage fallback
    const updated = [...categories, newCat];
    setCategories(updated);
    saveLS(LS_CATEGORIES, updated);
    log("addCategory: sucesso (localStorage)", { id: newCat.id });
    return { data: newCat };
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    log("updateCategory:", { id, fields: Object.keys(data) });
    if (categoriesBackend === "supabase") {
      try {
        const { error } = await supabase.from("categories").update(data).eq("id", id);
        if (error) logError("updateCategory failed", error);
        else log("updateCategory: sucesso");
      } catch (e) {
        logError("updateCategory exception", e);
      }
    }
    const updated = categories.map((c) => (c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c));
    setCategories(updated);
    saveLS(LS_CATEGORIES, updated);
  };

  const deleteCategory = async (id: string) => {
    log("deleteCategory:", { id });
    if (categoriesBackend === "supabase") {
      try {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) logError("deleteCategory failed", error);
        else log("deleteCategory: sucesso");
      } catch (e) {
        logError("deleteCategory exception", e);
      }
    }
    const updated = categories.filter((c) => c.id !== id && c.parent_id !== id);
    setCategories(updated);
    saveLS(LS_CATEGORIES, updated);
  };

  // =============================================
  // Tags CRUD (Supabase or localStorage)
  // =============================================
  const addTag = async (tag: Omit<Tag, "id" | "created_at">): Promise<Tag | null> => {
    log("addTag:", { name: tag.name });
    const now = new Date().toISOString();
    const newTag: Tag = { ...tag, id: crypto.randomUUID(), created_at: now };

    if (categoriesBackend === "supabase") {
      try {
        const { data, error } = await supabase.from("product_tags").insert(tag).select().single();
        if (error) {
          logError("addTag failed", error);
          return null;
        }
        log("addTag: sucesso (Supabase)", { id: data.id });
        return data;
      } catch (e) {
        logError("addTag exception", e);
        return null;
      }
    }

    const updated = [...tags, newTag];
    setTags(updated);
    saveLS(LS_TAGS, updated);
    log("addTag: sucesso (localStorage)", { id: newTag.id });
    return newTag;
  };

  const updateTag = async (id: string, data: Partial<Tag>) => {
    log("updateTag:", { id, fields: Object.keys(data) });
    if (categoriesBackend === "supabase") {
      try {
        const { error } = await supabase.from("product_tags").update(data).eq("id", id);
        if (error) logError("updateTag failed", error);
        else log("updateTag: sucesso");
      } catch (e) {
        logError("updateTag exception", e);
      }
    }
    const updated = tags.map((t) => (t.id === id ? { ...t, ...data } : t));
    setTags(updated);
    saveLS(LS_TAGS, updated);
  };

  const deleteTag = async (id: string) => {
    log("deleteTag:", { id });
    if (categoriesBackend === "supabase") {
      try {
        const { error } = await supabase.from("product_tags").delete().eq("id", id);
        if (error) logError("deleteTag failed", error);
        else log("deleteTag: sucesso");
      } catch (e) {
        logError("deleteTag exception", e);
      }
    }
    const updated = tags.filter((t) => t.id !== id);
    setTags(updated);
    saveLS(LS_TAGS, updated);
  };

  const reload = async () => {
    setLoading(true);
    await loadFromSupabase();
    setLoading(false);
  };

  return (
    <DbContext.Provider value={{
      products, sales, expenses, categories, tags,
      loading, lastSync, syncStatus, categoriesBackend,
      addProduct, updateProduct, deleteProduct,
      addSale, deleteSale,
      addExpense, updateExpense, deleteExpense,
      addCategory, updateCategory, deleteCategory,
      addTag, updateTag, deleteTag,
      reload,
    }}>
      {children}
    </DbContext.Provider>
  );
}
