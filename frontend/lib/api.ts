const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type DashboardSummary = {
  totals: {
    cash: string;
    card: string;
    transfer: string;
    total: string;
  };
  pendingSalesCount: number;
  pendingExpensesCount: number;
  lowStockCount: number;
  varianceRate: string | null;
};

export type SaleListItem = {
  id: string;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  totalAmount: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  createdBy: { fullName: string };
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  reorderLevel: string | null;
  onHand: string;
};

export type ExpenseListItem = {
  id: string;
  amount: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

const fetchJson = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("API fetch failed", error);
    return null;
  }
};

export const getDashboardSummary = () =>
  fetchJson<DashboardSummary>("/dashboard/summary");

export const getPendingSales = () =>
  fetchJson<SaleListItem[]>("/sales?status=PENDING");

export const getLowStockItems = () => fetchJson<InventoryItem[]>("/inventory/low");

export const getPendingExpenses = () =>
  fetchJson<ExpenseListItem[]>("/expenses?status=PENDING");
