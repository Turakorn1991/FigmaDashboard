import { Image, FileText } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface ChartCardProps {
  title: string;
  type: "bar" | "line" | "pie" | "donut" | "bar-line" | "horizontal-bar" | "stacked-bar" | "grouped-bar";
  height?: number;
  className?: string;
}

const COLORS = ["#6574FF", "#2563EB", "#16A34A", "#EA580C", "#FF4344", "#CA8A04", "#0891B2"];

const monthlyData = [
  { month: "ม.ค.", กระสุน: 42000, ระเบิด: 1200, ใบอนุญาต: 18 },
  { month: "ก.พ.", กระสุน: 38000, ระเบิด: 980, ใบอนุญาต: 15 },
  { month: "มี.ค.", กระสุน: 55000, ระเบิด: 1500, ใบอนุญาต: 22 },
  { month: "เม.ย.", กระสุน: 47000, ระเบิด: 1100, ใบอนุญาต: 19 },
  { month: "พ.ค.", กระสุน: 61000, ระเบิด: 1800, ใบอนุญาต: 25 },
  { month: "มิ.ย.", กระสุน: 53000, ระเบิด: 1350, ใบอนุญาต: 21 },
];

const companyData = [
  { name: "บ.ไทยอาวุธ", value: 35 },
  { name: "บ.ดีเฟนส์", value: 28 },
  { name: "บ.นาธาน", value: 18 },
  { name: "บ.เอเชียซัพ", value: 12 },
  { name: "อื่นๆ", value: 7 },
];

const statusData = [
  { name: "บ.ไทยอาวุธ", อนุมัติ: 12, รอดำเนินการ: 4, ยกเลิก: 1 },
  { name: "บ.ดีเฟนส์", อนุมัติ: 9, รอดำเนินการ: 3, ยกเลิก: 2 },
  { name: "บ.นาธาน", อนุมัติ: 6, รอดำเนินการ: 2, ยกเลิก: 0 },
  { name: "บ.เอเชียซัพ", อนุมัติ: 4, รอดำเนินการ: 1, ยกเลิก: 1 },
];

const ammoSizeData = [
  { name: "9มม.", y2565: 28000, y2566: 34000 },
  { name: "5.56มม.", y2565: 45000, y2566: 52000 },
  { name: ".45", y2565: 12000, y2566: 15000 },
  { name: ".50", y2565: 8000, y2566: 11000 },
];

const explosiveData = [
  { name: "TNT", amount: 4500 },
  { name: "C4", amount: 2800 },
  { name: "เชื้อปะทุ", amount: 1200 },
  { name: "ดินปืน", amount: 3100 },
  { name: "อื่นๆ", amount: 900 },
];

const permitStatusData = [
  { name: "บ.ไทยอาวุธ", รอ: 3, ขนย้าย: 8, เสร็จ: 12, หมดอายุ: 1 },
  { name: "บ.ดีเฟนส์", รอ: 2, ขนย้าย: 6, เสร็จ: 9, หมดอายุ: 2 },
  { name: "บ.นาธาน", รอ: 1, ขนย้าย: 4, เสร็จ: 6, หมดอายุ: 0 },
];

const permitTrendData = [
  { month: "ม.ค.", ออกใบอนุญาต: 18 },
  { month: "ก.พ.", ออกใบอนุญาต: 15 },
  { month: "มี.ค.", ออกใบอนุญาต: 22 },
  { month: "เม.ย.", ออกใบอนุญาต: 19 },
  { month: "พ.ค.", ออกใบอนุญาต: 25 },
  { month: "มิ.ย.", ออกใบอนุญาต: 21 },
];

function renderChart(type: ChartCardProps["type"], height: number) {
  const h = height - 20;
  switch (type) {
    case "bar-line":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis key="x" dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis key="y-left" yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis key="y-right" yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
            <Legend key="lg" wrapperStyle={{ fontSize: 10 }} />
            <Bar key="bar-gun" yAxisId="left" dataKey="กระสุน" name="กระสุน" fill="#6574FF" radius={[3, 3, 0, 0]} />
            <Bar key="bar-bomb" yAxisId="left" dataKey="ระเบิด" name="ระเบิด" fill="#2563EB" radius={[3, 3, 0, 0]} />
            <Line key="line-permit" yAxisId="right" type="monotone" dataKey="ใบอนุญาต" name="ใบอนุญาต" stroke="#EA580C" dot={{ r: 3 }} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "donut":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie key="pie" data={companyData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
              {companyData.map((entry, i) => <Cell key={`donut-cell-${entry.name}`} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} formatter={(v) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "horizontal-bar":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart layout="vertical" data={companyData} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis key="x" type="number" tick={{ fontSize: 10 }} />
            <YAxis key="y" type="category" dataKey="name" tick={{ fontSize: 10 }} width={65} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} formatter={(v) => `${v}%`} />
            <Bar key="bar" dataKey="value" name="ส่วนแบ่ง" radius={[0, 3, 3, 0]}>
              {companyData.map((entry, i) => <Cell key={`hbar-cell-${entry.name}`} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie key="pie" data={companyData} cx="50%" cy="50%" outerRadius={65} dataKey="value">
              {companyData.map((entry, i) => <Cell key={`pie-cell-${entry.name}`} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} formatter={(v) => `${v}%`} />
            <Legend key="lg" wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "stacked-bar":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={permitStatusData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis key="x" dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis key="y" tick={{ fontSize: 10 }} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
            <Legend key="lg" wrapperStyle={{ fontSize: 10 }} />
            <Bar key="bar-wait" dataKey="รอ" name="รอดำเนินการ" stackId="a" fill="#EA580C" />
            <Bar key="bar-move" dataKey="ขนย้าย" name="กำลังขนย้าย" stackId="a" fill="#2563EB" />
            <Bar key="bar-done" dataKey="เสร็จ" name="เสร็จสิ้น" stackId="a" fill="#16A34A" />
            <Bar key="bar-exp" dataKey="หมดอายุ" name="หมดอายุ" stackId="a" fill="#DC2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "grouped-bar":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={ammoSizeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis key="x" dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis key="y" tick={{ fontSize: 10 }} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
            <Legend key="lg" wrapperStyle={{ fontSize: 10 }} />
            <Bar key="bar-2565" dataKey="y2565" name="ปี 2565" fill="#6574FF" radius={[2, 2, 0, 0]} />
            <Bar key="bar-2566" dataKey="y2566" name="ปี 2566" fill="#2563EB" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={explosiveData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis key="x" dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis key="y" tick={{ fontSize: 10 }} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
            <Bar key="bar" dataKey="amount" name="ปริมาณ" radius={[3, 3, 0, 0]}>
              {explosiveData.map((entry, i) => <Cell key={`bar-cell-${entry.name}`} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={permitTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis key="x" dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis key="y" tick={{ fontSize: 10 }} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
            <Line key="line" type="monotone" dataKey="ออกใบอนุญาต" name="ออกใบอนุญาต" stroke="#6574FF" strokeWidth={2} dot={{ r: 3, fill: "#6574FF" }} />
          </LineChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
}

// Separate chart component for Page2 company-status stacked bar
export function CompanyStatusChartCard({ title }: { title: string }) {
  const h = 165;
  return (
    <div className="bg-white flex-1" style={{ borderRadius: 8, padding: "14px 16px" }}>
      <div className="flex items-center justify-between mb-3">
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{title}</div>
        <div className="flex gap-1.5">
          {["PNG", "PDF"].map((l) => (
            <button key={l} style={{ height: 26, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 8px", fontSize: 10, color: "#6B7280", cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={statusData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis key="x" dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis key="y" tick={{ fontSize: 10 }} />
            <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
            <Legend key="lg" wrapperStyle={{ fontSize: 10 }} />
            <Bar key="bar-approved" dataKey="อนุมัติ" name="อนุมัติ" stackId="a" fill="#16A34A" />
            <Bar key="bar-pending" dataKey="รอดำเนินการ" name="รอดำเนินการ" stackId="a" fill="#2563EB" />
            <Bar key="bar-cancel" dataKey="ยกเลิก" name="ยกเลิก" stackId="a" fill="#DC2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ChartCard({ title, type, height = 200, className = "" }: ChartCardProps) {
  return (
    <div
      className={`bg-white ${className}`}
      style={{ borderRadius: 8, padding: "14px 16px" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{title}</div>
        <div className="flex gap-1.5">
          {[{ icon: <Image size={11} />, label: "PNG" }, { icon: <FileText size={11} />, label: "PDF" }].map((b) => (
            <button
              key={b.label}
              style={{ height: 26, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 8px", fontSize: 10, color: "#6B7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }}>
        {renderChart(type, height)}
      </div>
    </div>
  );
}

export function RecipientChartCard({ title, which }: { title: string; which: "stacked" | "bar" }) {
  const h = 155;
  const recipientByCompany = [
    { name: "บ.ไทยอาวุธ", ทหาร: 120000, ตำรวจ: 45000, อื่นๆ: 12000, สนาม: 8000 },
    { name: "บ.ดีเฟนส์", ทหาร: 95000, ตำรวจ: 38000, อื่นๆ: 9000, สนาม: 6000 },
    { name: "บ.นาธาน", ทหาร: 60000, ตำรวจ: 25000, อื่นๆ: 7000, สนาม: 4000 },
  ];
  const rangeData = [
    { name: "ทหาร", value: 275000 },
    { name: "ตำรวจ", value: 108000 },
    { name: "สนามยิงปืน", value: 18000 },
  ];

  return (
    <div className="bg-white flex-1" style={{ borderRadius: 8, padding: "14px 16px" }}>
      <div className="flex items-center justify-between mb-3">
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{title}</div>
        <div className="flex gap-1.5">
          {["PNG", "PDF"].map((l) => (
            <button key={l} style={{ height: 26, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", padding: "0 8px", fontSize: 10, color: "#6B7280", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: h }}>
        {which === "stacked" ? (
          <ResponsiveContainer width="100%" height={h}>
            <BarChart data={recipientByCompany} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis key="x" dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis key="y" tick={{ fontSize: 9 }} />
              <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
              <Legend key="lg" wrapperStyle={{ fontSize: 10 }} />
              <Bar key="bar-mil" dataKey="ทหาร" name="ทหาร" stackId="a" fill="#2563EB" />
              <Bar key="bar-pol" dataKey="ตำรวจ" name="ตำรวจ" stackId="a" fill="#EA580C" />
              <Bar key="bar-oth" dataKey="อื่นๆ" name="อื่นๆ" stackId="a" fill="#6574FF" />
              <Bar key="bar-range" dataKey="สนาม" name="สนามยิงปืน" stackId="a" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={h}>
            <BarChart data={rangeData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis key="x" dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis key="y" tick={{ fontSize: 9 }} />
              <Tooltip key="tt" contentStyle={{ fontSize: 11 }} />
              <Bar key="bar" dataKey="value" name="จำนวน (นัด)" radius={[3, 3, 0, 0]}>
                {rangeData.map((entry, i) => <Cell key={`range-cell-${entry.name}`} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
