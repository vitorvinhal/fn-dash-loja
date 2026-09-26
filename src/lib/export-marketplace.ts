import { Product, ProductVariation } from "@/data/products";

function measurementLabel(v: ProductVariation): string {
  const m = v.measurements;
  if (!m) return "";
  const parts: string[] = [];
  if (m.width) parts.push(`${m.width}cm larg`);
  if (m.length) parts.push(`${m.length}cm comp`);
  if (m.bust) parts.push(`busto ${m.bust}cm`);
  if (m.waist) parts.push(`cintura ${m.waist}cm`);
  if (m.hip) parts.push(`quadril ${m.hip}cm`);
  return parts.join(" | ");
}

function variantLabel(product: Product, v: ProductVariation): string {
  const base = [v.size, v.color].filter(Boolean).join(" - ") || "Padrão";
  const measures = measurementLabel(v);
  return measures ? `${base} (${measures})` : base;
}

// =============================================
// Export to Shopee CSV format
// =============================================
export interface ShopeeProduct {
  "SKU ID": string;
  "Product Name": string;
  "Category": string;
  "Description": string;
  "Price": number;
  "Stock": number;
  "Weight (kg)": number;
  "Image URL": string;
  "Variant Name": string;
  "Variant SKU": string;
  "Variant Price": number;
  "Variant Stock": number;
  "Is Active": string;
}

export function toShopeeCSV(products: Product[]): string {
  const headers = [
    "SKU ID",
    "Product Name",
    "Category",
    "Description",
    "Price",
    "Stock",
    "Weight (kg)",
    "Image URL",
    "Variant Name",
    "Variant SKU",
    "Variant Price",
    "Variant Stock",
    "Is Active",
  ];

  const rows: string[][] = [];

  products.forEach((product) => {
    if (product.variations && product.variations.length > 0) {
      product.variations.forEach((variation, idx) => {
        rows.push([
          variation.sku || product.sku || `SKU-${product.id}`,
          product.description,
          product.category,
          product.details || product.description,
          String(variation.amount || product.amount),
          String(variation.stock),
          String(product.weight || 0.3),
          variation.image || product.images?.[0] || "",
          variantLabel(product, variation),
          variation.sku || `${product.sku || `SKU-${product.id}`}-${idx + 1}`,
          String(variation.amount || product.amount),
          String(variation.stock),
          "true",
        ]);
      });
    } else {
      rows.push([
        product.sku || `SKU-${product.id}`,
        product.description,
        product.category,
        product.details || product.description,
        String(product.amount),
        String(product.stock),
        String(product.weight || 0.3),
        product.images?.[0] || "",
        "Padrão",
        product.sku || `SKU-${product.id}`,
        String(product.amount),
        String(product.stock),
        "true",
      ]);
    }
  });

  return [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
}

// =============================================
// Export to TikTok Shop CSV format
// =============================================
export interface TikTokProduct {
  "Product Name": string;
  "Category": string;
  "Description": string;
  "Price": number;
  "Stock": number;
  "SKU ID": string;
  "SKU Name": string;
  "SKU Price": number;
  "SKU Stock": number;
  "Weight (g)": number;
  "Image URL": string;
  "Variant Attribute 1": string;
  "Variant Value 1": string;
  "Is Publish": string;
}

export function toTikTokCSV(products: Product[]): string {
  const headers = [
    "Product Name",
    "Category",
    "Description",
    "Price",
    "Stock",
    "SKU ID",
    "SKU Name",
    "SKU Price",
    "SKU Stock",
    "Weight (g)",
    "Image URL",
    "Variant Attribute 1",
    "Variant Value 1",
    "Is Publish",
  ];

  const rows: string[][] = [];

  products.forEach((product) => {
    if (product.variations && product.variations.length > 0) {
      product.variations.forEach((variation, idx) => {
        rows.push([
          product.description,
          product.category,
          product.details || product.description,
          String(variation.amount || product.amount),
          String(variation.stock),
          variation.sku || `${product.sku || `SKU-${product.id}`}-${idx + 1}`,
          variantLabel(product, variation),
          String(variation.amount || product.amount),
          String(variation.stock),
          String((product.weight || 0.3) * 1000),
          variation.image || product.images?.[0] || "",
          "Tamanho",
          variation.size || "Único",
          "true",
        ]);
      });
    } else {
      rows.push([
        product.description,
        product.category,
        product.details || product.description,
        String(product.amount),
        String(product.stock),
        product.sku || `SKU-${product.id}`,
        "Padrão",
        String(product.amount),
        String(product.stock),
        String((product.weight || 0.3) * 1000),
        product.images?.[0] || "",
        "Tamanho",
        product.size || "Único",
        "true",
      ]);
    }
  });

  return [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
}

// =============================================
// Export to Excel (XLSX) using SheetJS
// =============================================
export function downloadCSV(content: string, filename: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToShopee(products: Product[]) {
  const csv = toShopeeCSV(products);
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `shopee-produtos-${date}.csv`);
}

export function exportToTikTok(products: Product[]) {
  const csv = toTikTokCSV(products);
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `tiktok-produtos-${date}.csv`);
}

// =============================================
// Export stock report
// =============================================
export function exportStockReport(products: Product[]) {
  const headers = [
    "SKU",
    "Produto",
    "Categoria",
    "Canal",
    "Preço",
    "Custo",
    "Estoque",
    "Estoque Mínimo",
    "Status",
    "Link Shopee",
    "Link TikTok",
  ];

  const rows = products.map((p) => [
    p.sku || `SKU-${p.id}`,
    p.description,
    p.category,
    p.channel,
    String(p.amount),
    String(p.cost),
    String(p.stock),
    String(p.minStock || 5),
    p.stock <= (p.minStock || 5) ? "BAIXO" : "OK",
    p.shopeeLink || "",
    p.tiktokLink || "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `estoque-relatorio-${date}.csv`);
}

// =============================================
// Helpers
// =============================================
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
