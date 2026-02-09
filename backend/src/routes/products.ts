import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { logAudit } from "../lib/audit";
import { getProductCategory } from "../lib/catalog";
import { productsCol, inventoryItemsCol } from "../lib/firestore";
import { validate, createProductSchema, createRecipeItemSchema } from "../lib/validation";

export const productsRouter = Router();

/* ------------------------------------------------------------------ */
/*  GET /  –  List all products                                        */
/* ------------------------------------------------------------------ */
productsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const includeRecipes = req.query.includeRecipes === "true";

    const productsSnap = await productsCol.orderBy("name").get();
    const products = productsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const result = products.map((product: any) => {
      const mapped: any = {
        ...product,
        price: product.price,
        sellingPrice: product.price,
        category: getProductCategory(product.sku),
      };

      // Recipes are embedded in the product doc as an array.
      // Only include them when explicitly requested.
      if (!includeRecipes) {
        delete mapped.recipes;
      }

      return mapped;
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /  –  Create a new product                                    */
/* ------------------------------------------------------------------ */
productsRouter.post(
  "/",
  requireAuth,
  requireRole(["Inventory Manager", "Supervisor", "Owner", "System Admin"]),
  validate(createProductSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, sku, price } = req.body as {
        name?: string;
        sku?: string;
        price?: number;
      };

      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!name || price === undefined) {
        return res.status(400).json({ error: "Missing name or price" });
      }

      const productData = {
        name,
        sku: sku || null,
        price,
        recipes: [],
        createdAt: new Date(),
      };

      const docRef = await productsCol.add(productData);
      const product = { id: docRef.id, ...productData };

      await logAudit({
        actorId: createdById,
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: docRef.id,
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  POST /:id/recipes  –  Add a recipe item to a product               */
/* ------------------------------------------------------------------ */
productsRouter.post(
  "/:id/recipes",
  requireAuth,
  requireRole(["Inventory Manager", "Supervisor", "Owner", "System Admin"]),
  validate(createRecipeItemSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const productId = req.params.id;
      const { inventoryItemId, quantityUsed } = req.body as {
        inventoryItemId?: string;
        quantityUsed?: number;
      };

      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!inventoryItemId || quantityUsed === undefined) {
        return res
          .status(400)
          .json({ error: "Missing inventory item or quantity" });
      }

      // Verify the inventory item exists
      const invItemDoc = await inventoryItemsCol.doc(inventoryItemId).get();
      if (!invItemDoc.exists) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      const invItemData = invItemDoc.data();
      const inventoryItemName = invItemData?.name || "Unknown";

      // Verify the product exists
      const productRef = productsCol.doc(productId);
      const productDoc = await productRef.get();
      if (!productDoc.exists) {
        return res.status(404).json({ error: "Product not found" });
      }

      const productData = productDoc.data() as any;
      const currentRecipes: any[] = productData.recipes || [];

      const newRecipeEntry = {
        inventoryItemId,
        quantityUsed,
        inventoryItemName,
      };

      // Append the new recipe entry to the existing array
      const updatedRecipes = [...currentRecipes, newRecipeEntry];
      await productRef.update({ recipes: updatedRecipes });

      await logAudit({
        actorId: createdById,
        action: "RECIPE_ITEM_CREATED",
        entityType: "Product",
        entityId: productId,
        metadata: { inventoryItemId, quantityUsed },
      });

      return res.status(201).json(newRecipeEntry);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to add recipe item" });
    }
  }
);
