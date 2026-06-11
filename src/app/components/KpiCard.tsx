interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export function KpiCard({ label, value, sub, color }: KpiCardProps) {
  return (
    <div
      className="bg-white flex-1"
      style={{ borderRadius: 10, border: "1px solid #E5E7EB", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF" }}>{sub}</div>
    </div>
  );
}
