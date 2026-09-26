// scripts/import-products.js
// Importa produtos em massa para a Supabase a partir de um manifest JSON.
//
// Cada item do manifest representa uma foto na pasta IMAGES_DIR.
// O script: 1) faz login como admin, 2) busca o perfil do usuário,
// 3) converte cada imagem em dataURL (base64), 4) faz upsert na tabela products.
//
// Uso:
//   $env:IMPORT_EMAIL = "vitorvinhal90@gmail.com"
//   $env:IMPORT_PASSWORD = "<senha>"
//   $env:IMPORT_FOLDER = "C:/caminho/pasta-fotos"
//   node scripts/import-products.js
//
// Diversos manifests (lotes) podem ser processados de uma vez:
//   $env:IMPORT_MANIFESTS = "lote1.json;lote2.json"
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

const CATEGORIES = new Set([
  "Camisas", "Vestidos", "Calças", "Casacos", "Acessórios", "Maquiagem", "Perfumes",
]);

if (!EMAIL || !PASSWORD) {
  console.error("IMPORT_EMAIL/IMPORT_PASSWORD não definidos.");
  process.exit(1);
}
if (!FOLDER || !fs.existsSync(FOLDER)) {
  console.error("IMPORT_FOLDER não existe:", FOLDER);
  process.exit(1);
}

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function toDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const mime = ext === "jpg" ? "jpeg" : ext;
  const buf = fs.readFileSync(filePath);
  return `data:image/${mime};base64,${buf.toString("base64")}`;
}

function generateSKU(category) {
  const prefix = (category || "GEN").slice(0, 3).toUpperCase();
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${num}`;
}

async function main() {
  console.log(`Supabase: ${URL_}`);
  const supabase = createClient(URL_, ANON, { auth: { persistSession: false } });

  console.log(`Login como ${EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError || !authData.session) {
    console.error("Falha no login:", authError?.message || "sem sessão");
    process.exit(1);
  }
  console.log("Login OK.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, username, avatar, role")
    .eq("id", authData.user.id)
    .single();

  const addedBy = profile?.username || profile?.email || EMAIL;
  const addedByAvatar = profile?.avatar || undefined;
  const userId = authData.user.id;

  let total = 0;
  for (const manifestName of MANIFESTS) {
    const manifestPath = path.join(FOLDER, manifestName);
    if (!fs.existsSync(manifestPath)) {
      console.warn(`Manifest não encontrado, pulando: ${manifestPath}`);
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const items = Array.isArray(manifest) ? manifest : manifest.products;
    console.log(`Manifest ${manifestName}: ${items.length} produtos`);

    for (const item of items) {
      const imgPath = path.join(FOLDER, item.image);
      if (!fs.existsSync(imgPath) || !IMAGE_EXT.test(item.image)) {
        console.warn(`Imagem inválida, pulando: ${item.image}`);
        continue;
      }

      const category = item.category && CATEGORIES.has(item.category) ? item.category : "Acessórios";
      const id = item.id || crypto.randomUUID();
      const product = {
        id,
        date: item.date || new Date().toISOString(),
        description: item.description || path.basename(item.image, path.extname(item.image)),
        amount: 0,     // preço — preenchido depois
        type: "income",
        channel: item.channel || "Loja Física",
        category,
        stock: 0,      // estoque — preenchido depois
        minStock: item.minStock ?? 5,
        cost: 0,       // custo — preenchido depois
        commissionPct: item.commissionPct ?? 0,
        shipping: item.shipping ?? 0,
        sku: item.sku || generateSKU(category),
        images: [toDataUrl(imgPath)],
        details: item.details || "",
        size: item.size,
        weight: item.weight,
        condition: item.condition || "new",
        hsCode: item.hsCode,
        gstCode: item.gstCode,
        dimensions: item.dimensions,
        shippingChannels: item.shippingChannels,
        daysToShip: item.daysToShip,
        isActive: item.isActive ?? true,
        addedBy,
        addedByAvatar,
        user_id: userId,
      };

      const { error } = await supabase.from("products").upsert(
        { id, data: product },
        { onConflict: "id" }
      );
      if (error) {
        console.error(`Erro ao salvar ${item.image}:`, error.message);
      } else {
        total++;
        console.log(`  ✓ ${item.image} → ${product.description} [${category}]`);
      }
    }
  }

  console.log(`\nImportados com sucesso: ${total} produto(s).`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});