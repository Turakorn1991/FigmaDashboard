import { Download } from "lucide-react";
import { FilterCard } from "../FilterCard";
import { KpiCard } from "../KpiCard";
import { RecipientChartCard } from "../ChartCard";
import { StatusBadge } from "../StatusBadge";

const tableData = [
  { ref: "REF-2566-001", receivedDate: "02/01/2566", recipient: "กองพลทหารราบที่ 1", type: "ทหาร", region: "ภาคกลาง", bullets: "45,000", company: "บ.ไทยอาวุธ จำกัด", contract: "CTR-2566-001", status: "อนุมัติ" },
  { ref: "REF-2566-002", receivedDate: "15/01/2566", recipient: "สถานีตำรวจนครบาล", type: "ตำรวจ", region: "ภาคกลาง", bullets: "18,000", company: "บ.ดีเฟนส์ โปร จำกัด", contract: "CTR-2566-002", status: "อนุมัติ" },
  { ref: "REF-2566-003", receivedDate: "28/01/2566", recipient: "สนามยิงปืนพระราม 9", type: "สนามยิงปืน", region: "ภาคกลาง", bullets: "5,000", company: "บ.ไทยอาวุธ จำกัด", contract: "CTR-2566-003", status: "กำลังดำเนินการ" },
  { ref: "REF-2566-004", receivedDate: "10/02/2566", recipient: "กองพลทหารม้าที่ 2", type: "ทหาร", region: "ภาคเหนือ", bullets: "32,000", company: "บ.นาธาน อินเตอร์ จำกัด", contract: "CTR-2566-004", status: "รอดำเนินการ" },
  { ref: "REF-2566-005", receivedDate: "22/02/2566", recipient: "ตำรวจภูธรจังหวัดเชียงใหม่", type: "ตำรวจ", region: "ภาคเหนือ", bullets: "12,000", company: "บ.เอเชียซัพพลาย จำกัด", contract: "CTR-2566-005", status: "ยื่นคำขอ" },
  { ref: "REF-2566-006", receivedDate: "05/03/2566", recipient: "หน่วยรักษาความปลอดภัย", type: "อื่นๆ ใน ม.7", region: "ภาคใต้", bullets: "8,000", company: "บ.เทคโนอาวุธ จำกัด", contract: "CTR-2566-006", status: "สร้างคำขอ" },
];

const typeBadgeStyle: Record<string, { bg: string; color: string }> = {
  "ทหาร": { bg: "#DBEAFE", color: "#2563EB" },
  "ตำรวจ": { bg: "#FFEDD5", color: "#EA580C" },
  "สนามยิงปืน": { bg: "#DCFCE7", color: "#16A34A" },
  "อื่นๆ ใน ม.7": { bg: "#EDE9FE", color: "#7C3AED" },
};

export function Page4Recipients() {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>ระบบรายงาน / รายงาน</div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>ปลายทางหน่วยงานผู้รับกระสุน</h1>

      </div>

      <FilterCard
        extraFilters={
          <>
            <select style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}>
              <option>ประเภทหน่วยงาน ม.7</option>
              <option>ทหาร</option>
              <option>ตำรวจ</option>
              <option>อื่นๆ</option>
              <option>สนามยิงปืน</option>
            </select>
            <select style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}>
              <option>ภูมิภาคทั้งหมด</option>
              <option>ภาคกลาง</option>
              <option>ภาคเหนือ</option>
              <option>ภาคใต้</option>
              <option>ภาคตะวันออกเฉียงเหนือ</option>
            </select>
          </>
        }
      />

      {/* KPI */}
      <div className="flex gap-3 mb-4">
        <KpiCard label="ทหาร (นัด)" value="275,000" sub="หน่วยทหารทั่วประเทศ" color="#2563EB" />
        <KpiCard label="ตำรวจ (นัด)" value="108,000" sub="สถานีตำรวจทั่วประเทศ" color="#EA580C" />
        <KpiCard label="อื่นๆ ใน ม.7" value="28,000" sub="หน่วยงานความมั่นคงอื่น" color="#7C3AED" />
        <KpiCard label="สนามยิงปืน" value="18,000" sub="สนามยิงปืนที่มีใบอนุญาต" color="#16A34A" />
      </div>

      {/* Charts */}
      <div className="flex gap-3 mb-4">
        <RecipientChartCard title="ส่งมอบตามประเภทหน่วยงาน ม.7 แยกบริษัท" which="stacked" />
        <RecipientChartCard title="สนามยิงปืน ทหาร/ตำรวจ" which="bar" />
      </div>

      {/* Table */}
      <div className="bg-white" style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>รายการส่งมอบกระสุน</div>
          <div className="flex gap-2">
            {["📥 Export ดิบ (Excel)", "📊 Export สรุป (Excel)", "📄 Export PDF"].map((l) => (
              <button key={l} style={{ height: 28, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 10px", fontSize: 10, color: "#6B7280", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead style={{ background: "#FAFAFA" }}>
              <tr>
                {["#", "เลขที่อ้างอิง", "วันที่รับเรื่อง", "หน่วยงานผู้รับ", "ประเภท ม.7", "ภูมิภาค", "กระสุน (นัด)", "บริษัทผู้ผลิต", "เลขสัญญา", "สถานะ"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => {
                const ts = typeBadgeStyle[row.type] ?? { bg: "#F3F4F6", color: "#6B7280" };
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "8px 10px", fontSize: 12, color: "#6B7280" }}>{i + 1}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.ref}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>{row.receivedDate}</td>
                    <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{row.recipient}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: ts.bg, color: ts.color, whiteSpace: "nowrap" }}>{row.type}</span>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151" }}>{row.region}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.bullets}</td>
                    <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{row.company}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.contract}</td>
                    <td style={{ padding: "8px 10px" }}><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
