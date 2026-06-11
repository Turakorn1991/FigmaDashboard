import { useState } from "react";
import { Home, ChevronDown, ChevronRight } from "lucide-react";

const LOGO = "https://test-pamf-did.mod.go.th/assets/img/ispf.png";

interface SidebarProps {
  activePage: number;
  onPageChange: (page: number) => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  const reports = [
    { id: 1, label: "รายงาน#1 ภาพรวม" },
    { id: 2, label: "รายงาน#2 รายบริษัท" },
    { id: 3, label: "รายงาน#3 ประเภทกระสุน" },
    { id: 4, label: "รายงาน#4 ปลายทาง" },
    { id: 5, label: "รายงาน#5 ใบอนุญาต" },
  ];

  const isActive = (id: number) => activePage === id;

  const itemStyle = (id: number): React.CSSProperties => ({
    fontSize: 11,
    color: isActive(id) ? "#fff" : "rgba(255,255,255,0.65)",
    background: isActive(id) ? "rgba(255,255,255,0.1)" : "transparent",
    borderLeft: isActive(id) ? "3px solid rgba(255,255,255,0.5)" : "3px solid transparent",
  });

  return (
    <div
      style={{ width: 200, minWidth: 200, background: "#1a1a2e" }}
      className="flex flex-col h-full"
    >
     
      {/* Menu */}
      <div className="flex-1 py-3">
        {/* หน้าหลัก */}
        <button
          onClick={() => onPageChange(0)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors"
          style={itemStyle(0)}
          onMouseEnter={(e) => { if (!isActive(0)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={(e) => { if (!isActive(0)) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <Home size={14} style={{ flexShrink: 0 }} />
          <span>หน้าหลัก</span>
        </button>

        {/* Section label */}
        <div
          style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}
          className="px-4 mt-3 mb-1.5"
        >
          ระบบรายงาน
        </div>

        {/* Reports parent */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
          style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, borderLeft: "3px solid transparent" }}
        >
          <span>รายงาน</span>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {expanded && (
          <div>
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => onPageChange(r.id)}
                className="w-full text-left px-4 py-2 pl-8 transition-colors"
                style={itemStyle(r.id)}
                onMouseEnter={(e) => { if (!isActive(r.id)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { if (!isActive(r.id)) (e.currentTarget as HTMLButtonElement).style.background = isActive(r.id) ? "rgba(124,58,237,0.18)" : "transparent"; }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
