"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { BarChart3, TrendingUp, DollarSign, Package, Receipt, Calendar } from "lucide-react";
import { formatCurrency, apiFetch } from "@/lib/utils";

type ReportData = {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  expensesCount: number;
  inventoryValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByPayment: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    count: number;
    total: number;
  }>;
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("MONTH");
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      const reportData = await apiFetch(`/reports?period=${period}`);
      setData(reportData);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const profitMargin = data
    ? data.totalSales > 0
      ? ((data.netProfit / data.totalSales) * 100).toFixed(1)
      : 0
    : 0;

  return (
    <div className="min-h-screen bg-gradient-radial p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gradient-gold mb-2">Reports & Analytics</h1>
            <p className="text-text-secondary">Business performance insights</p>
          </div>
          <div className="flex gap-2">
            {["TODAY", "WEEK", "MONTH", "YEAR"].map((p) => (
              <Button
                key={p}
                variant={period === p ? "primary" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                <Calendar className="h-4 w-4" />
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card variant="elevated" className="bg-gradient-gold/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-gold/10 p-3">
                  <TrendingUp className="h-5 w-5 text-gold" />
                </div>
                <Badge variant="success" size="sm">
                  Revenue
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mb-1">Total Sales</p>
              <p className="text-3xl font-black currency text-gradient-gold">
                {formatCurrency(data?.totalSales || 0)}
              </p>
              <p className="text-sm text-text-secondary mt-2">
                {data?.salesCount || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-error/10 p-3">
                  <Receipt className="h-5 w-5 text-error" />
                </div>
                <Badge variant="error" size="sm">
                  Expenses
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mb-1">Total Expenses</p>
              <p className="text-3xl font-black currency">
                {formatCurrency(data?.totalExpenses || 0)}
              </p>
              <p className="text-sm text-text-secondary mt-2">
                {data?.expensesCount || 0} records
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-success/10 p-3">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <Badge variant="success" size="sm">
                  {profitMargin}% margin
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mb-1">Net Profit</p>
              <p className="text-3xl font-black currency text-success">
                {formatCurrency(data?.netProfit || 0)}
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Sales - Expenses
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-info/10 p-3">
                  <Package className="h-5 w-5 text-info" />
                </div>
                <Badge variant="info" size="sm">
                  Assets
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mb-1">Inventory Value</p>
              <p className="text-3xl font-black currency">
                {formatCurrency(data?.inventoryValue || 0)}
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Current stock value
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Top Products */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best-selling items by revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {data?.topProducts && data.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.topProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border-subtle p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-text-secondary">{product.quantity} sold</p>
                        </div>
                      </div>
                      <p className="font-black currency">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-text-secondary">
                  <BarChart3 className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No sales data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales by Payment Method */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Sales breakdown by payment type</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {data?.salesByPayment && data.salesByPayment.length > 0 ? (
                <div className="space-y-3">
                  {data.salesByPayment.map((payment, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border-subtle p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="gold">{payment.method}</Badge>
                        <span className="text-sm text-text-secondary">
                          {payment.count} transactions
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden mr-4">
                          <div
                            className="h-full bg-gradient-gold"
                            style={{
                              width: `${
                                data.totalSales > 0
                                  ? (payment.total / data.totalSales) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <p className="font-black currency">{formatCurrency(payment.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-text-secondary">
                  <DollarSign className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No payment data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Spending breakdown by category</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {data?.expensesByCategory && data.expensesByCategory.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.expensesByCategory.map((category, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border-subtle p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{category.category}</p>
                        <span className="text-sm text-text-secondary">
                          {category.count} items
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden mr-4">
                          <div
                            className="h-full bg-error"
                            style={{
                              width: `${
                                data.totalExpenses > 0
                                  ? (category.total / data.totalExpenses) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <p className="font-black currency">{formatCurrency(category.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-text-secondary">
                  <Receipt className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No expense data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
