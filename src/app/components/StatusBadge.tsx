const statusStyles: Record<string, { bg: string; color: string }> = {
  อนุมัติ:          { bg: "#00C259", color: "#fff" },
  เสร็จสิ้น:        { bg: "#00C259", color: "#fff" },
  "ตีกลับ/แก้ไข":  { bg: "#FF4344", color: "#fff" },
  ยกเลิก:           { bg: "#FF4344", color: "#fff" },
  ปฏิเสธ:           { bg: "#FF4344", color: "#fff" },
  ใกล้หมดอายุ:      { bg: "#FF4344", color: "#fff" },
  สร้างคำขอ:        { bg: "#EDE9FE", color: "#6574FF" },
  ค้นคว้า:          { bg: "#FFEDD5", color: "#EA580C" },
  ยื่นคำขอ:         { bg: "#FFEDD5", color: "#EA580C" },
  รอดำเนินการ:      { bg: "#DBEAFE", color: "#2563EB" },
  รอบังคับเกณฑ์:    { bg: "#DBEAFE", color: "#2563EB" },
  กำลังดำเนินการ:   { bg: "#FEF9C3", color: "#CA8A04" },
  กำลังขนย้าย:      { bg: "#FEF9C3", color: "#CA8A04" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
        minWidth: 72,
      }}
    >
      {status}
    </span>
  );
}
