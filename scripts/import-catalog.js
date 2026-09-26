// scripts/import-catalog.js
// Importa catálogo completo: agrupa variantes de cor, gera tamanhos e pesos
// por categoria (médias pesquisadas de mercado), descrições detalhadas e
// múltiplas fotos por produto.
//
// Uso:
//   $env:IMPORT_EMAIL / $env:IMPORT_PASSWORD / $env:IMPORT_FOLDER
//   $env:IMPORT_MANIFESTS = "lote1.json;lote2.json"
//   node scripts/import-catalog.js [--reset-imported]
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rezvmfcbsossxwynlnce.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Ng4zcxmxK357tNMpklC_0w_y9JWUh_c";
const EMAIL = process.env.IMPORT_EMAIL;
const PASSWORD = process.env.IMPORT_PASSWORD;
const FOLDER = process.env.IMPORT_FOLDER;
const MANIFESTS = (process.env.IMPORT_MANIFESTS || "manifest.json").split(";").map((s) => s.trim());
const RESET = process.argv.includes("--reset-imported");

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const STORAGE_BUCKET = "avatars"; // bucket público existente; caminho produtos/<id>/
const MAX_IMAGES = 9;

async function uploadImage(supabase, filePath, id) {
  const ext = path.extname(filePath).toLowerCase().replace(".", "") || "jpg";
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const buf = fs.readFileSync(filePath);
  const objectPath = `produtos/${id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, buf, {
    contentType: mime,
    upsert: true,
  });
  if (error) { console.warn(`Upload falhou (${path.basename(filePath)}): ${error.message}`); return null; }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

// ---- Pesos médios pesquisados (kg) por categoria de produto ----
const WEIGHTS = {
  Camisas: 0.18, Vestidos: 0.35, Calças: 0.5, Casacos: 0.45,
  Acessórios: 0.1, Maquiagem: 0.05, Perfumes: 0.15,
};

const SIZE_LABELS = ["PP", "P", "M", "G", "GG", "XG", "Único"];
const LINGERIE_SIZES = ["P", "M", "G"];
const UNIQUE = ["Único"];

const COLOR_WORDS = [
  "preto", "preta", "branco", "branca", "azul", "vermelho", "vermelha", "verde",
  "amarelo", "rosa", "roxo", "roxa", "laranja", "cinza", "marrom", "bege",
  "caramelo", "terracota", "camel", "vinho", "oliva", "petróleo", "salmão",
  "lilás", "malva", "azul marinho", "jeans", "estampado", "estampada",
  "listrado", "listrada", "canelada", "tricô", "floral", "multi-cores",
];

async function toDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const mime = ext === "jpg" ? "jpeg" : ext;
  const buf = fs.readFileSync(filePath);
  return `data:image/${mime};base64,${buf.toString("base64")}`;
}

function generateSKU(base, color = "", size = "") {
  const prefix = base.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") || "GEN";
  const colorPart = color ? color.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") || "COR" : "STD";
  const sizePart = size ? size.replace(/[^A-Z0-9]/g, "") : "U";
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${colorPart}${sizePart}-${num}`;
}

// Normaliza o nome base removendo cores e sufixos de variante para agrupar
function baseName(description) {
  let base = description.toLowerCase()
    .replace(/\([^)]*\)/g, " ")          // remove (versão 2), (2ª foto), (Foto 2)...
    .replace(/\b\d+\b/g, " ")            // remove números soltos
    .replace(/\b(jacksnipe|tuento|the girls|ouro negro|vista profissiona[lt]|profissional|mannequin|manequim|cabide|collar|colar|lifestyle|2ª|1ª|cors?|cores?)\b/g, " ");
  for (const w of COLOR_WORDS) {
    base = base.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  }
  base = base.replace(/[^a-zà-ú ]/g, " ").replace(/\s+/g, " ").trim();
  return base;
}

// Agrupa: entradas isDuplicate aderem ao produto principal (duplicateOf);
// as demais agrupam por nome base (mesmo modelo, cores diferentes).
function groupItems(allItems) {
  const groups = new Map();
  const getGroup = (base) => {
    if (!groups.has(base)) groups.set(base, []);
    return groups.get(base);
  };
  const mains = new Map(allItems.map((it) => [it.image, it]));

  for (const it of allItems) {
    if (it.isDuplicate && it.duplicateOf && mains.has(it.duplicateOf)) {
      const main = mains.get(it.duplicateOf);
      const base = baseName(main.description);
      getGroup(base).push(it);
    } else {
      getGroup(baseName(it.description)).push(it);
    }
  }
  return groups;
}

function extractColor(description) {
  const lower = description.toLowerCase();
  let best = "";
  for (const w of COLOR_WORDS) {
    const idx = lower.lastIndexOf(w);
    if (idx >= 0) best = w;
  }
  if (best) return description.substring(lower.indexOf(best), lower.indexOf(best) + best.length);
  return "";
}

function enrichDetails(item, groupSize) {
  const cat = item.category || "Acessórios";
  const color = item.color || "";
  const base = {
    Camisas: [
      "Peça feminina/masculina de excelente acabamento.",
      `Composição confortável e toque macio, ideal para o dia a dia.`,
    ],
    Vestidos: ["Corte elegante e caimento impecável.", "Modelo versátil para diversas ocasiões."],
    Calças: ["Conforto e durabilidade desde o primeiro uso.", "Ótima modelagem para o corpo."],
    Casacos: ["Aquecimento e estilo na mesma peça.", "Tecido de qualidade que dura."],
    Acessórios: ["Acabamento impecável.", "Combina com vários looks."],
    Maquiagem: ["Fórmula de alta fixação.", "Pigmentação intensa e resultado profissional."],
    Perfumes: ["Fragrância marcante e duradoura.", "Perfeito para presentear."],
  }[cat] || [];

  const colorLine = color ? ` Disponível na cor ${color}.` : "";
  const sizeLine = ` Tamanhos disponíveis: ${(item.sizes || []).join(", ")}.`;
  const groupLine = groupSize > 1 ? ` Outras cores do mesmo modelo disponíveis.` : "";
  const detail = item.details || "";
  return `${item.description}. ${base.join(" ")}${colorLine}${sizeLine}${groupLine} ${detail}`.trim();
}

async function login(supabase) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error || !data.session) throw new Error("Falha no login: " + (error?.message || ""));
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  return { user: data.user, session: data.session, profile };
}

async function main() {
  console.log(`Supabase: ${URL_}`);
  const supabase = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { user, profile } = await login(supabase);
  console.log(`Login OK: ${profile?.email || EMAIL}`);

  const addedBy = profile?.username || profile?.email || EMAIL;
  const addedByAvatar = profile?.avatar || undefined;

  if (RESET) {
    console.log("Removendo TODOS os produtos (banco estava vazio antes da importação)...");
    const { data: all } = await supabase.from("products").select("id");
    const before = Array.isArray(all) ? all.length : 0;
    for (const p of all || []) await supabase.from("products").delete().eq("id", p.id);
    console.log(`Removidos ${before} produtos.`);
  }

  const allItems = [];
  for (const manifestName of MANIFESTS) {
    const manifestPath = path.resolve(FOLDER, manifestName);
    const manifestDir = path.dirname(manifestPath);
    if (!fs.existsSync(manifestPath)) { console.warn(`Manifest não existe: ${manifestPath}`); continue; }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const items = Array.isArray(manifest) ? manifest : manifest.products;
    for (const it of items) {
      const imgPath = path.join(manifestDir, it.image);
      if (!fs.existsSync(imgPath) || !IMAGE_EXT.test(it.image)) { console.warn(`Imagem inválida: ${it.image}`); continue; }
      allItems.push({ ...it, _imgPath: imgPath });
    }
  }
  console.log(`Total de imagens no manifest: ${allItems.length}`);

  // Agrupa por nome base (mesmo modelo, cores diferentes)
  const groups = groupItems(allItems);
  console.log(`Grupos de produtos (modelos): ${groups.size}`);

  let inserted = 0;
  for (const [base, items] of groups) {
    if (!base) continue;
    const mainItem = items.find((it) => !it.isDuplicate) || items[0];
    const category = mainItem.category || "Acessórios";
    // manifest usa gramas → converte para kg (valores >=10 são gramas)
    const weightKg = mainItem.weight >= 10 ? mainItem.weight / 1000 : mainItem.weight;
    const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : (WEIGHTS[category] || 0.2);
    const sizes = mainItem.sizes && mainItem.sizes.length ? mainItem.sizes : (category === "Acessórios" || category === "Maquiagem" || category === "Perfumes" ? UNIQUE : (base.includes("calcinha") || base.includes("lingerie") || base.includes("boxer") || base.includes("tanga") ? LINGERIE_SIZES : SIZE_LABELS));

    const images = [];
    for (const it of items.slice(0, MAX_IMAGES)) {
      const url = await uploadImage(supabase, it._imgPath, crypto.randomUUID());
      if (url) images.push(url);
    }

    // variação por cor distinta; sem cor distinta → produto único (fotos múltiplas)
    const distinct = [...new Set(items.map((it) => extractColor(it.description)).filter(Boolean))];
    const variations = distinct.length > 0
      ? distinct.map((color, idx) => ({
          size: "", color, colorHex: "#000000", stock: 0, sku: generateSKU(base, color),
          images: [], amount: 0, cost: 0, commissionPct: 0, shipping: 0,
        }))
      : [];

    const product = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: mainItem.description.replace(/\((versão|v)\s?\d+\)/gi, "").trim(),
      type: "income",
      channel: "Loja Física",
      category,
      stock: 0,
      minStock: 5,
      amount: 0,
      cost: 0,
      commissionPct: 0,
      shipping: 0,
      sku: generateSKU(base),
      images,
      details: enrichDetails(mainItem, items.length),
      size: sizes.includes("Único") ? "Único" : sizes.join(", "),
      weight,
      variations,
      condition: "new",
      isActive: true,
      addedBy,
      addedByAvatar,
      importSource: "catalogo",
    };

    const { error } = await supabase.from("products").upsert({ id: product.id, data: product }, { onConflict: "id" });
    if (error) {
      console.error(`Erro ao salvar "${base}":`, error.message);
    } else {
      inserted++;
      console.log(`  ✓ ${product.description} [${category}] peso ${weight}kg ${items.length} foto(s), ${variations.length} cor(es)`);
    }
  }

  console.log(`\nImportados: ${inserted} produtos (${groups.size} modelos) em ${MANIFESTS.length} manifest(s).`);
}

main().catch((e) => { console.error("Erro fatal:", e); process.exit(1); });