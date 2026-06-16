import { useState } from "react";
import { Eye, FileText, X } from "lucide-react";

const PRIMARY = "#6574FF";
const FF = "'Noto Sans Thai', Inter, sans-serif";

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "รอดำเนินการ",  bg: "#EFF6FF", color: "#2563EB" },
  approved:  { label: "อนุมัติ",      bg: "#ECFDF5", color: "#059669" },
  rejected:  { label: "ไม่อนุมัติ",   bg: "#FEF2F2", color: "#DC2626" },
  reviewing: { label: "กำลังตรวจสอบ", bg: "#FFFBEB", color: "#D97706" },
};

interface RequestRow { id: number; refNo: string; company: string; taxId: string; submitDate: string; status: string; details: string; }

const MOCK: RequestRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  refNo: `อ.6-2568-${String(i + 1).padStart(4, "0")}`,
  company: ["บริษัท ดีเฟนส์ อินดัสทรี จำกัด", "ห้างหุ้นส่วนจำกัด ไทยอาวุธยุทธภัณฑ์", "บริษัท มิลิทารี่ เทคโนโลยี จำกัด", "บริษัท ป้องกันชาติ จำกัด (มหาชน)"][i % 4],
  taxId: ["0105556123456", "0105548234567", "0105560345678", "0107558567890"][i % 4],
  submitDate: `${10 + i} มิ.ย. 2568`,
  status: ["pending", "reviewing", "approved", "rejected"][i % 4],
  details: "คำขออนุญาตผลิตเฉพาะส่วนประกอบของอาวุธปืน ประเภทกลไกลั่นไก จำนวน 500 ชิ้น เพื่อการส่งออก",
}));

export function PageRequestA6() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<RequestRow | null>(null);
  const filtered = MOCK.filter((r) => (statusFilter === "all" || r.status === statusFilter) && (r.refNo.includes(search) || r.company.includes(search) || r.taxId.includes(search)));

  return (
    <div style={{ fontFamily: FF }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>คำขออนุญาต แบบ อ.6</div>
        <div style={{ fontSize: 13, color: "#8B8E95", marginTop: 4 }}>คำขออนุญาตผลิตเฉพาะส่วนประกอบของอาวุธเป็นการเฉพาะคราว</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#8B8E95", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>ค้นหา</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเลขที่อ้างอิง, ชื่อบริษัท..."
              style={{ width: "100%", height: 40, padding: "0 12px 0 36px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
            <svg style={{ position: "absolute", left: 11, top: 33, color: "#9CA3AF" }} width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <div style={{ minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#8B8E95", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>สถานะ</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: 40, padding: "0 12px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", background: "#fff", width: "100%" }}>
              <option value="all">ทั้งหมด</option><option value="pending">รอดำเนินการ</option><option value="reviewing">กำลังตรวจสอบ</option><option value="approved">อนุมัติ</option><option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
            style={{ height: 40, padding: "0 16px", fontSize: 13, border: "1px solid #D1D5DB", borderRadius: 8, background: "#F9FAFB", color: "#6B7280", cursor: "pointer" }}>ล้างตัวกรอง</button>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการคำขออนุญาต แบบ อ.6</span>
          <span style={{ fontSize: 12, color: "#8B8E95" }}>ทั้งหมด {filtered.length} รายการ</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #F0F0F0" }}>{["#", "เลขที่อ้างอิง", "ผู้ประกอบการ", "เลขภาษี", "วันที่ยื่น", "สถานะ", ""].map((h) => (<th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.88)", background: "#fff" }}>{h}</th>))}</tr></thead>
          <tbody>
            {filtered.map((r, i) => { const s = STATUS_MAP[r.status]; return (
              <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }} onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280", width: 48 }}>{i + 1}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: PRIMARY, fontWeight: 600 }}>{r.refNo}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#0E1119" }}>{r.company}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#0E1119", fontFamily: "monospace" }}>{r.taxId}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>{r.submitDate}</td>
                <td style={{ padding: "12px 14px" }}><span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span></td>
                <td style={{ padding: "12px 14px" }}>
                  <button onClick={() => setDetail(r)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#C7D2FE"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB"; }}>
                    <Eye size={14} color={PRIMARY} />
                  </button>
                </td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 620, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={20} color={PRIMARY} /></div>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: "#0E1119" }}>รายละเอียดคำขออนุญาต แบบ อ.6</div><div style={{ fontSize: 12, color: "#8B8E95" }}>คำขออนุญาตผลิตเฉพาะส่วนประกอบของอาวุธเป็นการเฉพาะคราว</div></div>
              <button onClick={() => setDetail(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color="#6B7280" /></button>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {[["เลขที่อ้างอิง", detail.refNo], ["สถานะ", STATUS_MAP[detail.status].label], ["ผู้ประกอบการ", detail.company, "span 2"], ["เลขประจำตัวผู้เสียภาษี", detail.taxId], ["วันที่ยื่นคำขอ", detail.submitDate], ["รายละเอียดคำขอ", detail.details, "span 2"]].map(([label, value, span]) => (
                <div key={label as string} style={{ gridColumn: span as string }}><div style={{ fontSize: 11, fontWeight: 600, color: "#8B8E95", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div><div style={{ fontSize: 14, color: "#0E1119" }}>{value}</div></div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setDetail(null)} style={{ padding: "0 20px", height: 38, background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
