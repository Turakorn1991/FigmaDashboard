import { Bell, ChevronDown } from "lucide-react";

const LOGO = "https://test-pamf-did.mod.go.th/assets/img/ispf.png";

export function Navbar() {
  return (
    <div
      style={{ background: "#1a1a2e", height: 52, minHeight: 52 }}
      className="flex items-center justify-between px-5 border-b border-white/10"
    >
      <div className="flex items-center gap-3">
        <img
          src={LOGO}
          alt="ISPF Logo"
          style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
            ระบบจัดการข้อมูลโรงงานผลิตอาวุธของเอกชน สำหรับเจ้าหน้าที่
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
            Private Arms Manufacturing Factory system
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell size={18} color="rgba(255,255,255,0.7)" />
          <span
            className="absolute -top-1.5 -right-2 flex items-center justify-center rounded-full bg-red-500 text-white"
            style={{ fontSize: 8, fontWeight: 700, minWidth: 16, height: 16, padding: "0 3px" }}
          >
            99+
          </span>
        </div>
        <button className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
          Administrator <ChevronDown size={13} />
        </button>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Version 1.0.0</span>
      </div>
    </div>
  );
}
