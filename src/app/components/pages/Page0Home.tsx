import { FileText, Building2, Boxes, MapPin, ClipboardList, TrendingUp, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

const LOGO = "https://test-pamf-did.mod.go.th/assets/img/ispf.png";

interface PageCardProps {
  page: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  onNavigate: (page: number) => void;
}

function PageCard({ page, icon, title, subtitle, color, bg, onNavigate }: PageCardProps) {
  return (
    <button
      onClick={() => onNavigate(page)}
      className="bg-white text-left w-full transition-all"
      style={{ borderRadius: 12, border: "1px solid #E5E7EB", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
    >
      <div className="flex items-start gap-4">
        <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>{subtitle}</div>
        </div>
      </div>
      <div className="flex items-center justify-end mt-3" style={{ fontSize: 11, color, fontWeight: 600 }}>
        เปิดรายงาน →
      </div>
    </button>
  );
}

const summaryStats = [
  { label: "กระสุนรวม (นัด)", value: "297,100", icon: <Boxes size={18} />, color: "#7C3AED", bg: "#EDE9FE" },
  { label: "ใบอนุญาตทั้งหมด", value: "120", icon: <FileText size={18} />, color: "#2563EB", bg: "#DBEAFE" },
  { label: "บริษัทที่ได้รับอนุญาต", value: "14", icon: <Building2 size={18} />, color: "#16A34A", bg: "#DCFCE7" },
  { label: "หน่วยงานผู้รับ", value: "38", icon: <MapPin size={18} />, color: "#EA580C", bg: "#FFEDD5" },
];

const recentActivity = [
  { ref: "REF-2566-042", type: "ออกใบอนุญาต", company: "บ.ไทยอาวุธ จำกัด", date: "10/06/2566", status: "อนุมัติ", icon: <CheckCircle2 size={14} />, iconColor: "#16A34A" },
  { ref: "REF-2566-041", type: "ยื่นคำขอ", company: "บ.ดีเฟนส์ โปร จำกัด", date: "09/06/2566", status: "รอดำเนินการ", icon: <Clock size={14} />, iconColor: "#2563EB" },
  { ref: "REF-2566-040", type: "ขนย้ายกระสุน", company: "บ.นาธาน อินเตอร์ จำกัด", date: "08/06/2566", status: "กำลังดำเนินการ", icon: <TrendingUp size={14} />, iconColor: "#CA8A04" },
  { ref: "REF-2566-039", type: "ออกใบอนุญาต", company: "บ.เอเชียซัพพลาย จำกัด", date: "07/06/2566", status: "อนุมัติ", icon: <CheckCircle2 size={14} />, iconColor: "#16A34A" },
  { ref: "REF-2566-038", type: "ยื่นคำขอ", company: "บ.เทคโนอาวุธ จำกัด", date: "06/06/2566", status: "ใกล้หมดอายุ", icon: <AlertCircle size={14} />, iconColor: "#DC2626" },
  { ref: "REF-2566-037", type: "ขนย้ายระเบิด", company: "บ.ไทยอาวุธ จำกัด", date: "05/06/2566", status: "ยกเลิก", icon: <XCircle size={14} />, iconColor: "#DC2626" },
];

const statusBadge: Record<string, { bg: string; color: string }> = {
  "อนุมัติ": { bg: "#DCFCE7", color: "#16A34A" },
  "รอดำเนินการ": { bg: "#DBEAFE", color: "#2563EB" },
  "กำลังดำเนินการ": { bg: "#FEF9C3", color: "#CA8A04" },
  "ใกล้หมดอายุ": { bg: "#FEE2E2", color: "#DC2626" },
  "ยกเลิก": { bg: "#FEE2E2", color: "#DC2626" },
};

interface Page0HomeProps {
  onNavigate: (page: number) => void;
}

export function Page0Home({ onNavigate }: Page0HomeProps) {
  return (
    <div>
      {/* Hero Banner */}
      <div
        className="flex items-center gap-5 mb-6"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)", borderRadius: 14, padding: "24px 28px", boxShadow: "0 4px 20px rgba(124,58,237,0.18)" }}
      >
        <img
          src={LOGO}
          alt="ISPF Logo"
          style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
        />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 4 }}>
            ระบบจัดการข้อมูลโรงงานผลิตอาวุธของเอกชน สำหรับเจ้าหน้าที่
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
            Private Arms Manufacturing Factory System · Version 1.0.0
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, background: "rgba(124,58,237,0.5)", color: "#c4b5fd", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              ผู้ใช้งาน: Administrator
            </span>
            <span style={{ fontSize: 10, background: "rgba(22,163,74,0.3)", color: "#86efac", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              ● ออนไลน์
            </span>
          </div>
        </div>
        <div className="ml-auto text-right hidden md:block">
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>วันที่ปัจจุบัน</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>11 มิถุนายน 2566</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>ปีงบประมาณ 2566</div>
        </div>
      </div>

      {/* Summary KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {summaryStats.map((s) => (
          <div key={s.label} className="bg-white" style={{ borderRadius: 10, border: "1px solid #E5E7EB", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>ปีงบประมาณ 2566</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Report navigation cards */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>เมนูรายงาน</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <PageCard page={1} icon={<TrendingUp size={20} />} title="ภาพรวมการขนย้าย" subtitle="สถิติรวมกระสุนและวัตถุระเบิด รายเดือน" color="#7C3AED" bg="#EDE9FE" onNavigate={onNavigate} />
            <PageCard page={2} icon={<Building2 size={20} />} title="ข้อมูลรายบริษัท" subtitle="แยกข้อมูลตามบริษัทผู้ผลิต" color="#2563EB" bg="#DBEAFE" onNavigate={onNavigate} />
            <PageCard page={3} icon={<Boxes size={20} />} title="ประเภทกระสุน/ระเบิด" subtitle="แยกตามขนาดและประเภทยุทธภัณฑ์" color="#16A34A" bg="#DCFCE7" onNavigate={onNavigate} />
            <PageCard page={4} icon={<MapPin size={20} />} title="ปลายทางผู้รับกระสุน" subtitle="หน่วยงาน ม.7 และภูมิภาค" color="#EA580C" bg="#FFEDD5" onNavigate={onNavigate} />
          </div>
          <div style={{ marginTop: 10 }}>
            <PageCard page={5} icon={<ClipboardList size={20} />} title="ติดตามใบอนุญาต" subtitle="สถานะและวันหมดอายุของใบอนุญาตขนย้ายยุทธภัณฑ์" color="#DC2626" bg="#FEE2E2" onNavigate={onNavigate} />
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>กิจกรรมล่าสุด</div>
          <div className="bg-white" style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {recentActivity.map((a, i) => {
              const s = statusBadge[a.status] ?? { bg: "#F3F4F6", color: "#6B7280" };
              return (
                <div
                  key={a.ref}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < recentActivity.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <div style={{ color: a.iconColor, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{a.type}</span>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#6B7280" }}>{a.ref}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.company}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: 20, fontSize: 9, fontWeight: 600, background: s.bg, color: s.color }}>
                        {a.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{a.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
