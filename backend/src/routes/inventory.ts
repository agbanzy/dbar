import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { logAudit } from "../lib/audit";
import {
  db,
  inventoryItemsCol,
  stockBatchesCol,
  stockMovementsCol,
  stockCountsCol,
} from "../lib/firestore";
import { sumStockMovements, averageUnitCost } from "../lib/inventory";
import { validate, stockInSchema, stockAdjustmentSchema, stockCountSchema } from "../lib/validation";

export const inventoryRouter = Router();

/* ------------------------------------------------------------------ */
/*  GET / and GET /items  –  List all inventory items                  */
/* ------------------------------------------------------------------ */
const getInventoryItems = async (_req: AuthenticatedRequest, res: any) => {
  try {
    const itemsSnap = await inventoryItemsCol.orderBy("name").get();
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (items.length === 0) {
      return res.json([]);
    }

    // Fetch all stock movements for these items
    const movementsSnap = await stockMovementsCol.get();
    const movements = movementsSnap.docs
      .map((d) => d.data() as { inventoryItemId: string; type: string; quantity: number })
      .filter((m) => items.some((item) => item.id === m.inventoryItemId));

    const totals = sumStockMovements(movements);

    // Fetch all stock batches for these items
    const batchesSnap = await stockBatchesCol.get();
    const batches = batchesSnap.docs
      .map((d) => d.data() as { inventoryItemId: string; quantity: number; unitCost: number })
      .filter((b) => items.some((item) => item.id === b.inventoryItemId));

    const averageCosts = averageUnitCost(batches);

    const result = items.map((item: any) => ({
      ...item,
      reorderLevel: item.reorderLevel ?? -1,
      onHand: totals.get(item.id) || 0,
      quantity: totals.get(item.id) || 0,
      costPrice: averageCosts.get(item.id) || 0,
      category: item.unit,
    }));

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

inventoryRouter.get("/", requireAuth, getInventoryItems);
inventoryRouter.get("/items", requireAuth, getInventoryItems);

/* ------------------------------------------------------------------ */
/*  GET /low  –  Items at or below reorder level                       */
/* ------------------------------------------------------------------ */
inventoryRouter.get("/low", requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const itemsSnap = await inventoryItemsCol.orderBy("name").get();
    const items = itemsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((item) => item.reorderLevel != null);

    if (items.length === 0) {
      return res.json([]);
    }

    const movementsSnap = await stockMovementsCol.get();
    const movements = movementsSnap.docs
      .map((d) => d.data() as { inventoryItemId: string; type: string; quantity: number })
      .filter((m) => items.some((item: any) => item.id === m.inventoryItemId));

    const totals = sumStockMovements(movements);

    const result = items
      .map((item: any) => ({
        ...item,
        onHand: totals.get(item.id) || 0,
      }))
      .filter((item: any) => item.onHand <= item.reorderLevel);

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch low stock" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /items  –  Create a new inventory item                        */
/* ------------------------------------------------------------------ */
inventoryRouter.post(
  "/items",
  requireAuth,
  requireRole(["Inventory Manager", "Supervisor", "Owner", "System Admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, unit, reorderLevel } = req.body as {
        name?: string;
        unit?: string;
        reorderLevel?: number;
      };

      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!name || !unit) {
        return res.status(400).json({ error: "Missing name or unit" });
      }

      const docRef = await inventoryItemsCol.add({
        name,
        unit,
        reorderLevel: reorderLevel ?? null,
        createdAt: new Date(),
      });

      const item = { id: docRef.id, name, unit, reorderLevel: reorderLevel ?? null };

      await logAudit({
        actorId: createdById,
        action: "INVENTORY_ITEM_CREATED",
        entityType: "InventoryItem",
        entityId: docRef.id,
      });

      return res.status(201).json(item);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create inventory item" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  POST /stock-in  –  Stock in (batch or single)                      */
/* ------------------------------------------------------------------ */
inventoryRouter.post(
  "/stock-in",
  requireAuth,
  requireRole(["Inventory Manager", "Supervisor", "Owner", "System Admin"]),
  validate(stockInSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Support batch format: { items: [{itemId, quantity, costPrice}], notes }
      // and single-item format: { inventoryItemId, quantity, unitCost, supplier, receiptUrl }
      const {
        items,
        notes,
        inventoryItemId,
        quantity,
        unitCost,
        supplier,
        receiptUrl,
      } = req.body as {
        items?: {
          itemId?: string;
          inventoryItemId?: string;
          quantity: number;
          costPrice?: number;
          unitCost?: number;
          supplier?: string;
          receiptUrl?: string;
        }[];
        notes?: string;
        inventoryItemId?: string;
        quantity?: number;
        unitCost?: number;
        supplier?: string;
        receiptUrl?: string;
      };

      // Normalize to a batch of entries
      const entries = items
        ? items.map((i) => ({
            inventoryItemId: i.inventoryItemId || i.itemId,
            quantity: i.quantity,
            unitCost: i.unitCost ?? i.costPrice,
            supplier: i.supplier,
            receiptUrl: i.receiptUrl,
          }))
        : inventoryItemId && quantity !== undefined && unitCost !== undefined
          ? [{ inventoryItemId, quantity, unitCost, supplier, receiptUrl }]
          : [];

      if (entries.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate and narrow types
      const validEntries: {
        inventoryItemId: string;
        quantity: number;
        unitCost: number;
        supplier?: string;
        receiptUrl?: string;
      }[] = [];

      for (const entry of entries) {
        if (!entry.inventoryItemId) {
          return res.status(400).json({ error: "Missing inventory item" });
        }
        if (!entry.unitCost || entry.unitCost <= 0 || entry.quantity <= 0) {
          return res
            .status(400)
            .json({ error: "Quantity and unit cost must be positive" });
        }
        validEntries.push({
          inventoryItemId: entry.inventoryItemId,
          quantity: entry.quantity,
          unitCost: entry.unitCost,
          supplier: entry.supplier,
          receiptUrl: entry.receiptUrl,
        });
      }

      // Validate that all inventory items exist
      const itemIds = [...new Set(validEntries.map((e) => e.inventoryItemId))];
      for (const id of itemIds) {
        const itemDoc = await inventoryItemsCol.doc(id).get();
        if (!itemDoc.exists) {
          return res
            .status(404)
            .json({ error: "One or more inventory items not found" });
        }
      }

      // Run a Firestore transaction to create batches and movements atomically
      const results = await db.runTransaction(async (t) => {
        const created: { batch: any; movement: any }[] = [];

        for (const entry of validEntries) {
          const batchRef = stockBatchesCol.doc();
          const movementRef = stockMovementsCol.doc();

          const batchData = {
            inventoryItemId: entry.inventoryItemId,
            quantity: entry.quantity,
            unitCost: entry.unitCost,
            supplier: entry.supplier || supplier || notes || null,
            receiptUrl: entry.receiptUrl || receiptUrl || null,
            createdAt: new Date(),
          };

          const movementData = {
            inventoryItemId: entry.inventoryItemId,
            type: "IN",
            quantity: entry.quantity,
            reason: notes || "Stock-in",
            createdById,
            createdAt: new Date(),
          };

          t.set(batchRef, batchData);
          t.set(movementRef, movementData);

          created.push({
            batch: { id: batchRef.id, ...batchData },
            movement: { id: movementRef.id, ...movementData },
          });
        }

        return created;
      });

      // Audit each entry
      for (const entry of validEntries) {
        await logAudit({
          actorId: createdById,
          action: "STOCK_IN",
          entityType: "InventoryItem",
          entityId: entry.inventoryItemId,
          metadata: { quantity: entry.quantity },
        });
      }

      return res.status(201).json(results);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to stock-in" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  POST /adjustment  –  Stock adjustment                              */
/* ------------------------------------------------------------------ */
inventoryRouter.post(
  "/adjustment",
  requireAuth,
  requireRole(["Inventory Manager", "Supervisor", "Owner", "System Admin"]),
  validate(stockAdjustmentSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { inventoryItemId, quantity, reason } = req.body as {
        inventoryItemId?: string;
        quantity?: number;
        reason?: string;
      };

      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!inventoryItemId || quantity === undefined) {
        return res
          .status(400)
          .json({ error: "Missing inventory item or quantity" });
      }

      // Verify inventory item exists
      const itemDoc = await inventoryItemsCol.doc(inventoryItemId).get();
      if (!itemDoc.exists) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      const movementData = {
        inventoryItemId,
        type: "ADJUSTMENT",
        quantity,
        reason: reason || null,
        createdById,
        createdAt: new Date(),
      };

      const docRef = await stockMovementsCol.add(movementData);
      const movement = { id: docRef.id, ...movementData };

      await logAudit({
        actorId: createdById,
        action: "STOCK_ADJUSTMENT",
        entityType: "InventoryItem",
        entityId: inventoryItemId,
        metadata: { quantity, reason },
      });

      return res.status(201).json(movement);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to adjust stock" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  POST /count  –  Record a stock count                               */
/* ------------------------------------------------------------------ */
inventoryRouter.post(
  "/count",
  requireAuth,
  requireRole(["Inventory Manager", "Supervisor", "Owner", "System Admin"]),
  validate(stockCountSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { inventoryItemId, countedQty } = req.body as {
        inventoryItemId?: string;
        countedQty?: number;
      };

      const countedById = req.user?.userId;
      if (!countedById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!inventoryItemId || countedQty === undefined) {
        return res
          .status(400)
          .json({ error: "Missing inventory item or counted quantity" });
      }

      // Calculate expected quantity from movements
      const movementsSnap = await stockMovementsCol
        .where("inventoryItemId", "==", inventoryItemId)
        .get();

      const movements = movementsSnap.docs.map(
        (d) =>
          d.data() as {
            inventoryItemId: string;
            type: string;
            quantity: number;
          }
      );

      const totals = sumStockMovements(movements);
      const expectedQty = totals.get(inventoryItemId) || 0;
      const variance = countedQty - expectedQty;

      const countData = {
        inventoryItemId,
        expectedQty,
        countedQty,
        variance,
        countedById,
        createdAt: new Date(),
      };

      const docRef = await stockCountsCol.add(countData);
      const record = { id: docRef.id, ...countData };

      await logAudit({
        actorId: countedById,
        action: "STOCK_COUNT",
        entityType: "InventoryItem",
        entityId: inventoryItemId,
        metadata: {
          expected: expectedQty.toString(),
          counted: countedQty.toString(),
        },
      });

      return res.status(201).json(record);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to record stock count" });
    }
  }
);
