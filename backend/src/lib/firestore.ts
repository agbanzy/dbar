import { adminDb } from "./firebase-admin";

export const db = adminDb;

// Collection references
export const usersCol = db.collection("users");
export const rolesCol = db.collection("roles");
export const productsCol = db.collection("products");
export const inventoryItemsCol = db.collection("inventoryItems");
export const stockBatchesCol = db.collection("stockBatches");
export const stockMovementsCol = db.collection("stockMovements");
export const salesCol = db.collection("sales");
export const expensesCol = db.collection("expenses");
export const auditLogsCol = db.collection("auditLogs");
export const stockCountsCol = db.collection("stockCounts");
export const passcodeResetsCol = db.collection("passcodeResets");
