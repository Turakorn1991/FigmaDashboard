import { TrendingUp, Building2, Boxes, MapPin, ClipboardList, Activity, FileText, Users } from "lucide-react";

const PRIMARY = "#6574FF";

interface KpiCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function HomeKpiCard({ icon, value, label, active = true, onClick }: KpiCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        border: `1.6px solid ${active ? PRIMARY : "#D1D5DB"}`,
        borderRadius: 16,
        padding: "12px 16px",
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        width: "100%",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(101,116,255,0.15)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
    >
      {/* Icon */}
      <div style={{ color: active ? PRIMARY : "#9CA3AF", flexShrink: 0 }}>
        {icon}
      </div>
      {/* Number + Label */}
      <div>
        <div style={{ fontSize: 40, fontWeight: 700, color: active ? PRIMARY : "#9CA3AF", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: active ? PRIMARY : "#9CA3AF", marginTop: 4 }}>
          {label}
        </div>
      </div>
    </button>
  );
}

const cards = [
  { icon: <TrendingUp size={48} />, value: 297100, label: "กระสุนรวม (นัด)", page: 1, active: true },
  { icon: <Activity size={48} />, value: 7930, label: "วัตถุระเบิด (กก.)", page: 1, active: true },
  { icon: <FileText size={48} />, value: 120, label: "ใบอนุญาตทั้งหมด", page: 5, active: true },
  { icon: <Building2 size={48} />, value: 14, label: "บริษัทที่ได้รับอนุญาต", page: 2, active: true },
  { icon: <MapPin size={48} />, value: 38, label: "หน่วยงานผู้รับ", page: 4, active: true },
  { icon: <Boxes size={48} />, value: 6, label: "ประเภทยุทธภัณฑ์", page: 3, active: true },
  { icon: <ClipboardList size={48} />, value: 25, label: "ใบอนุญาตกำลังขนย้าย", page: 5, active: true },
  { icon: <Users size={48} />, value: 0, label: "รายงานที่รออนุมัติ", page: 1, active: false },
  { icon: <TrendingUp size={48} />, value: 84, label: "รายงาน#1 ภาพรวม", page: 1, active: true },
  { icon: <Building2 size={48} />, value: 14, label: "รายงาน#2 รายบริษัท", page: 2, active: true },
  { icon: <Boxes size={48} />, value: 6, label: "รายงาน#3 ประเภทกระสุน", page: 3, active: true },
  { icon: <MapPin size={48} />, value: 4, label: "รายงาน#4 ปลายทาง", page: 4, active: true },
  { icon: <ClipboardList size={48} />, value: 5, label: "รายงาน#5 ใบอนุญาต", page: 5, active: true },
];

interface Page0HomeProps {
  onNavigate: (page: number) => void;
}

export function Page0Home({ onNavigate }: Page0HomeProps) {
  const total = cards.reduce((s, c) => s + (typeof c.value === "number" ? c.value : 0), 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>หน้าหลัก</div>

      {/* White card wrapper */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0E1119" }}>งานทั้งหมดของฉัน</div>
          <div style={{ fontSize: 13, color: PRIMARY, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            ทั้งหมด: {total.toLocaleString()} รายการ
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {cards.map((c, i) => (
            <HomeKpiCard
              key={i}
              icon={c.icon}
              value={typeof c.value === "number" ? c.value.toLocaleString() : c.value}
              label={c.label}
              active={c.active}
              onClick={() => onNavigate(c.page)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
