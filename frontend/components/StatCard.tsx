export function StatCard({
  label,
  value,
  trend
}: {
  label: string;
  value: string;
  trend?: string | null;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-trend">{trend || "—"}</div>
    </div>
  );
}
