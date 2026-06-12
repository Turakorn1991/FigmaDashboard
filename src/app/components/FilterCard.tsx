import { Search, RotateCcw } from "lucide-react";

interface FilterCardProps {
  extraFilters?: React.ReactNode;
  thirdDateLabel?: string;
}

export function FilterCard({ extraFilters, thirdDateLabel = "วันที่อนุมัติ" }: FilterCardProps) {
  return (
    <div className="bg-white" style={{ borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 12 }}>ค้นหาข้อมูล</div>

      {/* Date ranges */}
      <div className="flex gap-3 mb-3">
        {["วันที่รับเรื่อง", "วันที่ออกใบอนุญาต", thirdDateLabel].map((label) => (
          <div key={label} className="flex-1">
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{label}</div>
            <div className="flex items-center gap-1">
              <input type="date" style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, padding: "0 8px", fontSize: 13, color: "#374151", width: 130, background: "#fff", outline: "none" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>→</span>
              <input type="date" style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, padding: "0 8px", fontSize: 13, color: "#374151", width: 130, background: "#fff", outline: "none" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: dropdowns + search + buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <select style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, fontSize: 13, color: "#374151", padding: "0 8px", background: "#fff", outline: "none" }}>
          <option>ค้นหาโดย: ทั้งหมด</option>
          <option>เลขที่อ้างอิง</option>
          <option>ชื่อบริษัท</option>
        </select>

        <div className="relative">
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input type="text" placeholder="พิมพ์เพื่อค้นหา..." style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, fontSize: 13, color: "#374151", paddingLeft: 30, paddingRight: 8, background: "#fff", outline: "none", width: 220 }} />
        </div>

        <select style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, fontSize: 13, color: "#374151", padding: "0 8px", background: "#fff", outline: "none" }}>
          <option>สถานะ: ทั้งหมด</option>
          <option>อนุมัติ</option>
          <option>รอดำเนินการ</option>
          <option>ยกเลิก</option>
        </select>

        <select style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, fontSize: 13, color: "#374151", padding: "0 8px", background: "#fff", outline: "none" }}>
          <option>หมวดหมู่ทั้งหมด</option>
          <option>กระสุน</option>
          <option>วัตถุระเบิด</option>
        </select>

        {extraFilters}

        <button style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 6, background: "#fff", padding: "0 14px", fontSize: 13, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <RotateCcw size={12} /> รีเซ็ต
        </button>

        <button style={{ height: 36, width: 36, borderRadius: 6, background: "#6574FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Search size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
