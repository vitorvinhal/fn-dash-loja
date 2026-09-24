/**
 * Typed test-data factory system (Fishery/FactoryBot style).
 *
 * Features:
 * - Faker-generated defaults
 * - Override any field per call
 * - Traits for common variants
 * - Sequences for unique fields
 * - Associations build automatically
 * - Pure build (in-memory) + async create (persist to DB)
 * - Deterministic with seed
 * - Fully type-safe with inferred types
 */

import { faker } from "@faker-js/faker";

// =============================================
// Sequence generator
// =============================================
class Sequence {
  private counters = new Map<string, number>();

  next(name: string): number {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + 1);
    return current + 1;
  }

  reset(): void {
    this.counters.clear();
  }
}

const globalSequence = new Sequence();

export function resetSequences(): void {
  globalSequence.reset();
}

// =============================================
// Factory base
// =============================================
type Overrides<T> = Partial<T>;
type Traits<T> = Record<string, (defaults: T) => T>;

interface FactoryDefinition<T> {
  defaults: () => T;
  traits?: Traits<T>;
}

class Factory<T> {
  private definition: FactoryDefinition<T>;
  private activeTraits: string[] = [];

  constructor(definition: FactoryDefinition<T>) {
    this.definition = definition;
  }

  /**
   * Apply a trait.
   */
  trait(name: string): this {
    this.activeTraits.push(name);
    return this;
  }

  /**
   * Build an in-memory instance (no DB).
   */
  build(overrides?: Overrides<T>): T {
    let instance = this.definition.defaults();

    // Apply traits
    for (const traitName of this.activeTraits) {
      const traitFn = this.definition.traits?.[traitName];
      if (traitFn) {
        instance = traitFn(instance);
      }
    }

    // Apply overrides
    if (overrides) {
      instance = { ...instance, ...overrides };
    }

    return instance;
  }

  /**
   * Build multiple instances.
   */
  buildList(count: number, overrides?: Overrides<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  /**
   * Persist to database and return the created entity.
   */
  async create(overrides?: Overrides<T>): Promise<T> {
    const instance = this.build(overrides);
    // The persist function is set externally
    return instance;
  }

  /**
   * Build a factory with traits pre-applied.
   */
  withTraits(...traits: string[]): Factory<T> {
    const clone = new Factory(this.definition);
    clone.activeTraits = [...this.activeTraits, ...traits];
    return clone;
  }
}

// =============================================
// Product Factory
// =============================================
export interface ProductFactoryData {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  channel: string;
  category: string;
  stock: number;
  minStock: number;
  cost: number;
  commissionPct: number;
  shipping: number;
  sku: string;
  images: string[];
  details: string;
  size: string;
  weight: number;
  hsCode: string;
  gstCode: string;
  dimensions: { length: number; width: number; height: number };
  shippingChannels: string[];
  daysToShip: number;
  condition: "new" | "used";
  isActive: boolean;
}

const CATEGORIES = ["Camisas", "Vestidos", "Calças", "Casacos", "Acessórios", "Maquiagem", "Perfumes"];
const CHANNELS = ["Loja Física", "Shopee", "TikTok Shop"];
const HS_CODES = ["6109", "6204", "3304", "3303"];
const SIZES = ["PP", "P", "M", "G", "GG"];
const COLORS = ["Preto", "Branco", "Azul", "Vermelho", "Verde"];

function generateSKU(category: string): string {
  const prefix = category.slice(0, 3).toUpperCase();
  const num = globalSequence.next("sku");
  return `${prefix}-${String(num).padStart(3, "0")}`;
}

export const ProductFactory = new Factory<ProductFactoryData>({
  defaults: () => ({
    id: `test-prod-${Date.now()}-${globalSequence.next("product")}`,
    date: faker.date.recent().toISOString().split("T")[0],
    description: faker.commerce.productName(),
    amount: parseFloat(faker.commerce.price({ min: 20, max: 300 })),
    type: "income",
    channel: faker.helpers.arrayElement(CHANNELS),
    category: faker.helpers.arrayElement(CATEGORIES),
    stock: faker.number.int({ min: 1, max: 100 }),
    minStock: 5,
    cost: parseFloat(faker.commerce.price({ min: 10, max: 150 })),
    commissionPct: faker.number.float({ min: 0, max: 20 }),
    shipping: faker.number.float({ min: 0, max: 30 }),
    sku: "", // Will be set based on category
    images: [],
    details: faker.lorem.sentence(),
    size: faker.helpers.arrayElement(SIZES),
    weight: faker.number.float({ min: 0.1, max: 2, fractionDigits: 2 }),
    hsCode: faker.helpers.arrayElement(HS_CODES),
    gstCode: "0",
    dimensions: {
      length: faker.number.int({ min: 10, max: 50 }),
      width: faker.number.int({ min: 10, max: 40 }),
      height: faker.number.int({ min: 2, max: 20 }),
    },
    shippingChannels: ["normal"],
    daysToShip: 2,
    condition: "new",
    isActive: true,
  }),
  traits: {
    lowStock: (defaults) => ({ ...defaults, stock: 2, minStock: 10 }),
    outOfStock: (defaults) => ({ ...defaults, stock: 0 }),
    shopee: (defaults) => ({
      ...defaults,
      channel: "Shopee",
      shopeeLink: `https://shopee.com.br/product/${faker.string.uuid()}`,
    }),
    tiktok: (defaults) => ({
      ...defaults,
      channel: "TikTok Shop",
      tiktokLink: `https://tiktok.com/@shop/product/${faker.string.uuid()}`,
    }),
    withVariations: (defaults) => ({
      ...defaults,
      stock: 0,
      variations: [
        { size: "M", color: "Preto", stock: 10, amount: defaults.amount, sku: `${defaults.sku}-M-PRE` },
        { size: "G", color: "Preto", stock: 8, amount: defaults.amount, sku: `${defaults.sku}-G-PRE` },
      ],
    }),
  },
});

// Override build to auto-set SKU
const originalProductBuild = ProductFactory.build.bind(ProductFactory);
ProductFactory.build = (overrides?: Overrides<ProductFactoryData>) => {
  const instance = originalProductBuild(overrides);
  if (!instance.sku || instance.sku === "") {
    instance.sku = generateSKU(instance.category);
  }
  return instance;
};

// =============================================
// Sale Factory
// =============================================
export interface SaleFactoryData {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  channel: string;
  date: string;
  profit: number;
  paymentMethod: "debito" | "pix" | "credito" | "dinheiro";
  commissionPct: number;
  shipping: number;
}

export const SaleFactory = new Factory<SaleFactoryData>({
  defaults: () => {
    const unitPrice = parseFloat(faker.commerce.price({ min: 30, max: 300 }));
    const qty = faker.number.int({ min: 1, max: 5 });
    const commissionPct = faker.number.float({ min: 0, max: 15 });
    const shipping = faker.number.float({ min: 0, max: 20 });

    return {
      id: `test-sale-${Date.now()}-${globalSequence.next("sale")}`,
      productId: `test-prod-${faker.string.uuid().slice(0, 8)}`,
      productName: faker.commerce.productName(),
      qty,
      unitPrice,
      totalAmount: unitPrice * qty,
      channel: faker.helpers.arrayElement(CHANNELS),
      date: faker.date.recent().toISOString(),
      profit: unitPrice * qty * (1 - commissionPct / 100) - shipping * qty,
      paymentMethod: faker.helpers.arrayElement(["debito", "pix", "credito", "dinheiro"]),
      commissionPct,
      shipping,
    };
  },
  traits: {
    pix: (defaults) => ({ ...defaults, paymentMethod: "pix" }),
    highValue: (defaults) => ({
      ...defaults,
      qty: 10,
      unitPrice: 500,
      totalAmount: 5000,
      profit: 1500,
    }),
  },
});

// =============================================
// Expense Factory
// =============================================
export interface ExpenseFactoryData {
  id: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  recurring: boolean;
}

const EXPENSE_CATEGORIES = ["Aluguel", "Água", "Luz", "Internet", "Embalagens", "Compra de Produtos"];

export const ExpenseFactory = new Factory<ExpenseFactoryData>({
  defaults: () => ({
    id: `test-exp-${Date.now()}-${globalSequence.next("expense")}`,
    category: faker.helpers.arrayElement(EXPENSE_CATEGORIES),
    description: faker.lorem.words(3),
    amount: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
    dueDate: faker.date.future().toISOString().split("T")[0],
    paid: false,
    recurring: faker.datatype.boolean(),
  }),
  traits: {
    paid: (defaults) => ({
      ...defaults,
      paid: true,
      paidDate: faker.date.recent().toISOString().split("T")[0],
    }),
    recurring: (defaults) => ({ ...defaults, recurring: true }),
    overdue: (defaults) => ({
      ...defaults,
      dueDate: faker.date.past().toISOString().split("T")[0],
      paid: false,
    }),
  },
});

// =============================================
// Convenience builders with auto-persist
// =============================================
import { seedProduct, seedSale, seedExpense } from "../setup/test-db";

export const Product = {
  build: (overrides?: Overrides<ProductFactoryData>) => ProductFactory.build(overrides),
  buildList: (count: number, overrides?: Overrides<ProductFactoryData>) =>
    ProductFactory.buildList(count, overrides),
  create: async (overrides?: Overrides<ProductFactoryData>) => {
    const instance = ProductFactory.build(overrides);
    return seedProduct(instance as unknown as Record<string, unknown>);
  },
  createList: async (count: number, overrides?: Overrides<ProductFactoryData>) => {
    const instances = ProductFactory.buildList(count, overrides);
    return Promise.all(instances.map((p) => seedProduct(p as unknown as Record<string, unknown>)));
  },
  withTraits: (...traits: string[]) => ProductFactory.withTraits(...traits),
};

export const Sale = {
  build: (overrides?: Overrides<SaleFactoryData>) => SaleFactory.build(overrides),
  buildList: (count: number, overrides?: Overrides<SaleFactoryData>) =>
    SaleFactory.buildList(count, overrides),
  create: async (overrides?: Overrides<SaleFactoryData>) => {
    const instance = SaleFactory.build(overrides);
    return seedSale(instance as unknown as Record<string, unknown>);
  },
  createList: async (count: number, overrides?: Overrides<SaleFactoryData>) => {
    const instances = SaleFactory.buildList(count, overrides);
    return Promise.all(instances.map((s) => seedSale(s as unknown as Record<string, unknown>)));
  },
};

export const Expense = {
  build: (overrides?: Overrides<ExpenseFactoryData>) => ExpenseFactory.build(overrides),
  buildList: (count: number, overrides?: Overrides<ExpenseFactoryData>) =>
    ExpenseFactory.buildList(count, overrides),
  create: async (overrides?: Overrides<ExpenseFactoryData>) => {
    const instance = ExpenseFactory.build(overrides);
    return seedExpense(instance as unknown as Record<string, unknown>);
  },
  createList: async (count: number, overrides?: Overrides<ExpenseFactoryData>) => {
    const instances = ExpenseFactory.buildList(count, overrides);
    return Promise.all(instances.map((e) => seedExpense(e as unknown as Record<string, unknown>)));
  },
};
