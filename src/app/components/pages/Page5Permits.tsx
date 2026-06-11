import { Download } from "lucide-react";
import { FilterCard } from "../FilterCard";
import { KpiCard } from "../KpiCard";
import { ChartCard } from "../ChartCard";
import { StatusBadge } from "../StatusBadge";

const tableData = [
  { ref: "REF-2566-001", receiptNo: "รับ-2566-0012", receivedDate: "02/01/2566", reqNo: "คขอ-2566-001", permitType: "ขนย้ายกระสุน", operator: "นายสมชาย ใจดี", status: "อนุมัติ", permitNo: "อน-2566-001", qty: "45,000 นัด", expiry: "02/07/2566" },
  { ref: "REF-2566-002", receiptNo: "รับ-2566-0018", receivedDate: "15/01/2566", reqNo: "คขอ-2566-002", permitType: "ขนย้ายระเบิด", operator: "นายวิชัย มั่นคง", status: "กำลังขนย้าย", permitNo: "อน-2566-002", qty: "1,200 กก.", expiry: "15/04/2566" },
  { ref: "REF-2566-003", receiptNo: "รับ-2566-0025", receivedDate: "28/01/2566", reqNo: "คขอ-2566-003", permitType: "ขนย้ายกระสุน", operator: "นางสาวสุภา รักษ์ดี", status: "รอดำเนินการ", permitNo: "-", qty: "18,000 นัด", expiry: "-" },
  { ref: "REF-2566-004", receiptNo: "รับ-2566-0031", receivedDate: "10/02/2566", reqNo: "คขอ-2566-004", permitType: "ขนย้ายกระสุน", operator: "นายประสิทธิ์ พงษ์ดี", status: "อนุมัติ", permitNo: "อน-2566-004", qty: "32,000 นัด", expiry: "10/08/2566" },
  { ref: "REF-2566-005", receiptNo: "รับ-2566-0038", receivedDate: "22/02/2566", reqNo: "คขอ-2566-005", permitType: "ขนย้ายเชื้อปะทุ", operator: "นายอนุรักษ์ ศรีสุข", status: "ใกล้หมดอายุ", permitNo: "อน-2566-005", qty: "350 ชิ้น", expiry: "25/06/2566" },
  { ref: "REF-2566-006", receiptNo: "รับ-2566-0044", receivedDate: "05/03/2566", reqNo: "คขอ-2566-006", permitType: "ขนย้ายระเบิด", operator: "นายธีรศักดิ์ ดีมาก", status: "สร้างคำขอ", permitNo: "-", qty: "800 กก.", expiry: "-" },
  { ref: "REF-2566-007", receiptNo: "รับ-2566-0052", receivedDate: "18/03/2566", reqNo: "คขอ-2566-007", permitType: "ขนย้ายกระสุน", operator: "นายสมชาย ใจดี", status: "เสร็จสิ้น", permitNo: "อน-2566-007", qty: "28,000 นัด", expiry: "18/09/2566" },
];

export function Page5Permits() {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>ระบบค้าขอ / รายงาน#5 ใบอนุญาต</div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>ติดตามใบอนุญาตขนย้ายยุทธภัณฑ์</h1>
        <button style={{ height: 36, background: "#7C3AED", color: "#fff", borderRadius: 8, border: "none", padding: "0 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14} /> สร้างรายงาน
        </button>
      </div>

      <FilterCard thirdDateLabel="วันหมดอายุ" />

      {/* KPI */}
      <div className="flex gap-3 mb-4">
        <KpiCard label="รอดำเนินการ" value="12" sub="ใบอนุญาตรอการพิจารณา" color="#EA580C" />
        <KpiCard label="กำลังขนย้าย" value="28" sub="อยู่ระหว่างขนย้าย" color="#2563EB" />
        <KpiCard label="เสร็จสิ้นแล้ว" value="74" sub="ขนย้ายเสร็จสมบูรณ์" color="#16A34A" />
        <KpiCard label="ใกล้หมดอายุ (30วัน)" value="6" sub="ต้องต่ออายุภายใน 30 วัน" color="#DC2626" />
      </div>

      {/* Charts */}
      <div className="flex gap-3 mb-4">
        <ChartCard title="สถานะใบอนุญาตแยกรายบริษัท" type="stacked-bar" height={190} className="flex-1" />
        <ChartCard title="แนวโน้มการออกใบอนุญาตรายเดือน" type="line" height={190} className="flex-1" />
      </div>

      {/* Table */}
      <div className="bg-white" style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>รายการใบอนุญาตขนย้าย</div>
          <div className="flex gap-2">
            {["📥 Export ดิบ (Excel)", "📊 Export สรุป (Excel)", "📄 Export PDF"].map((l) => (
              <button key={l} style={{ height: 28, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 10px", fontSize: 10, color: "#6B7280", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead style={{ background: "#FAFAFA" }}>
              <tr>
                {["#", "เลขที่อ้างอิง", "เลขที่รับเรื่อง", "วันที่รับเรื่อง", "เลขที่คำขอ", "ประเภทขอรับอนุญาต", "ผู้ประกอบการ", "สถานะ", "เลขใบอนุญาต", "จำนวนอนุญาต", "วันหมดอายุ"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{h}</th>
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
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.receiptNo}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>{row.receivedDate}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.reqNo}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>{row.permitType}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{row.operator}</td>
                  <td style={{ padding: "8px 10px" }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{row.permitNo}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>{row.qty}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: row.expiry === "-" ? "#6B7280" : row.status === "ใกล้หมดอายุ" ? "#DC2626" : "#374151", fontFamily: "monospace", fontWeight: row.status === "ใกล้หมดอายุ" ? 700 : 400 }}>{row.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
