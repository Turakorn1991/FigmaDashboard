import { Download, ArrowUpDown } from "lucide-react";
import { FilterCard } from "../FilterCard";
import { ChartCard, CompanyStatusChartCard } from "../ChartCard";
import { StatusBadge } from "../StatusBadge";

const tableData = [
  { ref: "REF-2566-001", company: "บ.ไทยอาวุธ จำกัด", bullets: "120,000", explosives: "3,200", permits: 42, share: 35, status: "อนุมัติ" },
  { ref: "REF-2566-002", company: "บ.ดีเฟนส์ โปร จำกัด", bullets: "95,000", explosives: "2,600", permits: 33, share: 28, status: "อนุมัติ" },
  { ref: "REF-2566-003", company: "บ.นาธาน อินเตอร์ จำกัด", bullets: "60,000", explosives: "1,700", permits: 21, share: 18, status: "กำลังดำเนินการ" },
  { ref: "REF-2566-004", company: "บ.เอเชียซัพพลาย จำกัด", bullets: "38,000", explosives: "1,100", permits: 14, share: 12, status: "รอดำเนินการ" },
  { ref: "REF-2566-005", company: "บ.เทคโนอาวุธ จำกัด", bullets: "20,000", explosives: "580", permits: 8, share: 7, status: "สร้างคำขอ" },
];

export function Page2Company() {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>ระบบรายงาน / รายงาน</div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>ข้อมูลแยกรายบริษัท</h1>

      </div>

      <FilterCard
        extraFilters={
          <>
            <select style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}>
              <option>บริษัททั้งหมด</option>
              <option>บ.ไทยอาวุธ จำกัด</option>
              <option>บ.ดีเฟนส์ โปร จำกัด</option>
            </select>
            <select style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}>
              <option>ผู้ประกอบการทั้งหมด</option>
              <option>นายสมชาย ใจดี</option>
              <option>นายวิชัย มั่นคง</option>
            </select>
          </>
        }
      />

      {/* Charts 3 equal */}
      <div className="flex gap-3 mb-4">
        <ChartCard title="Top 5 บริษัทขนย้ายสูงสุด" type="horizontal-bar" height={185} className="flex-1" />
        <ChartCard title="Market Share รายบริษัท" type="pie" height={185} className="flex-1" />
        <CompanyStatusChartCard title="สถานะใบอนุญาตแยกบริษัท" />
      </div>

      {/* Table */}
      <div className="bg-white" style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>ข้อมูลแยกรายบริษัท</div>
          <div className="flex gap-2">
            {["📥 Export ดิบ (Excel)", "📊 Export สรุป (Excel)", "📄 Export PDF"].map((l) => (
              <button key={l} style={{ height: 28, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 10px", fontSize: 10, color: "#6B7280", cursor: "pointer" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#FAFAFA" }}>
            <tr>
              {["#", "เลขที่อ้างอิง", "บริษัท", "กระสุน (นัด)", "ระเบิด (กก.)", "ใบอนุญาต", "% ส่วนแบ่ง", "สถานะ"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: "1px solid #F3F4F6" }}>
                  <span className="flex items-center gap-1">
                    {h} {["กระสุน (นัด)", "ระเบิด (กก.)", "ใบอนุญาต"].includes(h) && <ArrowUpDown size={10} color="#D1D5DB" />}
                  </span>
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
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151" }}>{row.company}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{row.bullets}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{row.explosives}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{row.permits}</td>
                <td style={{ padding: "8px 10px" }}>
                  <div className="flex items-center gap-2">
                    <div style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${row.share}%`, height: "100%", background: "#7C3AED", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#374151", minWidth: 28 }}>{row.share}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px 10px" }}><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
