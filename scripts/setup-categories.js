// scripts/setup-categories.js
// Cria a árvore de categorias (Feminino, Masculino, Casacos, Maquiagem,
// Perfumaria, Acessórios, Outros) e remapeia cada produto existente no
// banco para sua categoria correta com base no nome/descrição.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rezvmfcbsossxwynlnce.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Ng4zcxmxK357tNMpklC_0w_y9JWUh_c";
const EMAIL = process.env.IMPORT_EMAIL;
const PASSWORD = process.env.IMPORT_PASSWORD;

if (!EMAIL || !PASSWORD) { console.error("IMPORT_EMAIL/IMPORT_PASSWORD não definidos."); process.exit(1); }

// Árvore de categorias: [nome, slug, ícone, cor, filhos?]
const TREE = [
  ["Feminino", "feminino", "👗", "#ec4899", [
    ["Vestidos", "feminino-vestidos", "👗", "#ec4899"],
    ["Blusas", "feminino-blusas", "👚", "#f472b6"],
    ["Camisetas", "feminino-camisetas", "👕", "#f472b6"],
    ["Calças", "feminino-calcas", "👖", "#6366f1"],
    ["Shorts e Bermudas", "feminino-shorts", "🩳", "#6366f1"],
    ["Conjuntos", "feminino-conjuntos", "🧥", "#a78bfa"],
    ["Lingerie", "feminino-lingerie", "💕", "#be185d"],
  ]],
  ["Masculino", "masculino", "👔", "#3b82f6", [
    ["Camisetas", "masculino-camisetas", "👕", "#60a5fa"],
    ["Calças", "masculino-calcas", "👖", "#3b82f6"],
    ["Bermudas", "masculino-bermudas", "🩳", "#60a5fa"],
    ["Boxers", "masculino-boxers", "🩲", "#3b82f6"],
    ["Suéteres", "masculino-sueres", "🧶", "#60a5fa"],
  ]],
  ["Casacos", "casacos", "🧥", "#8b5cf6"],
  ["Maquiagem", "maquiagem", "💄", "#a855f7", [
    ["Lábios", "maquiagem-labios", "💋", "#a855f7"],
    ["Olhos", "maquiagem-olhos", "👁️", "#c084fc"],
    ["Rosto", "maquiagem-rosto", "✨", "#a855f7"],
    ["Acessórios de Maquiagem", "maquiagem-acessorios", "🖌️", "#c084fc"],
  ]],
  ["Perfumaria", "perfumaria", "🧴", "#0ea5e9"],
  ["Acessórios", "acessorios", "👜", "#64748b"],
  ["Outros", "outros", "📦", "#94a3b8", [
    ["Casa e Decoração", "outros-casa", "🕯️", "#94a3b8"],
  ]],
];

const slugs = new Map(); // slug -> {id, name}
let catIdSeq = 0;
const uuid = () => crypto.randomUUID();

// regras: [regex, caminho fullName]
function resolveCategory(text, category) {
  const t = `${text} ${category}`.toLowerCase();
  const rules = [
    [/lingerie|calcinha|tanga|sutiã|sutia|conjunto renda/, "Feminino > Lingerie"],
    [/boxer/, "Masculino > Boxers"],
    [/vestido/, "Feminino > Vestidos"],
    [/shorts?|bermuda/, /masculin/.test(t) ? "Masculino > Bermudas" : "Feminino > Shorts e Bermudas"],
    [/calça|calca|jeans|legging/, /masculin/.test(t) ? "Masculino > Calças" : "Feminino > Calças"],
    [/camiseta|t.?shirt|regata/, /masculin/.test(t) ? "Masculino > Camisetas" : "Feminino > Camisetas"],
    [/blusa|blusas/, /masculin/.test(t) ? "Masculino > Camisetas" : "Feminino > Blusas"],
    [/conjunto 3|conjunto top|conjunto conforto|kit casacos/, "Feminino > Conjuntos"],
    [/casaco|jaqueta|suéter|sueter|colete/, /masculin/.test(t) ? "Masculino > Suéteres" : "Casacos"],
    [/manteiga|batom|base lí|base li|gloss|lápis labial|lapis labial|lip/, "Maquiagem > Lábios"],
    [/delineador|sombra|caneta delineadora/, "Maquiagem > Olhos"],
    [/sobrancelha|cílios|cilios|pestana|máscara|mascara|base líquida|base liquida|esponja|peel off|pó facial/, "Maquiagem > Rosto"],
    [/manteiga de cacau/, "Maquiagem > Lábios"],
    [/perfume|body splash|colônia|colonia/, "Perfumaria"],
    [/colar|brinco|pulseira|choker/, "Acessórios"],
    [/cobertor|vela|aromatizador/, "Outros > Casa e Decoração"],
  ];
  for (const [re, path] of rules) {
    if (re.test(t)) return path;
  }
  return null;
}

async function ensureCategories(supabase) {
  // remove categorias existentes para rebuild limpo
  const { data: existing } = await supabase.from("categories").select("id");
  for (const c of existing || []) await supabase.from("categories").delete().eq("id", c.id);

  const map = new Map(); // fullPath -> id
  const insert = async (name, slug, parentId, icon, color, sort, fullPath) => {
    const id = uuid();
    const { error } = await supabase.from("categories").insert({
      id, name, slug, parent_id: parentId, icon, color, sort_order: sort,
    });
    if (error) throw error;
    map.set(fullPath, id);
    return id;
  };

  let sort = 0;
  for (const [name, slug, icon, color, kids] of TREE) {
    const id = await insert(name, slug, null, icon, color, sort++, name);
    if (kids) {
      let sub = 0;
      for (const [n, s, i, c] of kids) {
        await insert(n, s, id, i, c, sub++, `${name} > ${n}`);
      }
    }
  }
  return map;
}

async function main() {
  const supabase = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.session) { console.error("Falha no login:", authError?.message); process.exit(1); }
  console.log("Login OK.");

  const nameToId = await ensureCategories(supabase);
  console.log(`Categorias criadas: ${nameToId.size}`);

  const { data: products, error: listError } = await supabase.from("products").select("id, data");
  if (listError) console.error("Erro ao listar produtos:", listError.message);
  console.log(`${(products || []).length} produtos para remapear`);

  let remapped = 0, unmatched = 0;
  for (const row of products || []) {
    const p = row.data || {};
    const path = resolveCategory(p.description || "", p.category || "");
    if (!path) { unmatched++; continue; }

    // encontra o id usando o caminho completo (ex: "Masculino > Camisetas")
    const targetId = nameToId.get(path);
    if (!targetId) { unmatched++; continue; }

    const targetName = (sub = path.split(" > ").pop());
    const updated = { ...p, category: targetName, categoryId: targetId };
    const { error } = await supabase.from("products").upsert({ id: row.id, data: updated }, { onConflict: "id" });
    if (error) { console.error(`Erro em ${p.description}:`, error.message); continue; }
    remapped++;
  }

  console.log(`Remapeados: ${remapped} · sem categoria correspondente: ${unmatched}`);
}

main().catch((e) => { console.error("Erro fatal:", e); process.exit(1); });