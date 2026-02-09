import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { logAudit } from "../lib/audit";
import { expensesCol, usersCol } from "../lib/firestore";
import { validate, createExpenseSchema } from "../lib/validation";

export const expensesRouter = Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/** Map a Firestore expense document into the API response shape. */
const mapExpenseDoc = async (
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
    amount: Number(data.amount),
    createdBy,
    approvedBy,
  };
};

/* ------------------------------------------------------------------ */
/*  GET /  – list expenses                                             */
/* ------------------------------------------------------------------ */

expensesRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string | undefined;

    let query: FirebaseFirestore.Query = expensesCol.orderBy(
      "createdAt",
      "desc"
    );

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      query = expensesCol
        .where("status", "==", status)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    const expenses = await Promise.all(
      snapshot.docs.map((doc) => mapExpenseDoc(doc.id, doc.data()))
    );

    return res.json(expenses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /:id  – single expense                                         */
/* ------------------------------------------------------------------ */

expensesRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await expensesCol.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const expense = await mapExpenseDoc(doc.id, doc.data()!);
    return res.json(expense);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch expense" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /  – create expense                                           */
/* ------------------------------------------------------------------ */

expensesRouter.post(
  "/",
  requireAuth,
  requireRole(["Accountant", "Owner", "System Admin"]),
  validate(createExpenseSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, category, description, receiptUrl, receiptImageUrl } =
        req.body as {
          amount?: number;
          category?: string;
          description?: string;
          receiptUrl?: string;
          receiptImageUrl?: string;
        };

      const createdById = req.user?.userId;
      if (!createdById) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!amount || !category) {
        return res.status(400).json({ error: "Missing amount or category" });
      }

      const expenseData = {
        amount: Number(amount),
        category,
        description: description ?? null,
        receiptUrl: receiptUrl ?? null,
        receiptImageUrl: receiptImageUrl ?? null,
        status: "PENDING",
        createdById,
        createdAt: new Date(),
      };

      const docRef = await expensesCol.add(expenseData);

      await logAudit({
        actorId: createdById,
        action: "EXPENSE_CREATED",
        entityType: "Expense",
        entityId: docRef.id,
      });

      return res.status(201).json({ id: docRef.id, ...expenseData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create expense" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Approve handler                                                    */
/* ------------------------------------------------------------------ */

const expenseApproveHandler = async (
  req: AuthenticatedRequest,
  res: any
) => {
  try {
    const expenseId = req.params.id;
    const approvedById = req.user?.userId;

    if (!approvedById) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const snap = await expensesCol.doc(expenseId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const existing = snap.data()!;
    if (existing.status !== "PENDING") {
      return res.status(400).json({ error: "Expense already processed" });
    }

    const now = new Date();
    await expensesCol.doc(expenseId).update({
      status: "APPROVED",
      approvedById,
      approvedAt: now,
    });

    await logAudit({
      actorId: approvedById,
      action: "EXPENSE_APPROVED",
      entityType: "Expense",
      entityId: expenseId,
    });

    return res.json({
      id: expenseId,
      ...existing,
      status: "APPROVED",
      approvedById,
      approvedAt: now,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to approve expense" });
  }
};

/* ------------------------------------------------------------------ */
/*  Reject handler                                                     */
/* ------------------------------------------------------------------ */

const expenseRejectHandler = async (
  req: AuthenticatedRequest,
  res: any
) => {
  try {
    const expenseId = req.params.id;
    const approvedById = req.user?.userId;

    if (!approvedById) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const snap = await expensesCol.doc(expenseId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const existing = snap.data()!;
    if (existing.status !== "PENDING") {
      return res.status(400).json({ error: "Expense already processed" });
    }

    const now = new Date();
    await expensesCol.doc(expenseId).update({
      status: "REJECTED",
      approvedById,
      approvedAt: now,
    });

    await logAudit({
      actorId: approvedById,
      action: "EXPENSE_REJECTED",
      entityType: "Expense",
      entityId: expenseId,
      metadata: { reason: req.body?.reason },
    });

    return res.json({
      id: expenseId,
      ...existing,
      status: "REJECTED",
      approvedById,
      approvedAt: now,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reject expense" });
  }
};

/* ------------------------------------------------------------------ */
/*  Route registration (POST + PATCH for both actions)                 */
/* ------------------------------------------------------------------ */

const expenseApproveMiddleware = [
  requireAuth,
  requireRole(["Supervisor", "Accountant", "Owner", "System Admin"]),
];

expensesRouter.post(
  "/:id/approve",
  ...expenseApproveMiddleware,
  expenseApproveHandler
);
expensesRouter.patch(
  "/:id/approve",
  ...expenseApproveMiddleware,
  expenseApproveHandler
);
expensesRouter.post(
  "/:id/reject",
  ...expenseApproveMiddleware,
  expenseRejectHandler
);
expensesRouter.patch(
  "/:id/reject",
  ...expenseApproveMiddleware,
  expenseRejectHandler
);
