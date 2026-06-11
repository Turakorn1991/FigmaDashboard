type StatusType =
  | "อนุมัติ"
  | "สร้างคำขอ"
  | "ค้นคว้า"
  | "ยื่นคำขอ"
  | "รอดำเนินการ"
  | "รอบังคับเกณฑ์"
  | "กำลังดำเนินการ"
  | "กำลังขนย้าย"
  | "ยกเลิก"
  | "ปฏิเสธ"
  | "เสร็จสิ้น"
  | "ใกล้หมดอายุ";

const statusStyles: Record<string, { bg: string; color: string }> = {
  อนุมัติ: { bg: "#DCFCE7", color: "#16A34A" },
  สร้างคำขอ: { bg: "#EDE9FE", color: "#7C3AED" },
  ค้นคว้า: { bg: "#FFEDD5", color: "#EA580C" },
  ยื่นคำขอ: { bg: "#FFEDD5", color: "#EA580C" },
  รอดำเนินการ: { bg: "#DBEAFE", color: "#2563EB" },
  รอบังคับเกณฑ์: { bg: "#DBEAFE", color: "#2563EB" },
  กำลังดำเนินการ: { bg: "#FEF9C3", color: "#CA8A04" },
  กำลังขนย้าย: { bg: "#FEF9C3", color: "#CA8A04" },
  ยกเลิก: { bg: "#FEE2E2", color: "#DC2626" },
  ปฏิเสธ: { bg: "#FEE2E2", color: "#DC2626" },
  เสร็จสิ้น: { bg: "#DCFCE7", color: "#16A34A" },
  ใกล้หมดอายุ: { bg: "#FEE2E2", color: "#DC2626" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
