import { z } from "zod";

// =============================================
// Shared primitives
// =============================================
export const IdSchema = z.string().min(1);
export const IsoDateSchema = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
export const EmailSchema = z.string().email();
export const AmountSchema = z.number().min(0);
export const PositiveInt = z.number().int().min(0);

// =============================================
// Error envelope — every error response MUST match
// =============================================
export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// =============================================
// Product
// =============================================
export const ProductDimensionsSchema = z.object({
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
});

export const ProductVariationSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  image: z.string().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  amount: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  shipping: z.number().min(0).optional(),
});

export const ProductSchema = z.object({
  id: IdSchema,
  date: IsoDateSchema,
  description: z.string().min(1),
  amount: AmountSchema,
  type: z.enum(["income", "expense"]),
  channel: z.string().min(1),
  category: z.string().min(1),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0).optional(),
  cost: AmountSchema,
  commissionPct: z.number().min(0).max(100),
  shipping: AmountSchema,
  sku: z.string().optional(),
  images: z.array(z.string()),
  shopeeLink: z.string().url().optional().or(z.literal("")),
  tiktokLink: z.string().url().optional().or(z.literal("")),
  details: z.string().optional(),
  size: z.string().optional(),
  weight: z.number().min(0).optional(),
  variations: z.array(ProductVariationSchema).optional(),
  hsCode: z.string().optional(),
  gstCode: z.string().optional(),
  dimensions: ProductDimensionsSchema.optional(),
  shippingChannels: z.array(z.string()).optional(),
  daysToShip: z.number().int().min(1).max(30).optional(),
  condition: z.enum(["new", "used"]).optional(),
  isActive: z.boolean().optional(),
  addedBy: z.string().optional(),
  addedByAvatar: z.string().optional(),
  created_at: IsoDateSchema.optional(),
  updated_at: IsoDateSchema.optional(),
});
export type ProductResponse = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.object({
  data: z.array(ProductSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

// =============================================
// Sale
// =============================================
export const SaleSchema = z.object({
  id: IdSchema,
  productId: z.string().min(1),
  productName: z.string().min(1),
  qty: z.number().int().min(1),
  unitPrice: AmountSchema,
  totalAmount: AmountSchema,
  channel: z.string().min(1),
  date: IsoDateSchema,
  profit: z.number(),
  paymentMethod: z.enum(["debito", "pix", "credito", "dinheiro"]),
  commissionPct: z.number().min(0).max(100).optional(),
  shipping: AmountSchema.optional(),
  registeredBy: z.string().optional(),
  registeredByAvatar: z.string().optional(),
  created_at: IsoDateSchema.optional(),
});
export type SaleResponse = z.infer<typeof SaleSchema>;

export const SaleListSchema = z.object({
  data: z.array(SaleSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

// =============================================
// Expense
// =============================================
export const ExpenseSchema = z.object({
  id: IdSchema,
  category: z.string().min(1),
  description: z.string().min(1),
  amount: AmountSchema,
  dueDate: IsoDateSchema,
  paid: z.boolean(),
  paidDate: IsoDateSchema.optional(),
  recurring: z.boolean(),
  created_at: IsoDateSchema.optional(),
});
export type ExpenseResponse = z.infer<typeof ExpenseSchema>;

export const ExpenseListSchema = z.object({
  data: z.array(ExpenseSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

// =============================================
// Profile
// =============================================
export const ProfileSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  role: z.enum(["admin", "family"]),
  username: z.string().nullable(),
  avatar: z.string().nullable(),
  notifications: z.object({
    estoque: z.boolean(),
    vendas: z.boolean(),
    relatorios: z.boolean(),
  }).nullable(),
  created_at: IsoDateSchema,
  updated_at: IsoDateSchema,
});
export type ProfileResponse = z.infer<typeof ProfileSchema>;

// =============================================
// Auth
// =============================================
export const AuthTokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().min(0),
  refresh_token: z.string().optional(),
  user: z.object({
    id: IdSchema,
    email: EmailSchema,
  }),
});

// =============================================
// Request schemas (for validation)
// =============================================
export const CreateProductBodySchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).refine((d) => d.description.trim().length > 0, {
  message: "Description is required",
  path: ["description"],
});

export const UpdateProductBodySchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const CreateSaleBodySchema = SaleSchema.omit({
  id: true,
  created_at: true,
}).refine((d) => d.qty > 0, {
  message: "Quantity must be positive",
  path: ["qty"],
});

export const CreateExpenseBodySchema = ExpenseSchema.omit({
  id: true,
  created_at: true,
}).refine((d) => d.amount > 0, {
  message: "Amount must be positive",
  path: ["amount"],
});

// =============================================
// Pagination query
// =============================================
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  channel: z.string().optional(),
  sort: z.enum(["date", "amount", "description", "stock"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
