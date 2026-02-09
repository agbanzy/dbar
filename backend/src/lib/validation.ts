import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Sale schemas
export const createSaleSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "POS"]).catch("CASH"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1,"Invalid product ID"),
        quantity: z.number().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one item is required"),
});

// Expense schemas
export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  receiptUrl: z.string().url("Invalid receipt URL").optional(),
});

// Inventory schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  reorderLevel: z.number().nonnegative("Reorder level must be non-negative").optional(),
});

export const stockInSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().min(1,"Invalid item ID").optional(),
        inventoryItemId: z.string().min(1,"Invalid inventory item ID").optional(),
        quantity: z.number().positive("Quantity must be positive"),
        costPrice: z.number().positive("Cost price must be positive").optional(),
        unitCost: z.number().positive("Unit cost must be positive").optional(),
        supplier: z.string().optional(),
        receiptUrl: z.string().url("Invalid receipt URL").optional(),
      })
    )
    .min(1, "At least one item is required")
    .optional(),
  // Single item format
  inventoryItemId: z.string().min(1,"Invalid inventory item ID").optional(),
  quantity: z.number().positive("Quantity must be positive").optional(),
  unitCost: z.number().positive("Unit cost must be positive").optional(),
  supplier: z.string().optional(),
  receiptUrl: z.string().url("Invalid receipt URL").optional(),
  notes: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1,"Invalid inventory item ID"),
  quantity: z.number(),
  reason: z.string().optional(),
});

export const stockCountSchema = z.object({
  inventoryItemId: z.string().min(1,"Invalid inventory item ID"),
  countedQty: z.number().nonnegative("Counted quantity must be non-negative"),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  price: z.number().positive("Price must be positive"),
});

export const createRecipeItemSchema = z.object({
  inventoryItemId: z.string().min(1,"Invalid inventory item ID"),
  quantityUsed: z.number().positive("Quantity used must be positive"),
});

// User schemas
export const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleName: z.string().min(1, "Role name is required"),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  roleName: z.string().min(1, "Role name is required").optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

// Validation middleware helper
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }
      return res.status(400).json({ error: "Invalid request data" });
    }
  };
};
