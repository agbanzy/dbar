"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  CreditCard,
  Calendar,
  AlertCircle,
  Users,
} from "lucide-react";
import { apiFetch, formatCurrency, getInitials, truncate, cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = "WEEK" | "MONTH" | "YEAR";

interface TrendPoint {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
}

interface MarginItem {
  productId: string;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  margin: number;
  marginPercent: number;
}

interface StaffMember {
  userId: string;
  fullName: string;
  role: string;
  salesCount: number;
  revenue: number;
  avgSaleAmount: number;
}

interface ReportSummary {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  expensesCount: number;
  inventoryValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByPayment: Array<{ method: string; count: number; total: number }>;
  expensesByCategory: Array<{ category: string; count: number; total: number }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = {
  gold: "#fbbf24",
  success: "#34d399",
  error: "#f87171",
  info: "#60a5fa",
  secondary: "#a78bfa",
  orange: "#fb923c",
  pink: "#f472b6",
  teal: "#2dd4bf",
};

const PIE_PALETTE = [
  CHART_COLORS.gold,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.secondary,
  CHART_COLORS.orange,
  CHART_COLORS.pink,
  CHART_COLORS.teal,
  CHART_COLORS.error,
];

const PAYMENT_COLORS: Record<string, string> = {
  CASH: CHART_COLORS.success,
  CARD: CHART_COLORS.info,
  TRANSFER: CHART_COLORS.gold,
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "12px",
  boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6)",
  padding: "12px 16px",
};

const PERIODS: Period[] = ["WEEK", "MONTH", "YEAR"];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Custom Recharts tooltip formatter
// ---------------------------------------------------------------------------

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={TOOLTIP_STYLE}
      className="text-sm"
    >
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary capitalize">{entry.dataKey}:</span>
          <span className="font-semibold text-text-primary">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="text-sm">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary capitalize">{entry.dataKey}:</span>
          <span className="font-semibold text-text-primary">
            {entry.dataKey === "marginPercent"
              ? `${Number(entry.value).toFixed(1)}%`
              : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMarginColor(percent: number): string {
  if (percent >= 60) return CHART_COLORS.success;
  if (percent >= 30) return CHART_COLORS.gold;
  return CHART_COLORS.error;
}

function getRankIndicator(rank: number): string {
  if (rank === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (rank === 2) return "bg-gray-400/20 text-gray-300 border-gray-400/30";
  if (rank === 3) return "bg-orange-600/20 text-orange-400 border-orange-600/30";
  return "bg-bg-tertiary text-text-secondary border-border-subtle";
}

function getRankLabel(rank: number): string | null {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return null;
}

// ---------------------------------------------------------------------------
// Component: Section Card wrapper
// ---------------------------------------------------------------------------

function ChartCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={cardVariants} className={className}>
      <div className="card-elevated rounded-2xl shadow-xl border border-border-subtle p-6 h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-gold/10 p-2.5">
            <Icon className="h-5 w-5 text-gold" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component: Empty state
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
      <BarChart3 className="h-12 w-12 opacity-20 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("MONTH");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [margins, setMargins] = useState<MarginItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, trendsRes, marginsRes, staffRes] = await Promise.all([
        apiFetch(`/reports?period=${period}`),
        apiFetch(`/reports/trends?period=${period}`),
        apiFetch("/reports/margins"),
        apiFetch(`/reports/staff-performance?period=${period}`),
      ]);

      setSummary(summaryRes);
      setTrends(Array.isArray(trendsRes) ? trendsRes : []);
      setMargins(Array.isArray(marginsRes) ? marginsRes : []);
      setStaff(Array.isArray(staffRes) ? staffRes : []);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ------- Derived data -------

  const topMargins = margins
    .sort((a, b) => b.marginPercent - a.marginPercent)
    .slice(0, 10);

  const marginChartData = topMargins.map((m) => ({
    name: truncate(m.productName, 14),
    marginPercent: Number(m.marginPercent),
    fill: getMarginColor(Number(m.marginPercent)),
  }));

  const costVsPriceData = margins.slice(0, 12).map((m) => ({
    name: truncate(m.productName, 12),
    sellingPrice: Number(m.sellingPrice),
    costPrice: Number(m.costPrice),
  }));

  const expenseData = (summary?.expensesByCategory ?? []).map((cat, i) => ({
    name: cat.category,
    value: cat.total,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const paymentData = (summary?.salesByPayment ?? []).map((p) => ({
    name: p.method,
    value: p.total,
    count: p.count,
    fill: PAYMENT_COLORS[p.method] || CHART_COLORS.secondary,
  }));

  const sortedStaff = [...staff].sort((a, b) => b.revenue - a.revenue);

  // ------- Render -------

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
        <div className="rounded-full bg-error/10 p-4">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>
        <div>
          <p className="text-lg font-semibold text-text-primary mb-1">
            Unable to load analytics
          </p>
          <p className="text-sm text-text-secondary max-w-md">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="mt-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-gold-dark active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial p-6 lg:p-8">
      <motion.div
        className="container mx-auto max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <motion.div
          variants={cardVariants}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-gradient-gold mb-1">
              Analytics
            </h1>
            <p className="text-text-secondary text-sm">
              Deep-dive into performance metrics and trends
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-bg-secondary border border-border-subtle p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                  period === p
                    ? "bg-gold text-black shadow-md"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* Section 1: Revenue & Profit Trends (full width)                  */}
        {/* ---------------------------------------------------------------- */}
        <ChartCard
          title="Revenue & Profit Trends"
          icon={TrendingUp}
          className="mb-6"
        >
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={trends}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.gold} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  dx={-8}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke={CHART_COLORS.gold}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#1a1a1a" }}
                  name="Sales"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke={CHART_COLORS.error}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#1a1a1a" }}
                  strokeDasharray="6 3"
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#1a1a1a" }}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No trend data available for this period" />
          )}
        </ChartCard>

        {/* ---------------------------------------------------------------- */}
        {/* Section 2 & 3: Margins + Staff Leaderboard (two columns)         */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Section 2: Profit Margins */}
          <ChartCard title="Product Profit Margins" icon={BarChart3}>
            {marginChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={marginChartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#666"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    dy={4}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<PercentTooltip />} />
                  <Bar
                    dataKey="marginPercent"
                    radius={[6, 6, 0, 0]}
                    name="Margin %"
                    maxBarSize={36}
                  >
                    {marginChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No margin data available" />
            )}
          </ChartCard>

          {/* Section 3: Staff Performance Leaderboard */}
          <ChartCard title="Staff Leaderboard" icon={Trophy}>
            {sortedStaff.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {sortedStaff.map((member, idx) => {
                  const rank = idx + 1;
                  const rankLabel = getRankLabel(rank);
                  return (
                    <motion.div
                      key={member.userId}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-3 rounded-xl border border-border-subtle p-3 hover:bg-bg-tertiary/50 transition-colors"
                    >
                      {/* Rank */}
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                          getRankIndicator(rank)
                        )}
                      >
                        {rankLabel ?? `#${rank}`}
                      </div>

                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                          {getInitials(member.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-text-primary">
                            {member.fullName}
                          </p>
                          <span className="inline-block mt-0.5 rounded-md bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold currency text-text-primary">
                          {formatCurrency(member.revenue)}
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          {member.salesCount} sale{member.salesCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No staff performance data available" />
            )}
          </ChartCard>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Section 4: Cost vs Selling Price (full width)                     */}
        {/* ---------------------------------------------------------------- */}
        <ChartCard
          title="Selling Price vs Cost Price"
          icon={BarChart3}
          className="mb-6"
        >
          {costVsPriceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={costVsPriceData}
                margin={{ top: 5, right: 20, left: 10, bottom: 30 }}
                barCategoryGap="25%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#666"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  dy={4}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  dx={-8}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
                />
                <Bar
                  dataKey="sellingPrice"
                  fill={CHART_COLORS.gold}
                  radius={[6, 6, 0, 0]}
                  name="Selling Price"
                  maxBarSize={28}
                  fillOpacity={0.9}
                />
                <Bar
                  dataKey="costPrice"
                  fill={CHART_COLORS.info}
                  radius={[6, 6, 0, 0]}
                  name="Cost Price"
                  maxBarSize={28}
                  fillOpacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No product pricing data available" />
          )}
        </ChartCard>

        {/* ---------------------------------------------------------------- */}
        {/* Section 5 & 6: Expense Breakdown + Payment Methods (two columns) */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Section 5: Expense Breakdown */}
          <ChartCard title="Expense Breakdown" icon={PieChartIcon}>
            {expenseData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {expenseData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: "#a3a3a3", marginBottom: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {expenseData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2"
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-secondary truncate">
                          {entry.name}
                        </p>
                        <p className="text-sm font-semibold currency">
                          {formatCurrency(entry.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState message="No expense data available" />
            )}
          </ChartCard>

          {/* Section 6: Payment Methods */}
          <ChartCard title="Payment Methods" icon={CreditCard}>
            {paymentData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {paymentData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: "#a3a3a3", marginBottom: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Payment legend cards */}
                <div className="space-y-2 mt-2">
                  {paymentData.map((entry) => {
                    const total = paymentData.reduce((s, e) => s + e.value, 0);
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                    return (
                      <div
                        key={entry.name}
                        className="flex items-center gap-3 rounded-xl border border-border-subtle p-3"
                      >
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-medium text-text-primary">
                              {entry.name}
                            </p>
                            <span className="text-xs text-text-tertiary">
                              {entry.count} txn{entry.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: entry.fill,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-text-secondary w-12 text-right">
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-bold currency shrink-0">
                          {formatCurrency(entry.value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState message="No payment data available" />
            )}
          </ChartCard>
        </div>
      </motion.div>
    </div>
  );
}
