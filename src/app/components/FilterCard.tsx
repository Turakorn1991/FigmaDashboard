import { Search, RotateCcw } from "lucide-react";

interface FilterCardProps {
  extraFilters?: React.ReactNode;
  thirdDateLabel?: string;
}

export function FilterCard({ extraFilters, thirdDateLabel = "วันที่อนุมัติ" }: FilterCardProps) {
  return (
    <div
      className="bg-white"
      style={{ borderRadius: 10, border: "1px solid #E5E7EB", padding: "14px 16px", marginBottom: 14 }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>ค้นหาข้อมูล</div>

      {/* Row 1: Date ranges */}
      <div className="flex gap-3 mb-3">
        {[
          { label: "วันที่รับเรื่อง" },
          { label: "วันที่ออกใบอนุญาต" },
          { label: thirdDateLabel },
        ].map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 flex-1">
            <div>
              <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", marginBottom: 3, letterSpacing: "0.05em" }}>
                {d.label}
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className="outline-none bg-[#F9FAFB]"
                  style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, padding: "0 8px", fontSize: 11, color: "#374151", width: 120 }}
                />
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>→</span>
                <input
                  type="date"
                  className="outline-none bg-[#F9FAFB]"
                  style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, padding: "0 8px", fontSize: 11, color: "#374151", width: 120 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Dropdowns + search + buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}
        >
          <option>ค้นหาโดย</option>
          <option>เลขที่อ้างอิง</option>
          <option>ชื่อบริษัท</option>
        </select>

        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหา..."
            style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", paddingLeft: 28, paddingRight: 8, background: "#F9FAFB", outline: "none", width: 180 }}
          />
        </div>

        <select
          style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}
        >
          <option>สถานะทั้งหมด</option>
          <option>อนุมัติ</option>
          <option>รอดำเนินการ</option>
          <option>ยกเลิก</option>
        </select>

        <select
          style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 11, color: "#374151", padding: "0 8px", background: "#F9FAFB", outline: "none" }}
        >
          <option>หมวดหมู่ทั้งหมด</option>
          <option>กระสุน</option>
          <option>วัตถุระเบิด</option>
        </select>

        {extraFilters}

        <button
          style={{ height: 34, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", padding: "0 12px", fontSize: 11, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
        >
          <RotateCcw size={12} /> รีเซ็ต
        </button>

        <button
          style={{ height: 34, width: 34, borderRadius: 8, background: "#7C3AED", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Search size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
