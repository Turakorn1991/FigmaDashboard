interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  color?: string;
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, sub, color = "#6574FF", icon }: KpiCardProps) {
  return (
    <div className="bg-white flex-1" style={{ borderRadius: 8, border: `1px solid ${color}`, padding: "14px 16px" }}>
      <div className="flex items-center justify-between mb-2">
        <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </div>
        {icon && (
          <div style={{ width: 30, height: 30, borderRadius: 6, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</div>
    </div>
  );
}
