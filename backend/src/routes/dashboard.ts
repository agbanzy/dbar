import { Router } from "express";
import {
  salesCol,
  expensesCol,
  inventoryItemsCol,
  stockMovementsCol,
  stockCountsCol,
} from "../lib/firestore";
import { sumStockMovements } from "../lib/inventory";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

export const dashboardRouter = Router();

/** Convert a Firestore Timestamp or Date field to a JS Date */
const toDate = (value: any): Date => {
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

dashboardRouter.get("/summary", requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch approved sales for today
    const approvedSalesSnap = await salesCol
      .where("status", "==", "APPROVED")
      .where("createdAt", ">=", startOfDay)
      .orderBy("createdAt", "desc")
      .get();

    const totals = { cash: 0, card: 0, transfer: 0 };

    for (const doc of approvedSalesSnap.docs) {
      const sale = doc.data();
      const amount = Number(sale.totalAmount) || 0;
      if (sale.paymentMethod === "CASH") totals.cash += amount;
      if (sale.paymentMethod === "CARD") totals.card += amount;
      if (sale.paymentMethod === "TRANSFER") totals.transfer += amount;
    }

    // Count pending sales
    const pendingSalesSnap = await salesCol
      .where("status", "==", "PENDING")
      .get();
    const pendingSalesCount = pendingSalesSnap.size;

    // Count pending expenses
    const pendingExpensesSnap = await expensesCol
      .where("status", "==", "PENDING")
      .get();
    const pendingExpensesCount = pendingExpensesSnap.size;

    // Low stock count
    const inventorySnap = await inventoryItemsCol.get();
    const inventoryItems = inventorySnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((item) => item.reorderLevel != null);

    let lowStockCount = 0;

    if (inventoryItems.length > 0) {
      const movementsSnap = await stockMovementsCol.get();
      const movements = movementsSnap.docs
        .map((d) => d.data() as { inventoryItemId: string; type: string; quantity: number })
        .filter((m) => inventoryItems.some((item: any) => item.id === m.inventoryItemId));

      const onHandTotals = sumStockMovements(movements);

      lowStockCount = inventoryItems.filter((item: any) => {
        const onHand = onHandTotals.get(item.id) || 0;
        return onHand <= (item.reorderLevel || 0);
      }).length;
    }

    // Variance rate from today's stock counts
    let varianceRate: string | null = null;

    const countsSnap = await stockCountsCol
      .where("createdAt", ">=", startOfDay)
      .orderBy("createdAt", "desc")
      .get();

    if (countsSnap.size > 0) {
      let expectedTotal = 0;
      let varianceTotal = 0;

      for (const doc of countsSnap.docs) {
        const count = doc.data();
        expectedTotal += Number(count.expectedQty) || 0;
        varianceTotal += Number(count.variance) || 0;
      }

      if (expectedTotal !== 0) {
        varianceRate = ((varianceTotal / expectedTotal) * 100).toFixed(2);
      }
    }

    const total = totals.cash + totals.card + totals.transfer;

    return res.json({
      totals: {
        cash: totals.cash.toString(),
        card: totals.card.toString(),
        transfer: totals.transfer.toString(),
        total: total.toString(),
      },
      todaySales: total,
      pendingSalesCount,
      pendingExpensesCount,
      lowStockCount,
      varianceRate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});
