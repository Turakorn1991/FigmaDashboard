import { Download, ArrowUpDown } from "lucide-react";
import { FilterCard } from "../FilterCard";
import { KpiCard } from "../KpiCard";
import { ChartCard } from "../ChartCard";
import { StatusBadge } from "../StatusBadge";

const tableData = [
  { ref: "REF-2566-001", company: "บ.ไทยอาวุธ จำกัด", mm9: "28,000", mm556: "45,000", cal45: "12,000", cal50: "8,000", explosive: "1,200", det: "350", status: "อนุมัติ" },
  { ref: "REF-2566-002", company: "บ.ดีเฟนส์ โปร จำกัด", mm9: "22,000", mm556: "36,000", cal45: "9,000", cal50: "6,000", explosive: "980", det: "280", status: "อนุมัติ" },
  { ref: "REF-2566-003", company: "บ.นาธาน อินเตอร์ จำกัด", mm9: "14,000", mm556: "22,000", cal45: "5,500", cal50: "3,500", explosive: "620", det: "180", status: "กำลังดำเนินการ" },
  { ref: "REF-2566-004", company: "บ.เอเชียซัพพลาย จำกัด", mm9: "9,000", mm556: "14,000", cal45: "3,500", cal50: "2,200", explosive: "390", det: "110", status: "รอดำเนินการ" },
  { ref: "REF-2566-005", company: "บ.เทคโนอาวุธ จำกัด", mm9: "4,800", mm556: "7,500", cal45: "1,800", cal50: "1,100", explosive: "210", det: "60", status: "ยื่นคำขอ" },
];

export function Page3Ammo() {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>ระบบรายงาน / รายงาน</div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>ประเภทและขนาดกระสุน/วัตถุระเบิด</h1>

      </div>

      <FilterCard
        extraFilters={
          <>
            <select style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}>
              <option>ขนาดกระสุนทั้งหมด</option>
              <option>9มม.</option>
              <option>5.56มม.</option>
              <option>.45</option>
              <option>.50</option>
            </select>
            <select style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}>
              <option>ประเภทระเบิดทั้งหมด</option>
              <option>ดินระเบิด TNT</option>
              <option>ดินระเบิด C4</option>
              <option>เชื้อปะทุ</option>
            </select>
          </>
        }
      />

      {/* KPI Row */}
      <div className="flex gap-3 mb-4">
        <KpiCard label="กระสุนรวม (นัด)" value="297,100" sub="ทุกขนาด ปี 2566" color="#7C3AED" />
        <KpiCard label="ดินระเบิด (กก.)" value="3,400" sub="TNT / C4 / อื่นๆ" color="#2563EB" />
        <KpiCard label="เชื้อปะทุ (ชิ้น)" value="980" sub="ทุกประเภท" color="#16A34A" />
        <KpiCard label="ขนาดที่มีการขนย้าย" value="4 ขนาด" sub="9มม. / 5.56 / .45 / .50" color="#EA580C" />
      </div>

      {/* Charts */}
      <div className="flex gap-3 mb-4">
        <ChartCard title="ปริมาณกระสุนแยกตามขนาด" type="grouped-bar" height={190} className="flex-1" />
        <ChartCard title="วัตถุระเบิดแยกตามประเภท" type="bar" height={190} className="flex-1" />
      </div>

      {/* Table */}
      <div className="bg-white" style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>รายการกระสุนและวัตถุระเบิด</div>
          <div className="flex gap-2">
            {["📥 Export ดิบ (Excel)", "📊 Export สรุป (Excel)", "📄 Export PDF"].map((l) => (
              <button key={l} style={{ height: 28, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 10px", fontSize: 10, color: "#6B7280", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead style={{ background: "#FAFAFA" }}>
              <tr>
                {["#", "เลขที่อ้างอิง", "บริษัท", "9มม.", "5.56มม.", ".45", ".50", "ดินระเบิด(กก.)", "เชื้อปะทุ(ชิ้น)", "สถานะ"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: "#6B7280" }}>{i + 1}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.ref}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{row.company}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.mm9}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.mm556}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.cal45}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.cal50}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.explosive}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.det}</td>
                  <td style={{ padding: "8px 10px" }}><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
