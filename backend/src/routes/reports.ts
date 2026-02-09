import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import {
  salesCol,
  expensesCol,
  inventoryItemsCol,
  stockMovementsCol,
  stockBatchesCol,
  productsCol,
  usersCol,
} from "../lib/firestore";
import { sumStockMovements, averageUnitCost } from "../lib/inventory";

export const reportsRouter = Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getPeriodStart = (period: string): Date => {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case "TODAY": {
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "WEEK": {
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "YEAR": {
      return new Date(now.getFullYear(), 0, 1);
    }
    case "MONTH":
    default: {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
};

/** Convert a Firestore Timestamp or Date field to a JS Date */
const toDate = (value: any): Date => {
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

/** Format a Date as YYYY-MM-DD */
const formatDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Format a Date as YYYY-MM */
const formatMonth = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/* ------------------------------------------------------------------ */
/*  GET / – Main reports                                               */
/* ------------------------------------------------------------------ */

reportsRouter.get("/", requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const period = ((_req.query.period as string) || "MONTH").toUpperCase();
    const startDate = getPeriodStart(period);

    // Fetch approved sales in period
    const salesSnap = await salesCol
      .where("status", "==", "APPROVED")
      .where("createdAt", ">=", startDate)
      .orderBy("createdAt", "desc")
      .get();

    // Fetch approved expenses in period
    const expensesSnap = await expensesCol
      .where("status", "==", "APPROVED")
      .where("createdAt", ">=", startDate)
      .orderBy("createdAt", "desc")
      .get();

    // --- Aggregate sales ---
    let totalSales = 0;
    const salesCount = salesSnap.size;
    const paymentMap = new Map<string, { count: number; total: number }>();
    const productRevenue = new Map<
      string,
      { productId: string; quantity: number; revenue: number }
    >();

    for (const doc of salesSnap.docs) {
      const sale = doc.data();
      totalSales += sale.totalAmount ?? 0;

      // Sales by payment method
      const method = sale.paymentMethod ?? "UNKNOWN";
      const existing = paymentMap.get(method) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += sale.totalAmount ?? 0;
      paymentMap.set(method, existing);

      // Top products from embedded sale items
      const items: any[] = sale.items ?? [];
      for (const item of items) {
        const pid = item.productId;
        const entry = productRevenue.get(pid) || {
          productId: pid,
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += item.quantity ?? 0;
        entry.revenue += item.lineTotal ?? 0;
        productRevenue.set(pid, entry);
      }
    }

    // --- Aggregate expenses ---
    let totalExpenses = 0;
    const expensesCount = expensesSnap.size;
    const categoryMap = new Map<string, { count: number; total: number }>();

    for (const doc of expensesSnap.docs) {
      const expense = doc.data();
      totalExpenses += expense.amount ?? 0;

      const cat = expense.category ?? "UNCATEGORIZED";
      const existing = categoryMap.get(cat) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += expense.amount ?? 0;
      categoryMap.set(cat, existing);
    }

    const netProfit = totalSales - totalExpenses;

    // --- Top 10 products by revenue ---
    const sortedProducts = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Resolve product names
    const productIds = sortedProducts.map((p) => p.productId);
    const productNameMap = new Map<string, string>();
    // Firestore "in" queries support max 30 items; 10 is fine
    if (productIds.length > 0) {
      const prodSnap = await productsCol
        .where("__name__", "in", productIds)
        .get();
      for (const doc of prodSnap.docs) {
        productNameMap.set(doc.id, doc.data().name ?? "Unknown");
      }
    }

    const topProducts = sortedProducts.map((p) => ({
      name: productNameMap.get(p.productId) || "Unknown",
      quantity: p.quantity,
      revenue: p.revenue,
    }));

    // --- Sales by payment method ---
    const salesByPayment = Array.from(paymentMap.entries()).map(
      ([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
      })
    );

    // --- Expenses by category ---
    const expensesByCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
      })
    );

    // --- Inventory value ---
    const inventorySnap = await inventoryItemsCol.get();
    const inventoryIds = inventorySnap.docs.map((doc) => doc.id);

    let inventoryValue = 0;

    if (inventoryIds.length > 0) {
      // Fetch all stock movements and batches
      const [movementsSnap, batchesSnap] = await Promise.all([
        stockMovementsCol.get(),
        stockBatchesCol.get(),
      ]);

      const movements = movementsSnap.docs
        .map((doc) => doc.data())
        .filter((m) => inventoryIds.includes(m.inventoryItemId))
        .map((m) => ({
          inventoryItemId: m.inventoryItemId as string,
          type: m.type as string,
          quantity: m.quantity as number,
        }));

      const batches = batchesSnap.docs
        .map((doc) => doc.data())
        .filter((b) => inventoryIds.includes(b.inventoryItemId))
        .map((b) => ({
          inventoryItemId: b.inventoryItemId as string,
          quantity: b.quantity as number,
          unitCost: b.unitCost as number,
        }));

      const onHand = sumStockMovements(movements);
      const averageCosts = averageUnitCost(batches);

      for (const id of inventoryIds) {
        const qty = onHand.get(id) || 0;
        const cost = averageCosts.get(id) || 0;
        inventoryValue += qty * cost;
      }
    }

    return res.json({
      totalSales,
      totalExpenses,
      netProfit,
      salesCount,
      expensesCount,
      inventoryValue,
      topProducts,
      salesByPayment,
      expensesByCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /trends                                                        */
/* ------------------------------------------------------------------ */

reportsRouter.get(
  "/trends",
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    try {
      const period = ((_req.query.period as string) || "MONTH").toUpperCase();

      const now = new Date();
      let startDate: Date;
      let bucketFn: (d: Date) => string;
      let bucketKeys: string[];

      if (period === "WEEK") {
        // Last 7 days (including today)
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        bucketFn = formatDay;
        bucketKeys = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          bucketKeys.push(formatDay(d));
        }
      } else if (period === "YEAR") {
        // Last 12 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        bucketFn = formatMonth;
        bucketKeys = [];
        for (let i = 0; i < 12; i++) {
          const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          bucketKeys.push(formatMonth(d));
        }
      } else {
        // MONTH – last 30 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        bucketFn = formatDay;
        bucketKeys = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          bucketKeys.push(formatDay(d));
        }
      }

      // Query approved sales and expenses from startDate onwards
      const [salesSnap, expensesSnap] = await Promise.all([
        salesCol
          .where("status", "==", "APPROVED")
          .where("createdAt", ">=", startDate)
          .orderBy("createdAt", "desc")
          .get(),
        expensesCol
          .where("status", "==", "APPROVED")
          .where("createdAt", ">=", startDate)
          .orderBy("createdAt", "desc")
          .get(),
      ]);

      // Initialize buckets
      const salesBuckets = new Map<string, number>();
      const expensesBuckets = new Map<string, number>();
      for (const key of bucketKeys) {
        salesBuckets.set(key, 0);
        expensesBuckets.set(key, 0);
      }

      // Bucket sales
      for (const doc of salesSnap.docs) {
        const sale = doc.data();
        const date = toDate(sale.createdAt);
        const key = bucketFn(date);
        if (salesBuckets.has(key)) {
          salesBuckets.set(key, (salesBuckets.get(key) || 0) + (sale.totalAmount ?? 0));
        }
      }

      // Bucket expenses
      for (const doc of expensesSnap.docs) {
        const expense = doc.data();
        const date = toDate(expense.createdAt);
        const key = bucketFn(date);
        if (expensesBuckets.has(key)) {
          expensesBuckets.set(
            key,
            (expensesBuckets.get(key) || 0) + (expense.amount ?? 0)
          );
        }
      }

      const trends = bucketKeys.map((key) => {
        const sales = salesBuckets.get(key) || 0;
        const expenses = expensesBuckets.get(key) || 0;
        return {
          date: key,
          sales,
          expenses,
          profit: sales - expenses,
        };
      });

      return res.json(trends);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch trends" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  GET /staff-performance                                             */
/* ------------------------------------------------------------------ */

reportsRouter.get(
  "/staff-performance",
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    try {
      const period = ((_req.query.period as string) || "MONTH").toUpperCase();
      const startDate = getPeriodStart(period);

      const salesSnap = await salesCol
        .where("status", "==", "APPROVED")
        .where("createdAt", ">=", startDate)
        .orderBy("createdAt", "desc")
        .get();

      // Group by createdById
      const staffMap = new Map<
        string,
        { salesCount: number; revenue: number }
      >();
      // Track approvals by approvedById
      const approvalMap = new Map<string, number>();

      for (const doc of salesSnap.docs) {
        const sale = doc.data();
        const createdBy = sale.createdById;
        const approvedBy = sale.approvedById;

        if (createdBy) {
          const existing = staffMap.get(createdBy) || {
            salesCount: 0,
            revenue: 0,
          };
          existing.salesCount += 1;
          existing.revenue += sale.totalAmount ?? 0;
          staffMap.set(createdBy, existing);
        }

        if (approvedBy) {
          approvalMap.set(approvedBy, (approvalMap.get(approvedBy) || 0) + 1);
        }
      }

      // Resolve user details
      const allUserIds = new Set<string>([
        ...staffMap.keys(),
        ...approvalMap.keys(),
      ]);
      const userMap = new Map<
        string,
        { fullName: string; role: string }
      >();

      // Firestore "in" query limit is 30, batch if needed
      const userIdArray = Array.from(allUserIds);
      for (let i = 0; i < userIdArray.length; i += 30) {
        const batch = userIdArray.slice(i, i + 30);
        const usersSnap = await usersCol
          .where("__name__", "in", batch)
          .get();
        for (const doc of usersSnap.docs) {
          const data = doc.data();
          userMap.set(doc.id, {
            fullName: data.fullName ?? "Unknown",
            role: data.role ?? "Unknown",
          });
        }
      }

      // Build result array
      const staffPerformance = Array.from(staffMap.entries())
        .map(([userId, stats]) => {
          const user = userMap.get(userId);
          return {
            userId,
            fullName: user?.fullName ?? "Unknown",
            role: user?.role ?? "Unknown",
            salesCount: stats.salesCount,
            revenue: stats.revenue,
            avgSaleAmount:
              stats.salesCount > 0
                ? Math.round((stats.revenue / stats.salesCount) * 100) / 100
                : 0,
            approvalsCount: approvalMap.get(userId) || 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      return res.json(staffPerformance);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch staff performance" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  GET /margins                                                       */
/* ------------------------------------------------------------------ */

reportsRouter.get(
  "/margins",
  requireAuth,
  async (_req: AuthenticatedRequest, res) => {
    try {
      // Fetch all products
      const productsSnap = await productsCol.get();

      // Fetch all inventory items for average cost calculation
      const [movementsSnap, batchesSnap] = await Promise.all([
        stockMovementsCol.get(),
        stockBatchesCol.get(),
      ]);

      const movements = movementsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          inventoryItemId: d.inventoryItemId as string,
          type: d.type as string,
          quantity: d.quantity as number,
        };
      });

      const batches = batchesSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          inventoryItemId: d.inventoryItemId as string,
          quantity: d.quantity as number,
          unitCost: d.unitCost as number,
        };
      });

      const averageCosts = averageUnitCost(batches);

      // Build margins for products that have recipes
      const margins: {
        productId: string;
        productName: string;
        sellingPrice: number;
        costPrice: number;
        margin: number;
        marginPercent: number;
      }[] = [];

      for (const doc of productsSnap.docs) {
        const product = doc.data();
        const recipes: any[] = product.recipes ?? [];

        if (recipes.length === 0) continue;

        let costPrice = 0;
        for (const recipe of recipes) {
          const itemId = recipe.inventoryItemId;
          const quantityUsed = recipe.quantityUsed ?? 0;
          const avgCost = averageCosts.get(itemId) || 0;
          costPrice += quantityUsed * avgCost;
        }

        const sellingPrice = product.price ?? 0;
        const margin = sellingPrice - costPrice;
        const marginPercent =
          sellingPrice > 0
            ? Math.round((margin / sellingPrice) * 10000) / 100
            : 0;

        margins.push({
          productId: doc.id,
          productName: product.name ?? "Unknown",
          sellingPrice,
          costPrice: Math.round(costPrice * 100) / 100,
          margin: Math.round(margin * 100) / 100,
          marginPercent,
        });
      }

      // Sort by marginPercent descending
      margins.sort((a, b) => b.marginPercent - a.marginPercent);

      return res.json(margins);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch product margins" });
    }
  }
);
