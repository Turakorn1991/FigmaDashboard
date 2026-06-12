import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { FilterCard } from "../FilterCard";
import { KpiCard } from "../KpiCard";
import { ChartCard } from "../ChartCard";
import { StatusBadge } from "../StatusBadge";
import { ArrowUpDown } from "lucide-react";

const tableData = [
  { month: "มกราคม 2566", bullets: "42,000", explosives: "1,200", permits: 18, company: "บ.ไทยอาวุธ จำกัด", status: "อนุมัติ" },
  { month: "กุมภาพันธ์ 2566", bullets: "38,500", explosives: "980", permits: 15, company: "บ.ดีเฟนส์ โปร จำกัด", status: "อนุมัติ" },
  { month: "มีนาคม 2566", bullets: "55,000", explosives: "1,500", permits: 22, company: "บ.ไทยอาวุธ จำกัด", status: "กำลังดำเนินการ" },
  { month: "เมษายน 2566", bullets: "47,200", explosives: "1,100", permits: 19, company: "บ.นาธาน อินเตอร์ จำกัด", status: "รอดำเนินการ" },
  { month: "พฤษภาคม 2566", bullets: "61,000", explosives: "1,800", permits: 25, company: "บ.เอเชียซัพพลาย จำกัด", status: "อนุมัติ" },
  { month: "มิถุนายน 2566", bullets: "53,400", explosives: "1,350", permits: 21, company: "บ.ไทยอาวุธ จำกัด", status: "สร้างคำขอ" },
];

export function Page1Overview() {
  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>ระบบรายงาน / รายงาน</div>

      {/* Page title + action button */}
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0E1119", margin: 0 }}>ภาพรวมการขนย้ายยุทธภัณฑ์</h1>
        <button style={{ height: 40, background: "#6574FF", color: "#fff", border: "none", borderRadius: 6, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer" }}>
          + เพิ่มข้อมูล
        </button>
      </div>

      <FilterCard />

      {/* KPI Row */}
      <div className="flex gap-3 mb-4">
        <KpiCard label="กระสุนรวม (นัด)" value="297,100" sub="ปีงบประมาณ 2566" color="#6574FF" />
        <KpiCard label="วัตถุระเบิด (กก.)" value="7,930" sub="ปีงบประมาณ 2566" color="#2563EB" />
        <KpiCard label="ใบอนุญาตทั้งหมด" value="120" sub="ออกใบอนุญาตแล้ว" color="#16A34A" />
        <KpiCard label="บริษัท (แห่ง)" value="14" sub="บริษัทที่ได้รับอนุญาต" color="#EA580C" />
        <KpiCard label="หน่วยงานผู้รับ" value="38" sub="หน่วยงานที่ได้รับกระสุน" color="#DC2626" />
      </div>

      {/* Charts */}
      <div className="flex gap-3 mb-4">
        <div style={{ flex: 2 }}>
          <ChartCard title="แนวโน้มการขนย้ายรายเดือน" type="bar-line" height={190} />
        </div>
        <div style={{ flex: 1 }}>
          <ChartCard title="สัดส่วนรายบริษัท" type="donut" height={190} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white" style={{ borderRadius: 8, overflow: "hidden" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119" }}>ข้อมูลการขนย้ายรายเดือน</div>
          <div className="flex gap-2">
            {[
              { icon: <FileSpreadsheet size={12} />, label: "Export ดิบ (Excel)" },
              { icon: <FileSpreadsheet size={12} />, label: "Export สรุป (Excel)" },
              { icon: <FileText size={12} />, label: "Export PDF" },
            ].map((b) => (
              <button
                key={b.label}
                style={{ height: 28, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 10px", fontSize: 10, color: "#6B7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {b.icon} {b.label}
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fff" }}>
            <tr>
              {["#", "เดือน", "กระสุน (นัด)", "ระเบิด (กก.)", "ใบอนุญาต", "บริษัท", "สถานะ"].map((h) => (
                <th
                  key={h}
                  style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.88)", textAlign: "left", borderBottom: "1px solid #F0F0F0" }}
                >
                  <span className="flex items-center gap-1">
                    {h} {["กระสุน (นัด)", "ระเบิด (กก.)", "ใบอนุญาต"].includes(h) && <ArrowUpDown size={10} color="#D1D5DB" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid #F9FAFB" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(0,0,0,0.65)" }}>{i + 1}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(0,0,0,0.88)" }}>{row.month}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(0,0,0,0.88)" }}>{row.bullets}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(0,0,0,0.88)" }}>{row.explosives}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(0,0,0,0.88)" }}>{row.permits}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(0,0,0,0.88)" }}>{row.company}</td>
                <td style={{ padding: "10px 12px" }}><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
