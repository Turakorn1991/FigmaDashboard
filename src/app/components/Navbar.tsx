import { Bell, ChevronDown } from "lucide-react";

const LOGO = "https://test-pamf-did.mod.go.th/assets/img/ispf.png";

export function Navbar() {
  return (
    <div
      style={{ background: "#343D55", height: 64, minHeight: 64, padding: "0 36px" }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <img
          src={LOGO}
          alt="ISPF Logo"
          style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            ระบบจัดการข้อมูลโรงงานผลิตอาวุธของเอกชน สำหรับเจ้าหน้าที่
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, color: "#8EFFFF" }}>
            Private Arms Manufacturing Factory system สำหรับเจ้าหน้าที่
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* User info */}
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
              Administrator
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>
              Version 1.0.0
            </div>
          </div>
          <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
        </button>
        {/* Bell */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={20} color="rgba(255,255,255,0.8)" />
          <span style={{
            position: "absolute", top: -6, right: -8,
            background: "#EF4444", color: "#fff",
            fontSize: 9, fontWeight: 700,
            minWidth: 18, height: 18,
            borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #343D55",
          }}>
            99+
          </span>
        </div>
      </div>
    </div>
  );
}
