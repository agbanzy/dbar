"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { BarChart3, Package, Receipt, TrendingUp, Users, Sparkles } from "lucide-react";
import { formatCurrency, apiFetch } from "@/lib/utils";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchData = async () => {
      try {
        const [summary, sales, stock] = await Promise.all([
          apiFetch("/dashboard/summary"),
          apiFetch("/sales?status=PENDING"),
          apiFetch("/inventory/low"),
        ]);

        setData({ summary, sales, stock });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const todaySales = data.summary?.totals?.total
    ? formatCurrency(Number(data.summary.totals.total))
    : "₦0";

  const paymentBreakdown = {
    cash: data.summary?.totals?.cash ? Number(data.summary.totals.cash) : 0,
    card: data.summary?.totals?.card ? Number(data.summary.totals.card) : 0,
    transfer: data.summary?.totals?.transfer ? Number(data.summary.totals.transfer) : 0,
  };

  const stats = [
    {
      label: "Today's Sales",
      value: todaySales,
      icon: TrendingUp,
    },
    {
      label: "Pending Approvals",
      value: data.sales?.length || 0,
      icon: Receipt,
      badge: data.sales?.length ? "warning" : null,
    },
    {
      label: "Low Stock Items",
      value: data.summary?.lowStockCount || data.stock?.length || 0,
      icon: Package,
      badge: (data.summary?.lowStockCount || data.stock?.length) ? "error" : null,
    },
    {
      label: "Pending Expenses",
      value: data.summary?.pendingExpensesCount || 0,
      icon: Users,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gradient-gold mb-2">
          {getGreeting()}, {user?.fullName?.split(" ")[0]}
        </h2>
        <p className="text-text-secondary">
          Here&apos;s what&apos;s happening with your bar today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} variant="elevated" className="hover-glow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-2">{stat.label}</p>
                    <p className="text-2xl font-black currency">{stat.value}</p>
                  </div>
                  <div className="rounded-lg bg-gold/10 p-3">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                </div>
                {stat.badge && (
                  <Badge
                    variant={stat.badge === "warning" ? "warning" : "error"}
                    className="mt-3"
                  >
                    {stat.badge === "warning" ? "Review needed" : "Action required"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Method Breakdown */}
      <Card variant="elevated" className="mb-8">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Today&apos;s Payment Breakdown</CardTitle>
          <CardDescription>Revenue by payment method</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Cash */}
            <div className="rounded-lg border border-border-subtle p-4 hover-lift transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">💵 Cash</span>
                <Badge variant="success" size="sm">
                  {paymentBreakdown.cash > 0
                    ? Math.round((paymentBreakdown.cash / (paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.transfer || 1)) * 100)
                    : 0}%
                </Badge>
              </div>
              <p className="text-2xl font-black currency">{formatCurrency(paymentBreakdown.cash)}</p>
            </div>

            {/* Card */}
            <div className="rounded-lg border border-border-subtle p-4 hover-lift transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">💳 Card</span>
                <Badge variant="info" size="sm">
                  {paymentBreakdown.card > 0
                    ? Math.round((paymentBreakdown.card / (paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.transfer || 1)) * 100)
                    : 0}%
                </Badge>
              </div>
              <p className="text-2xl font-black currency">{formatCurrency(paymentBreakdown.card)}</p>
            </div>

            {/* Transfer */}
            <div className="rounded-lg border border-border-subtle p-4 hover-lift transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">🏦 Transfer</span>
                <Badge variant="gold" size="sm">
                  {paymentBreakdown.transfer > 0
                    ? Math.round((paymentBreakdown.transfer / (paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.transfer || 1)) * 100)
                    : 0}%
                </Badge>
              </div>
              <p className="text-2xl font-black currency">{formatCurrency(paymentBreakdown.transfer)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Pending Sales */}
        <Card variant="elevated">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Sales</CardTitle>
                <CardDescription>Awaiting supervisor approval</CardDescription>
              </div>
              <Badge variant="warning">{data.sales?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {data.sales && data.sales.length > 0 ? (
              <div className="space-y-3">
                {data.sales.slice(0, 3).map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle p-4 hover-lift cursor-pointer"
                    onClick={() => router.push(`/sales/${sale.id}`)}
                  >
                    <div>
                      <p className="font-semibold">{sale.createdBy?.fullName}</p>
                      <p className="text-sm text-text-secondary">{sale.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black currency">
                        {formatCurrency(Number(sale.totalAmount))}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-1">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
                {data.sales.length > 3 && (
                  <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    onClick={() => router.push("/sales")}
                  >
                    View all {data.sales.length} pending sales
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary">
                <Receipt className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No pending sales</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card variant="elevated">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Items running low</CardDescription>
              </div>
              <Badge variant="error">{data.stock?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {data.stock && data.stock.length > 0 ? (
              <div className="space-y-3">
                {data.stock.slice(0, 3).map((item: any) => {
                  const onHand = Number(item.onHand || 0);
                  const reorderLevel = Number(item.reorderLevel || 0);
                  const urgency = onHand === 0 ? "critical" : onHand < reorderLevel * 0.5 ? "high" : "medium";
                  
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border-subtle p-4 hover-lift cursor-pointer"
                      onClick={() => router.push("/inventory")}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-text-secondary">
                          {onHand.toFixed(1)} {item.unit} remaining • Reorder at {reorderLevel.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge 
                          variant={urgency === "critical" ? "error" : urgency === "high" ? "warning" : "info"} 
                          size="md"
                        >
                          {urgency === "critical" ? "🚨 Out" : urgency === "high" ? "⚠️ Low" : "📊 Check"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {data.stock.length > 3 && (
                  <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    onClick={() => router.push("/inventory")}
                  >
                    View all {data.stock.length} low stock items
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary">
                <Package className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>All stock levels healthy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="glass" className="p-6">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => router.push("/sales/create")}>
            <Sparkles className="h-4 w-4" />
            Create Sale
          </Button>
          <Button variant="secondary" onClick={() => router.push("/inventory/stock-in")}>
            <Package className="h-4 w-4" />
            Stock In
          </Button>
          <Button variant="secondary" onClick={() => router.push("/expenses/create")}>
            <Receipt className="h-4 w-4" />
            Add Expense
          </Button>
          <Button variant="ghost" onClick={() => router.push("/reports")}>
            <BarChart3 className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </Card>
    </div>
  );
}
