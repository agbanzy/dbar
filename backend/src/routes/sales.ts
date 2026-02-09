import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { logAudit } from "../lib/audit";
import { getProductCategory } from "../lib/catalog";
import {
  db,
  salesCol,
  productsCol,
  stockMovementsCol,
  usersCol,
} from "../lib/firestore";
import { validate, createSaleSchema } from "../lib/validation";

export const salesRouter = Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const VALID_PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER"];

/** Fetch a user document and return a slim object (or null). */
const fetchUser = async (userId?: string | null) => {
  if (!userId) return null;
  const snap = await usersCol.doc(userId).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    fullName: d.fullName ?? null,
    email: d.email ?? null,
    role: d.role ?? null,
  };
};

/** Map a Firestore sale document into the API response shape. */
const mapSaleDoc = async (
  id: string,
  data: FirebaseFirestore.DocumentData
) => {
  const [createdBy, approvedBy] = await Promise.all([
    fetchUser(data.createdById),
    fetchUser(data.approvedById),
  ]);

  return {
    id,
    ...data,
    createdBy,
    approvedBy,
    items: (data.items ?? []).map((item: any) => ({
      ...item,
      subtotal: item.lineTotal,
      product: item.product
        ? {
            ...item.product,
            category: getProductCategory(item.product.sku),
          }
        : undefined,
    })),
  };
};

/* ------------------------------------------------------------------ */
/*  GET /  – list sales                                                */
/* ------------------------------------------------------------------ */

salesRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string | undefined;

    let query: FirebaseFirestore.Query = salesCol.orderBy("createdAt", "desc");

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      query = salesCol
        .where("status", "==", status)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    const sales = await Promise.all(
      snapshot.docs.map((doc) => mapSaleDoc(doc.id, doc.data()))
    );

    return res.json(sales);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch sales" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /:id  – single sale                                            */
/* ------------------------------------------------------------------ */

salesRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await salesCol.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const sale = await mapSaleDoc(doc.id, doc.data()!);
    return res.json(sale);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch sale" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /  – create sale                                              */
/* ------------------------------------------------------------------ */

salesRouter.post(
  "/",
  requireAuth,
  requireRole(["Waitress", "Supervisor", "Owner", "System Admin"]),
  validate(createSaleSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentMethod, items } = req.body as {
        paymentMethod?: string;
        items?: { productId: string; quantity: number }[];
      };

      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!paymentMethod || !items || items.length === 0) {
        return res
          .status(400)
          .json({ error: "Missing payment method or items" });
      }

      // Normalise payment method (POS -> CARD)
      const normalised = paymentMethod.toUpperCase();
      const mappedPayment = normalised === "POS" ? "CARD" : normalised;
      if (!VALID_PAYMENT_METHODS.includes(mappedPayment)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      // Fetch all referenced products in one batch
      const productIds = items.map((i) => i.productId);
      const productSnaps = await Promise.all(
        productIds.map((id) => productsCol.doc(id).get())
      );

      const productMap = new Map<string, FirebaseFirestore.DocumentData>();
      for (const snap of productSnaps) {
        if (snap.exists) {
          productMap.set(snap.id, { id: snap.id, ...snap.data()! });
        }
      }

      // Build embedded sale items
      const saleItems: any[] = [];
      let totalAmount = 0;

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({ error: "Invalid item quantity" });
        }
        const product = productMap.get(item.productId);
        if (!product) {
          return res
            .status(404)
            .json({ error: `Product not found: ${item.productId}` });
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;

        saleItems.push({
          productId: product.id,
          productName: product.name ?? product.productName ?? null,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          product: {
            id: product.id,
            name: product.name ?? product.productName ?? null,
            sku: product.sku ?? null,
            price: unitPrice,
          },
        });

        totalAmount += lineTotal;
      }

      // Persist the sale document
      const saleData = {
        createdById,
        status: "PENDING",
        paymentMethod: mappedPayment,
        totalAmount,
        items: saleItems,
        createdAt: new Date(),
      };

      const docRef = await salesCol.add(saleData);

      await logAudit({
        actorId: createdById,
        action: "SALE_CREATED",
        entityType: "Sale",
        entityId: docRef.id,
        metadata: { totalAmount: totalAmount.toString() },
      });

      return res.status(201).json({ id: docRef.id, ...saleData });
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to create sale";
      if (message.startsWith("Product not found")) {
        return res.status(404).json({ error: message });
      }
      if (message === "Invalid quantity") {
        return res.status(400).json({ error: "Invalid item quantity" });
      }
      return res.status(500).json({ error: "Failed to create sale" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Approve handler                                                    */
/* ------------------------------------------------------------------ */

const approveHandler = async (req: AuthenticatedRequest, res: any) => {
  try {
    const saleId = req.params.id;
    const approvedById = req.user?.userId;

    if (!approvedById) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Fetch sale
    const saleSnap = await salesCol.doc(saleId).get();
    if (!saleSnap.exists) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const sale = saleSnap.data()!;
    if (sale.status !== "PENDING") {
      return res.status(400).json({ error: "Sale already processed" });
    }

    const saleItems: any[] = sale.items ?? [];

    // 2. Fetch products with their recipes for every sale item
    const uniqueProductIds = [...new Set(saleItems.map((i: any) => i.productId))];
    const productSnaps = await Promise.all(
      uniqueProductIds.map((id) => productsCol.doc(id).get())
    );
    const productMap = new Map<string, FirebaseFirestore.DocumentData>();
    for (const snap of productSnaps) {
      if (snap.exists) {
        productMap.set(snap.id, { id: snap.id, ...snap.data()! });
      }
    }

    // 3. Calculate required inventory per item
    const requiredByItem = new Map<string, number>();
    const stockMovementsToCreate: any[] = [];

    for (const item of saleItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product data missing for ${item.productId}` });
      }

      const recipes: any[] = product.recipes ?? [];
      if (recipes.length === 0) {
        return res.status(400).json({
          error: `Missing recipe for product ${item.productId}`,
        });
      }

      for (const recipe of recipes) {
        const quantity = Number(recipe.quantityUsed) * Number(item.quantity);

        stockMovementsToCreate.push({
          inventoryItemId: recipe.inventoryItemId,
          type: "OUT",
          quantity,
          reason: `Sale ${saleId}`,
          relatedSaleId: saleId,
          createdById: approvedById,
          createdAt: new Date(),
        });

        const current = requiredByItem.get(recipe.inventoryItemId) ?? 0;
        requiredByItem.set(recipe.inventoryItemId, current + quantity);
      }
    }

    // 4. Check stock sufficiency
    const inventoryItemIds = Array.from(requiredByItem.keys());

    // Aggregate existing stock movements for each relevant inventory item
    const onHand = new Map<string, number>();

    for (const invId of inventoryItemIds) {
      const movSnap = await stockMovementsCol
        .where("inventoryItemId", "==", invId)
        .get();

      let balance = 0;
      for (const mDoc of movSnap.docs) {
        const m = mDoc.data();
        const qty = Number(m.quantity);
        if (m.type === "IN" || m.type === "ADJUSTMENT") {
          balance += qty;
        } else if (m.type === "OUT") {
          balance -= qty;
        }
      }
      onHand.set(invId, balance);
    }

    const insufficient = inventoryItemIds
      .map((id) => ({
        id,
        available: onHand.get(id) ?? 0,
        required: requiredByItem.get(id) ?? 0,
      }))
      .filter((row) => row.available < row.required);

    if (insufficient.length > 0) {
      return res.status(400).json({
        error: "Insufficient stock",
        details: insufficient.map((row) => ({
          inventoryItemId: row.id,
          required: row.required.toString(),
          available: row.available.toString(),
        })),
      });
    }

    // 5. Firestore transaction – update sale + create stock movements
    const result = await db.runTransaction(async (t) => {
      const saleRef = salesCol.doc(saleId);

      t.update(saleRef, {
        status: "APPROVED",
        approvedById,
        approvedAt: new Date(),
      });

      for (const movement of stockMovementsToCreate) {
        const movRef = stockMovementsCol.doc();
        t.set(movRef, movement);
      }

      return {
        id: saleId,
        ...sale,
        status: "APPROVED",
        approvedById,
        approvedAt: new Date(),
      };
    });

    await logAudit({
      actorId: approvedById,
      action: "SALE_APPROVED",
      entityType: "Sale",
      entityId: saleId,
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to approve sale" });
  }
};

/* ------------------------------------------------------------------ */
/*  Reject handler                                                     */
/* ------------------------------------------------------------------ */

const rejectHandler = async (req: AuthenticatedRequest, res: any) => {
  try {
    const saleId = req.params.id;
    const approvedById = req.user?.userId;

    if (!approvedById) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const saleSnap = await salesCol.doc(saleId).get();
    if (!saleSnap.exists) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const existing = saleSnap.data()!;
    if (existing.status !== "PENDING") {
      return res.status(400).json({ error: "Sale already processed" });
    }

    const now = new Date();
    await salesCol.doc(saleId).update({
      status: "REJECTED",
      approvedById,
      approvedAt: now,
    });

    await logAudit({
      actorId: approvedById,
      action: "SALE_REJECTED",
      entityType: "Sale",
      entityId: saleId,
      metadata: { reason: req.body?.reason },
    });

    return res.json({
      id: saleId,
      ...existing,
      status: "REJECTED",
      approvedById,
      approvedAt: now,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reject sale" });
  }
};

/* ------------------------------------------------------------------ */
/*  Route registration (POST + PATCH for both actions)                 */
/* ------------------------------------------------------------------ */

const approveMiddleware = [
  requireAuth,
  requireRole(["Supervisor", "Owner", "System Admin"]),
];

salesRouter.post("/:id/approve", ...approveMiddleware, approveHandler);
salesRouter.patch("/:id/approve", ...approveMiddleware, approveHandler);
salesRouter.post("/:id/reject", ...approveMiddleware, rejectHandler);
salesRouter.patch("/:id/reject", ...approveMiddleware, rejectHandler);
