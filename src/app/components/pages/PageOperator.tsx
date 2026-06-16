import { useState } from "react";
import { Eye, Building2, X } from "lucide-react";

const PRIMARY = "#6574FF";
const FF = "'Noto Sans Thai', Inter, sans-serif";

interface Operator {
  id: number; name: string; taxId: string; address: string;
  licenseNo: string; status: "active" | "inactive" | "expired";
  updatedAt: string; phone: string; email: string; contactPerson: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  active:   { label: "ใช้งาน",  bg: "#ECFDF5", color: "#059669" },
  inactive: { label: "ระงับ",   bg: "#FEF2F2", color: "#DC2626" },
  expired:  { label: "หมดอายุ", bg: "#FFFBEB", color: "#D97706" },
};

const MOCK: Operator[] = [
  { id: 1, name: "บริษัท ดีเฟนส์ อินดัสทรี จำกัด", taxId: "0105556123456", address: "123 ถ.พหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400", licenseNo: "รง.4-2566-0001", status: "active", updatedAt: "15 มิ.ย. 2568", phone: "02-123-4567", email: "info@defence-ind.co.th", contactPerson: "นายสมชาย ใจดี" },
  { id: 2, name: "ห้างหุ้นส่วนจำกัด ไทยอาวุธยุทธภัณฑ์", taxId: "0105548234567", address: "456 ถ.บางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพฯ 10260", licenseNo: "รง.4-2565-0012", status: "active", updatedAt: "10 มิ.ย. 2568", phone: "02-234-5678", email: "contact@thaiarmsco.th", contactPerson: "นางสาวสุดา มั่นคง" },
  { id: 3, name: "บริษัท มิลิทารี่ เทคโนโลยี จำกัด", taxId: "0105560345678", address: "789 นิคมอุตสาหกรรมบางชัน เขตมีนบุรี กรุงเทพฯ 10510", licenseNo: "รง.4-2567-0003", status: "expired", updatedAt: "01 มิ.ย. 2568", phone: "02-345-6789", email: "mil.tech@gmail.com", contactPerson: "นายประสิทธิ์ เก่งกาจ" },
  { id: 4, name: "บริษัท อาวุธไทย อินเตอร์เนชั่นแนล จำกัด", taxId: "0105552456789", address: "321 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110", licenseNo: "รง.4-2564-0008", status: "inactive", updatedAt: "20 พ.ค. 2568", phone: "02-456-7890", email: "info@thaiarms-intl.com", contactPerson: "นางรัตนา วิชัย" },
  { id: 5, name: "บริษัท ป้องกันชาติ จำกัด (มหาชน)", taxId: "0107558567890", address: "654 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400", licenseNo: "รง.4-2566-0015", status: "active", updatedAt: "05 มิ.ย. 2568", phone: "02-567-8901", email: "defense@patcharnchat.co.th", contactPerson: "พันโทสมพงษ์ ชาติพัฒน์" },
  { id: 6, name: "บริษัท ยุทธนา อาวุธ จำกัด", taxId: "0105549678901", address: "987 นิคมอุตสาหกรรมสมุทรปราการ จ.สมุทรปราการ 10280", licenseNo: "รง.4-2565-0020", status: "active", updatedAt: "12 มิ.ย. 2568", phone: "02-678-9012", email: "info@yutthana.co.th", contactPerson: "นายธนพล ยุทธนา" },
  { id: 7, name: "ห้างหุ้นส่วนจำกัด วิศวกรรมป้องกัน", taxId: "0105551789012", address: "147 ถ.พุทธมณฑลสาย 2 แขวงบางระมาด เขตตลิ่งชัน กรุงเทพฯ 10170", licenseNo: "รง.4-2563-0005", status: "expired", updatedAt: "28 พ.ค. 2568", phone: "02-789-0123", email: "wisawakam@defence-eng.th", contactPerson: "นายวิชัย วิศวกร" },
  { id: 8, name: "บริษัท ซีเคียวริตี้ อินดัสทรี จำกัด", taxId: "0105562890123", address: "258 ถ.ลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900", licenseNo: "รง.4-2568-0001", status: "active", updatedAt: "14 มิ.ย. 2568", phone: "02-890-1234", email: "security@secindustry.co.th", contactPerson: "นายกิตติพงษ์ ปลอดภัย" },
];

export function PageOperator() {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Operator | null>(null);
  const filtered = MOCK.filter((o) => o.name.includes(search) || o.taxId.includes(search) || o.licenseNo.includes(search));

  return (
    <div style={{ fontFamily: FF }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>ข้อมูลผู้ประกอบการ รง.4</div>
        <div style={{ fontSize: 13, color: "#8B8E95", marginTop: 4 }}>ข้อมูลผู้ประกอบการโรงงานผลิตอาวุธของเอกชน ที่ได้รับใบอนุญาต รง.4</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อผู้ประกอบการ, เลขภาษี, เลขใบอนุญาต..."
            style={{ width: "100%", height: 40, padding: "0 12px 0 36px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
          <svg style={{ position: "absolute", left: 11, top: 12, color: "#9CA3AF" }} width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการผู้ประกอบการ</span>
          <span style={{ fontSize: 12, color: "#8B8E95" }}>ทั้งหมด {filtered.length} รายการ</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F0F0F0" }}>
              {["#", "ผู้ประกอบการ", "เลขประจำตัวผู้เสียภาษี", "เลขที่ใบอนุญาต รง.4", "สถานะ", "วันที่แก้ไข", ""].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.88)", background: "#fff", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const s = STATUS_MAP[o.status];
              return (
                <tr key={o.id} style={{ borderBottom: "1px solid #F9FAFB" }} onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280", width: 48 }}>{i + 1}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#0E1119", fontWeight: 500 }}>{o.name}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#0E1119", fontFamily: "monospace" }}>{o.taxId}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#0E1119" }}>{o.licenseNo}</td>
                  <td style={{ padding: "12px 14px" }}><span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span></td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>{o.updatedAt}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => setDetail(o)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#C7D2FE"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB"; }}>
                      <Eye size={14} color={PRIMARY} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 600, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={20} color={PRIMARY} /></div>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: "#0E1119" }}>รายละเอียดผู้ประกอบการ</div><div style={{ fontSize: 12, color: "#8B8E95" }}>ข้อมูลผู้ประกอบการโรงงานผลิตอาวุธ</div></div>
              <button onClick={() => setDetail(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color="#6B7280" /></button>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {[["ชื่อผู้ประกอบการ", detail.name, "span 2"], ["เลขประจำตัวผู้เสียภาษี", detail.taxId], ["เลขที่ใบอนุญาต รง.4", detail.licenseNo], ["ที่อยู่", detail.address, "span 2"], ["เบอร์โทรศัพท์", detail.phone], ["อีเมล", detail.email], ["ผู้ประสานงาน", detail.contactPerson], ["สถานะ", detail.status === "active" ? "ใช้งาน" : detail.status === "inactive" ? "ระงับ" : "หมดอายุ"], ["วันที่แก้ไขล่าสุด", detail.updatedAt]].map(([label, value, span]) => (
                <div key={label as string} style={{ gridColumn: span as string }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#8B8E95", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: "#0E1119" }}>{value}</div>
                </div>
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
