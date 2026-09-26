export interface ProductMeasurements {
  width?: number;   // largura (cm)
  length?: number;  // comprimento (cm)
  bust?: number;    // busto (cm)
  waist?: number;   // cintura (cm)
  hip?: number;     // quadril (cm)
}

export interface ProductVariation {
  size?: string;
  color?: string;
  colorHex?: string;
  image?: string;
  stock: number;
  sku?: string;
  amount?: number;
  cost?: number;
  commissionPct?: number;
  shipping?: number;
  measurements?: ProductMeasurements;
}

export interface ProductDimensions {
  length?: number; // cm
  width?: number;  // cm
  height?: number; // cm
}

export interface Product {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  channel: string;
  category: string;
  categoryId?: string;
  tags?: string[];
  stock: number;
  minStock?: number;
  cost: number;
  commissionPct: number;
  shipping: number;
  sku?: string;
  images: string[];
  shopeeLink?: string;
  tiktokLink?: string;
  isInstallment?: boolean;
  totalInstallments?: number;
  paidInstallments?: number;
  installmentValue?: number;
  totalValue?: number;
  firstDueDate?: string;
  payments?: { date: string; amount: number }[];
  addedBy?: string;
  addedByAvatar?: string;
  details?: string;
  size?: string;
  weight?: number;
  measurements?: ProductMeasurements;
  variations?: ProductVariation[];
  // Shopee / TikTok Shop fields
  hsCode?: string;
  gstCode?: string;
  dimensions?: ProductDimensions;
  shippingChannels?: string[];
  daysToShip?: number;
  condition?: 'new' | 'used';
  isActive?: boolean;
}

export type PaymentMethod = 'debito' | 'pix' | 'credito' | 'dinheiro';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'debito', label: 'Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'dinheiro', label: 'Dinheiro' },
];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  debito: 'Débito',
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  dinheiro: 'Dinheiro',
};

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  channel: string;
  date: string;
  profit: number;
  paymentMethod: PaymentMethod;
  commissionPct?: number;
  shipping?: number;
  registeredBy?: string;
  registeredByAvatar?: string;
}

export const CATEGORIES = [
  'Camisas',
  'Vestidos',
  'Calças',
  'Casacos',
  'Acessórios',
  'Maquiagem',
  'Perfumes',
];

export const CHANNELS = ['Loja Física', 'Shopee', 'TikTok Shop'];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_CHANNELS: { name: string; amount: number }[] = [];

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  recurring: boolean;
}

export const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Água',
  'Luz',
  'Internet',
  'IPTU',
  'Telefone',
  'Transporte',
  'Embalagens',
  'Compra de Produtos',
  'Outros',
];

export const INITIAL_EXPENSES: Expense[] = [];

export const calcUnitProfit = (price: number, cost: number, commissionPct: number = 0, shipping: number = 0) =>
  (price - cost) * (1 - commissionPct / 100) - shipping;

export const calcMargin = (price: number, cost: number, totalQty?: number, commissionPct?: number, shipping?: number) => {
  if (price <= 0) return 0;
  if (totalQty !== undefined && commissionPct !== undefined && shipping !== undefined) {
    const totalRevenue = price;
    const totalCost = cost * totalQty;
    const totalCommission = price * (commissionPct / 100);
    const totalShipping = shipping * totalQty;
    return ((totalRevenue - totalCost - totalCommission - totalShipping) / totalRevenue) * 100;
  }
  return ((price - cost) / price) * 100;
};

export const generateSKU = (category: string) => {
  const prefix = category.slice(0, 3).toUpperCase();
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${num}`;
};

// =============================================
// Shopee / TikTok Shop constants
// =============================================

export const HS_CODES = [
  { code: "6109", label: "6109 - Camisetas, camisas de malha" },
  { code: "6104", label: "6104 - Vestidos de malha" },
  { code: "6204", label: "6204 - Vestidos de tecido" },
  { code: "6110", label: "6110 - Suéteres, casacos de malha" },
  { code: "6201", label: "6201 - Casacos de tecido" },
  { code: "6203", label: "6203 - Calças, shorts de tecido" },
  { code: "6105", label: "6105 - Camisas de malha" },
  { code: "6205", label: "6205 - Camisas de tecido" },
  { code: "4202", label: "4202 - Bolsas, malas" },
  { code: "7117", label: "7117 - Joias, bijuterias" },
  { code: "3304", label: "3304 - Maquiagem, cosméticos" },
  { code: "3303", label: "3303 - Perfumes" },
  { code: "6307", label: "6307 - Acessórios de vestuário" },
  { code: "9505", label: "9505 - Acessórios de festa" },
];

export const GST_CODES = [
  { code: "0", label: "0% - Isento" },
  { code: "5", label: "5%" },
  { code: "12", label: "12%" },
  { code: "18", label: "18%" },
  { code: "28", label: "28%" },
];

export const SHIPPING_CHANNELS = [
  { id: "normal", label: "Logística Normal" },
  { id: "express", label: "Logística Express" },
  { id: "economy", label: "Logística Econômica" },
  { id: "seller", label: "Envio pelo Vendedor" },
];

export const PRODUCT_CONDITIONS = [
  { value: "new", label: "Novo" },
  { value: "used", label: "Usado" },
];
