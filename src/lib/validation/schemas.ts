import { z } from "zod";

// Product schemas
export const ProductCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  salePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  productType: z.string().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  variants: z.array(z.object({
    sku: z.string().min(1, "SKU is required"),
    size: z.string().optional(),
    color: z.string().optional(),
    stockQuantity: z.number().int().min(0, "Stock quantity must be non-negative"),
    reorderLevel: z.number().int().min(0).optional(),
    barcode: z.string().optional(),
  })).min(1, "At least one variant is required"),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

// Purchase Order schemas
export const PurchaseOrderCreateSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  reference: z.string().min(1, "Reference is required"),
  items: z.array(z.object({
    product: z.string().min(1, "Product is required"),
    variantSku: z.string().min(1, "Variant SKU is required"),
    quantityOrdered: z.number().int().positive("Quantity must be positive"),
    unitCost: z.number().positive("Unit cost must be positive"),
  })).min(1, "At least one item is required"),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const PurchaseOrderUpdateSchema = PurchaseOrderCreateSchema.partial();

export const PurchaseOrderReceiveSchema = z.object({
  items: z.array(z.object({
    product: z.string().min(1, "Product is required"),
    variantSku: z.string().min(1, "Variant SKU is required"),
    quantityReceived: z.number().int().min(0, "Quantity received must be non-negative"),
  })).optional(),
});

// Sale schemas
export const SaleCreateSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  items: z.array(z.object({
    product: z.string().min(1, "Product is required"),
    variantSku: z.string().min(1, "Variant SKU is required"),
    quantity: z.number().int().positive("Quantity must be positive"),
    unitPrice: z.number().positive("Unit price must be positive"),
  })).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

export const SaleUpdateSchema = SaleCreateSchema.partial();

// Supplier schemas
export const SupplierCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const SupplierUpdateSchema = SupplierCreateSchema.partial();

// Expense schemas
export const ExpenseCreateSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().optional(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const ExpenseUpdateSchema = ExpenseCreateSchema.partial();

// Product Type schemas
export const ProductTypeCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  jsonSchema: z.record(z.string(), z.any()),
});

export const ProductTypeUpdateSchema = ProductTypeCreateSchema.partial();

// Payment schemas
export const PaymentCreateSchema = z.object({
  invoice: z.string().min(1, "Invoice is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["cash", "card", "bank_transfer", "check", "other"]),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Stock adjustment schemas
export const StockAdjustmentSchema = z.object({
  product: z.string().min(1, "Product is required"),
  variantSku: z.string().min(1, "Variant SKU is required"),
  quantity: z.number().int("Quantity must be an integer"),
  reason: z.string().optional(),
});

// Report query schemas
export const ReportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(["day", "week", "month"]).optional(),
  method: z.string().optional(),
});

// Common ID parameter schema
export const IdParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// Common business parameter schema
export const BusinessParamSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
});
