import { useState } from "react";
import { ChevronDown, ChevronRight, BarChart2, FileText, Building2 } from "lucide-react";

function HomeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height={size} width={size} xmlns="http://www.w3.org/2000/svg">
      <path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z" />
    </svg>
  );
}

const LOGO = "https://test-pamf-did.mod.go.th/assets/img/ispf.png";
const MENU_COLOR = "#B9BBC0";
const ACTIVE_BG = "#343D55";
const SIDEBAR_BG = "#2C2C3E";

interface SidebarProps {
  activePage: number;
  onPageChange: (page: number) => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(false);

  const reports = [
    { id: 1, label: "รายงานยอดอนุญาตให้ขาย/ขนย้ายอาวุธ" },
    { id: 2, label: "รายงาน#2 รายบริษัท" },
    { id: 3, label: "รายงาน#3 ประเภทกระสุน" },
    { id: 4, label: "รายงาน#4 ปลายทาง" },
    { id: 5, label: "รายงาน#5 ใบอนุญาต" },
  ];

  const isActive = (id: number) => activePage === id;

  const itemStyle = (id: number): React.CSSProperties => ({
    fontSize: 14,
    color: MENU_COLOR,
    background: isActive(id) ? ACTIVE_BG : "transparent",
    padding: "12px 20px",
    height: 45,
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    textAlign: "left",
    border: "none",
    cursor: "pointer",
  });

  return (
    <div style={{ width: 260, minWidth: 260, background: SIDEBAR_BG }} className="flex flex-col h-full">
      {/* Menu */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* หน้าหลัก — always highlighted, ≡ on right */}
        <button
          onClick={() => onPageChange(0)}
          style={{ fontSize: 16, fontWeight: 500, color: "#fff", background: isActive(0) ? ACTIVE_BG : "transparent", padding: "0 20px", height: 52, marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", cursor: "pointer" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HomeIcon size={18} />
            หน้าหลัก
          </span>
          <span style={{ fontSize: 18, color: MENU_COLOR, lineHeight: 1 }}>≡</span>
        </button>

        {/* Section: ระบบคำขอ */}
        <div style={{ fontSize: 12, color: "#fff", padding: "10px 20px", marginTop: 4 }}>
          ระบบคำขอ
        </div>

        {/* คำขออนุญาต accordion */}
        <button
          onClick={() => setExpandedRequest(!expandedRequest)}
          style={{ ...itemStyle(-2), background: "transparent", justifyContent: "space-between" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><FileText size={16} />คำขออนุญาต</span>
          {expandedRequest ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {expandedRequest && [
          "คำขออนุญาตผลิตเฉพาะส่วนประกอบของอาวุธเป็นการเฉพาะคราว แบบ อ.6",
          "คำขออนุญาตสั่งหรือนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ แบบ อ.4",
          "คำขออนุญาตขนย้ายวัตถุหรืออาวุธที่ใช้ในการผลิตอาวุธหรืออาวุธที่ผลิตขึ้นฯ แบบ อ.9",
          "คำขออนุญาตขายหรือจำหน่ายอาวุธฯ นอกราชอาณาจักร แบบ อ.14",
          "คำขออนุญาตขายหรือจำหน่ายอาวุธฯ ในราชอาณาจักร แบบ อ.15",
        ].map((label) => (
          <button
            key={label}
            style={{ ...itemStyle(-3), paddingLeft: 36, fontSize: 12, height: "auto", minHeight: 40, whiteSpace: "normal", lineHeight: 1.4, paddingTop: 8, paddingBottom: 8 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            {label}
          </button>
        ))}

        {/* Section: ระบบ */}
        <div style={{ fontSize: 12, color: "#fff", padding: "10px 20px", marginTop: 4 }}>
          ระบบ
        </div>

        {/* ข้อมูลผู้ประกอบการ รง.4 */}
        <button
          style={{ ...itemStyle(-4), background: "transparent", justifyContent: "flex-start" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Building2 size={16} />ข้อมูลผู้ประกอบการ รง.4</span>
        </button>

        {/* Section: ระบบรายงาน (ล่างสุด) */}
        <div style={{ fontSize: 12, color: "#fff", padding: "10px 20px", marginTop: 4 }}>
          ระบบรายงาน
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{ ...itemStyle(-1), background: "transparent", justifyContent: "space-between" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><BarChart2 size={16} />รายงาน</span>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {expanded && reports.map((r) => (
          <button
            key={r.id}
            onClick={() => onPageChange(r.id)}
            style={{ ...itemStyle(r.id), paddingLeft: 36, fontSize: 13 }}
            onMouseEnter={(e) => { if (!isActive(r.id)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { if (!isActive(r.id)) (e.currentTarget as HTMLButtonElement).style.background = isActive(r.id) ? ACTIVE_BG : "transparent"; }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
