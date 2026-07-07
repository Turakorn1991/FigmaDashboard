import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, ChevronDown, X, Download, Copy, Check, ChevronLeft, ChevronRight, CalendarDays, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
import { Table, ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";
import {
  loadMoveRows, COMPANY_OPTIONS, WEAPON_OPTIONS, UNIT_OPTIONS, TRANSPORT_OPTIONS,
  WEAPON_CATEGORY_OPTIONS, REGION_OPTIONS, BUYER_UNIT_OPTIONS,
} from "../../data/moveLicense";
import type { MoveRow } from "../../data/moveLicense";

const PRIMARY = "#6574FF";
const FF = "'Noto Sans Thai', Inter, sans-serif";
const PALETTE = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#14B8A6", "#F97316"];

// ── DDL filter (เหมือนเมนู 1 "ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ") ──
const COMPANIES = COMPANY_OPTIONS;
const BUYER_GROUPS = [
  { id: "1", label: "ทหาร" },
  { id: "2", label: "สนามยิงปืนทหาร" },
  { id: "3", label: "ตำรวจ" },
  { id: "4", label: "สนามยิงปืนตำรวจ" },
  { id: "5", label: "ส่วนราชการตามกฎกระทรวง" },
  { id: "6", label: "รัฐวิสาหกิจตามกฎกระทรวง" },
  { id: "7", label: "ภาคเอกชน (สมาคม บริษัทฯ)" },
  { id: "9", label: "อื่น ๆ" },
  { id: "0", label: "ไม่ระบุ" },
];
const _BG_ASSIGN = ["1", "2", "3", "4", "5", "6", "7", "9"];
const _bgHash = (s: string) => { let n = 0; for (const c of s) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0; return n; };
const buyerUnitGroupId = (unit: string) => (!unit || unit === "-") ? "0" : _BG_ASSIGN[_bgHash(unit) % _BG_ASSIGN.length];
const REGIONS = REGION_OPTIONS.map((name) => ({ id: name, label: name }));
const WEAPONS = WEAPON_OPTIONS.map((w) => ({ id: w.id, label: w.name, category: w.category }));
const TRANSPORT_TYPES = TRANSPORT_OPTIONS;
const MOVE_CATEGORIES = [
  "ขนย้ายให้หน่วยงานตามมาตรา 7",
  "ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7",
  "ขนย้ายเพื่อทดสอบ",
  "ขนย้ายเพื่อจัดแสดง",
  "ขนย้ายกลับโรงงาน",
] as const;
const MOVE_CAT_SALE = "ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7";
const MOVE_CAT_NONSALE = ["ขนย้ายให้หน่วยงานตามมาตรา 7", "ขนย้ายเพื่อทดสอบ", "ขนย้ายเพื่อจัดแสดง", "ขนย้ายกลับโรงงาน"];
const SALE_TRANSPORTS = ["ขายขนย้ายในราชอาณาจักร", "ขายขนย้ายนอกราชอาณาจักร"];
const moveCategoryOf = (r: MoveRow) => SALE_TRANSPORTS.includes(r.transportType) ? MOVE_CAT_SALE : MOVE_CAT_NONSALE[r.id % MOVE_CAT_NONSALE.length];

/* ─── สถานะการขนย้าย (3 แบบ) ─────────────────────────── */
const STATUSES = ["รอดำเนินการ", "กำลังขนย้าย", "เสร็จสิ้นแล้ว"] as const;
type MoveStatus = typeof STATUSES[number];
const STATUS_COLOR: Record<MoveStatus, string> = {
  "รอดำเนินการ": "#9CA3AF",
  "กำลังขนย้าย": "#F59E0B",
  "เสร็จสิ้นแล้ว": "#10B981",
};
const STATUS_STYLE: Record<MoveStatus, { bg: string; color: string }> = {
  "รอดำเนินการ": { bg: "#F3F4F6", color: "#4B5563" },
  "กำลังขนย้าย": { bg: "#FFFBEB", color: "#D97706" },
  "เสร็จสิ้นแล้ว": { bg: "#ECFDF5", color: "#059669" },
};
// สถานะ deterministic จาก docNo (กระจาย ~รอ 40% / กำลัง 30% / เสร็จ 30%)
const hashStr = (s: string) => { let n = 0; for (const c of s) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0; return n; };
const STATUS_POOL: MoveStatus[] = ["รอดำเนินการ", "รอดำเนินการ", "รอดำเนินการ", "รอดำเนินการ", "กำลังขนย้าย", "กำลังขนย้าย", "กำลังขนย้าย", "เสร็จสิ้นแล้ว", "เสร็จสิ้นแล้ว", "เสร็จสิ้นแล้ว"];
const docStatus = (docNo: string): MoveStatus => STATUS_POOL[hashStr(docNo) % 10];

/* ─── สถานะหนังสืออนุญาต (เทียบวันหมดอายุ อ.10 กับวันนี้) ── */
const parseThaiDMY = (s: string): Date | null => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s ?? "").trim());
  if (!m) return null;
  const dt = new Date(+m[3] - 543, +m[2] - 1, +m[1]);
  return isNaN(dt.getTime()) ? null : dt;
};
const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const isExpiredTH = (expireTH: string): boolean => {
  const e = parseThaiDMY(expireTH);
  if (!e) return false; // ไม่ทราบวันหมดอายุ → ถือว่ายังไม่หมดอายุ
  return e < startOfToday();
};
const LICENSE_STATUS_OPTIONS = [
  { value: "valid",   label: "ยังไม่หมดอายุ" },
  { value: "expired", label: "หมดอายุ" },
];
const LIC_STATUS_STYLE: Record<"valid" | "expired", { bg: string; color: string; label: string }> = {
  valid:   { bg: "#ECFDF5", color: "#059669", label: "ยังไม่หมดอายุ" },
  expired: { bg: "#FEF2F2", color: "#DC2626", label: "หมดอายุ" },
};

const buyerGroupLabel = (unit: string) => BUYER_GROUPS.find((g) => g.id === buyerUnitGroupId(unit))?.label ?? "ไม่ระบุ";

// จำนวนขนย้ายจริง — อ้างอิงจากเมนู 2 "ยอดการขนย้าย/ส่งมอบ ตามแบบ อ.10" (สูตร transportQty เดียวกัน: floor(qty × (0.5 + (id % 5) × 0.1)))
const moveActualQty = (requested: number, id: number): number => Math.floor(requested * (0.5 + (id % 5) * 0.1));

interface WeaponItem { weaponCode: string; weaponName: string; weaponCategory: string; requested: number; actual: number; remaining: number; unit: string; }
interface DocRow {
  docNo: string; dateISO: string; dateTH: string; expireTH: string;
  companyId: string; company: string; status: MoveStatus; expired: boolean;
  transportType: string; moveCategory: string; buyerGroup: string; buyerUnit: string;
  items: WeaponItem[];
}
// จัดกลุ่ม MoveRow (รายบรรทัด) → หนังสืออนุญาต (ฉบับ) ตาม docNo — เก็บรายการอาวุธทุกบรรทัด
const buildDocs = (rows: MoveRow[]): DocRow[] => {
  const map = new Map<string, DocRow>();
  for (const r of rows) {
    if (!r.docNo) continue;
    let doc = map.get(r.docNo);
    if (!doc) {
      const status = docStatus(r.docNo);
      doc = {
        docNo: r.docNo, dateISO: r.dateISO, dateTH: r.dateTH, expireTH: r.expireTH,
        companyId: r.companyId, company: r.company, status,
        expired: isExpiredTH(r.expireTH),
        transportType: r.transportType, moveCategory: moveCategoryOf(r),
        buyerGroup: buyerGroupLabel(r.buyerUnit), buyerUnit: r.buyerUnit || "-",
        items: [],
      };
      map.set(r.docNo, doc);
    }
    const actual = moveActualQty(r.qty, r.id);
    doc.items.push({
      weaponCode: r.weaponCode, weaponName: r.weaponName, weaponCategory: r.weaponCategory,
      requested: r.qty, actual, remaining: Math.max(r.qty - actual, 0), unit: r.unit,
    });
  }
  return [...map.values()];
};

// กราฟครึ่งวงกลม (semicircle gauge) — ขนย้ายจริง เทียบ ขออนุญาต
function GaugeHalf({ requested, actual }: { requested: number; actual: number }) {
  const pct = requested > 0 ? Math.min(100, Math.round((actual / requested) * 100)) : 0;
  const data = [{ name: "actual", value: actual }, { name: "rest", value: Math.max(requested - actual, 0) }];
  const color = pct >= 100 ? "#10B981" : pct > 0 ? PRIMARY : "#9CA3AF";
  return (
    <div style={{ position: "relative", width: 180, height: 104 }}>
      <PieChart width={180} height={104}>
        <Pie data={data} cx={90} cy={92} startAngle={180} endAngle={0} innerRadius={54} outerRadius={80} dataKey="value" stroke="none" isAnimationActive={false}>
          <Cell fill={color} />
          <Cell fill="#EEF0F4" />
        </Pie>
      </PieChart>
      <div style={{ position: "absolute", top: 57, left: 0, width: "100%", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</div>
      </div>
    </div>
  );
}

const LBL: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const INPUT_H = 44;
const INPUT_RADIUS = 10;
const INPUT_BORDER = "1px solid #E5E7EB";
const SEL: React.CSSProperties = { width: "100%", height: INPUT_H, padding: "0 12px", fontSize: 13, border: INPUT_BORDER, borderRadius: INPUT_RADIUS, outline: "none", background: "#fff", color: "#374151", appearance: "none" };

/* ─── ThaiDatePicker ──────────────────────────────────── */
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_DAYS_SHORT = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function ThaiDatePicker({ value, onChange, placeholder = "วว/ดด/ปปปป" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => { const d = value ? new Date(value) : new Date(); return d.getFullYear(); });
  const [viewMonth, setViewMonth] = useState(() => { const d = value ? new Date(value) : new Date(); return d.getMonth(); });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayVal = (() => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear() + 543;
    return `${dd}/${mm}/${yy}`;
  })();

  const selectedDate = value ? new Date(value) : null;
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const selectDay = (day: number) => { onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`); setOpen(false); };
  const isSelected = (day: number) => !!selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button"
        onClick={() => { if (!open && value) { const d = new Date(value); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); } setOpen(o => !o); }}
        style={{ ...SEL, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", padding: "0 10px 0 12px" }}>
        <span style={{ color: displayVal ? "#374151" : "#9CA3AF", fontSize: 13 }}>{displayVal || placeholder}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {value && <X size={12} color="#9CA3AF" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onChange(""); }} />}
          <CalendarDays size={15} color="#9CA3AF" />
        </span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 16, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}><ChevronLeft size={16} color="#374151" /></button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{THAI_MONTHS[viewMonth]} {viewYear + 543}</span>
            <button type="button" onClick={nextMonth} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}><ChevronRight size={16} color="#374151" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {THAI_DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#6B7280", padding: "4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => day === null ? <div key={i} /> : (
              <button key={i} type="button" onClick={() => selectDay(day)}
                style={{ border: "none", cursor: "pointer", borderRadius: 6, padding: "6px 0", fontSize: 13, fontWeight: isSelected(day) ? 700 : 400,
                  background: isSelected(day) ? PRIMARY : "transparent",
                  color: isSelected(day) ? "#fff" : isToday(day) ? PRIMARY : "#374151",
                  outline: isToday(day) && !isSelected(day) ? `1.5px solid ${PRIMARY}` : "none" }}
                onMouseEnter={(e) => { if (!isSelected(day)) (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
                onMouseLeave={(e) => { if (!isSelected(day)) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>{day}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MultiSelect ─────────────────────────────────────── */
function MultiSelect({ placeholder, options, selected, onChange, showSearch = false }: {
  placeholder: string; options: { id: string; label: string }[];
  selected: string[]; onChange: (ids: string[]) => void; showSearch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(kw.toLowerCase()));
  const display = selected.length === 0 ? placeholder : selected.length === options.length ? "ทั้งหมด" : `เลือก ${selected.length} รายการ`;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{ width: "100%", height: INPUT_H, padding: "0 10px 0 14px", fontSize: 13, border: INPUT_BORDER, borderRadius: INPUT_RADIUS, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "#374151", boxSizing: "border-box" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{display}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 6 }}>
          {selected.length > 0 && (
            <span onClick={(e) => { e.stopPropagation(); onChange([]); setKw(""); }} style={{ display: "flex", cursor: "pointer" }}><X size={13} color="#9CA3AF" /></span>
          )}
          <ChevronDown size={15} color="#9CA3AF" />
        </div>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "100%", zIndex: 300, background: "#fff", border: INPUT_BORDER, borderRadius: INPUT_RADIUS, boxShadow: "0 8px 24px rgba(0,0,0,0.11)", maxHeight: 300, display: "flex", flexDirection: "column" }}>
          {showSearch && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #F3F4F6" }}>
              <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="ค้นหา..." autoFocus
                style={{ width: "100%", height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 7, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map((o) => {
              const sel = selected.includes(o.id);
              return (
                <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", background: sel ? "#F5F3FF" : "#fff", fontSize: 13 }}
                  onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLLabelElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLLabelElement).style.background = "#fff"; }}>
                  <input type="checkbox" checked={sel} onChange={() => onChange(sel ? selected.filter((x) => x !== o.id) : [...selected, o.id])} style={{ accentColor: PRIMARY }} />
                  <span style={{ color: sel ? PRIMARY : "#374151", fontWeight: sel ? 600 : 400 }}>{o.label}</span>
                </label>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div style={{ padding: "8px 10px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => { onChange([]); setKw(""); }} style={{ fontSize: 12, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>ล้างทั้งหมด</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── ThaiDateRangePicker (ช่วงวันที่ ปฏิทิน 2 เดือน) ─── */
function ThaiDateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const init = from ? new Date(from) : new Date();
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setHover(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const fmt = (isoStr: string) => { if (!isoStr) return ""; const d = new Date(isoStr); if (isNaN(d.getTime())) return ""; return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`; };
  const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };

  const selectDay = (dISO: string) => {
    if (!from || (from && to)) onChange(dISO, "");
    else if (dISO < from) onChange(dISO, "");
    else { onChange(from, dISO); setOpen(false); setHover(""); }
  };

  const inRange = (dISO: string) => {
    const end = to || hover;
    if (!from || !end) return false;
    const lo = from < end ? from : end, hi = from < end ? end : from;
    return dISO > lo && dISO < hi;
  };
  const isEndpoint = (dISO: string) => dISO === from || dISO === to;

  const navBtn: React.CSSProperties = { border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", color: "#6B7280", fontSize: 15, lineHeight: 1 };

  const renderMonth = (y: number, m: number) => {
    const firstDay = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);
    return (
      <div style={{ minWidth: 244 }}>
        <div style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 10 }}>{THAI_MONTHS[m]} {y + 543}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {THAI_DAYS_SHORT.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#6B7280", padding: "4px 0" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((day, i) => day === null ? <div key={i} /> : (() => {
            const dISO = iso(y, m, day);
            const ep = isEndpoint(dISO), rng = inRange(dISO);
            return (
              <button key={i} type="button" onClick={() => selectDay(dISO)}
                onMouseEnter={(e) => { if (from && !to) setHover(dISO); if (!ep && !rng) (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6"; }}
                onMouseLeave={(e) => { if (!ep && !rng) (e.currentTarget as HTMLButtonElement).style.background = rng ? "#EEF2FF" : "transparent"; }}
                style={{ border: "none", cursor: "pointer", borderRadius: 6, padding: "7px 0", fontSize: 13, fontWeight: ep ? 700 : 400,
                  background: ep ? PRIMARY : rng ? "#EEF2FF" : "transparent", color: ep ? "#fff" : "#374151" }}>{day}</button>
            );
          })())}
        </div>
      </div>
    );
  };

  const rightY = viewMonth === 11 ? viewYear + 1 : viewYear;
  const rightM = viewMonth === 11 ? 0 : viewMonth + 1;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ ...SEL, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", padding: "0 10px 0 12px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
          <span style={{ color: from ? "#374151" : "#9CA3AF" }}>{fmt(from) || "วันที่อนุญาตเริ่มต้น"}</span>
          <span style={{ color: "#9CA3AF" }}>→</span>
          <span style={{ color: to ? "#374151" : "#9CA3AF" }}>{fmt(to) || "วันที่สิ้นสุด"}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {(from || to) && <X size={12} color="#9CA3AF" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onChange("", ""); setHover(""); }} />}
          <CalendarDays size={15} color="#9CA3AF" />
        </span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 2 }}>
              <button type="button" onClick={() => setViewYear((y) => y - 1)} style={navBtn}>«</button>
              <button type="button" onClick={prevMonth} style={navBtn}><ChevronLeft size={16} color="#374151" /></button>
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              <button type="button" onClick={nextMonth} style={navBtn}><ChevronRight size={16} color="#374151" /></button>
              <button type="button" onClick={() => setViewYear((y) => y + 1)} style={navBtn}>»</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {renderMonth(viewYear, viewMonth)}
            {renderMonth(rightY, rightM)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SelectField ─────────────────────────────────────── */
function SelectField({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void;
  placeholder: string; options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const filtered = options.filter((o) => o.label.toLowerCase().includes(kw.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setKw(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen((p) => !p)}
        style={{ ...SEL, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", color: value ? "#111827" : "#374151" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedLabel || placeholder}</span>
        <ChevronDown size={15} color="#9CA3AF" style={{ flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "8px 8px 4px" }}>
            <input autoFocus value={kw} onChange={(e) => setKw(e.target.value)} placeholder="ค้นหา..."
              style={{ width: "100%", height: 32, padding: "0 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 6, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            <div onClick={() => { onChange(""); setOpen(false); setKw(""); }}
              style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", color: "#9CA3AF", background: value === "" ? "#F5F3FF" : "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = value === "" ? "#F5F3FF" : "transparent"; }}>
              {placeholder}
            </div>
            {filtered.map((o) => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setKw(""); }}
                style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", background: value === o.value ? "#F5F3FF" : "transparent", color: value === o.value ? "#6574FF" : "#111827", fontWeight: value === o.value ? 600 : 400 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F5F3FF"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = value === o.value ? "#F5F3FF" : "transparent"; }}>
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: "8px 12px", fontSize: 13, color: "#9CA3AF" }}>ไม่พบข้อมูล</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Custom Y tick (truncate long company names) ─────── */
const CompanyTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const v = payload?.value ?? "";
  const text = v.length > 26 ? v.slice(0, 25) + "…" : v;
  return <text x={x} y={y} dy={4} textAnchor="end" fill="#374151" fontSize={11}>{text}</text>;
};

/* ─── Main component ─────────────────────────────────── */
export function Page4Recipients() {
  const [f_dateFrom,    setDateFrom]    = useState("");
  const [f_dateTo,      setDateTo]      = useState("");
  const [f_companies,   setCompanies]   = useState<string[]>([]);
  const [f_weaponType,  setWeaponType]  = useState("");
  const [f_unit,        setUnit]        = useState("");
  const [f_weapons,     setWeapons]     = useState<string[]>([]);
  const [f_region,      setRegion]      = useState("");
  const [f_provinces,   setProvinces]   = useState<string[]>([]);
  const [f_buyers,         setBuyers]         = useState<string[]>([]);
  const [f_buyerUnits,     setBuyerUnits]     = useState<string[]>([]);
  const [f_transportTypes, setTransportTypes] = useState<string[]>([]);
  const [f_moveCategories, setMoveCategories] = useState<string[]>([]);
  const [f_licenseStatus,  setLicenseStatus]  = useState("");
  const [a, setA] = useState({ dateFrom: "", dateTo: "", companies: [] as string[], weaponType: "", unit: "", region: "", provinces: [] as string[], buyers: [] as string[], buyerUnits: [] as string[], weapons: [] as string[], transportTypes: [] as string[], moveCategories: [] as string[], licenseStatus: "" });
  const [searched, setSearched] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [detailDoc, setDetailDoc] = useState<DocRow | null>(null);

  /* โหลดข้อมูลจริง (async) — เก็บ row ดิบไว้ แล้วค่อยกรอง+จัดกลุ่มเป็นหนังสืออนุญาต (ฉบับ) */
  const [ALL_ROWS, setRows] = useState<MoveRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    loadMoveRows().then((rows) => { if (alive) { setRows(rows); setDataLoading(false); } });
    return () => { alive = false; };
  }, []);

  const handleSearch = () => { setA({ dateFrom: f_dateFrom, dateTo: f_dateTo, companies: f_companies, weaponType: f_weaponType, unit: f_unit, region: f_region, provinces: f_provinces, buyers: f_buyers, buyerUnits: f_buyerUnits, weapons: f_weapons, transportTypes: f_transportTypes, moveCategories: f_moveCategories, licenseStatus: f_licenseStatus }); setSearched(true); setTablePage(1); };
  const handleReset  = () => {
    setDateFrom(""); setDateTo(""); setCompanies([]); setWeaponType(""); setUnit(""); setWeapons([]);
    setRegion(""); setProvinces([]); setBuyers([]); setBuyerUnits([]); setTransportTypes([]); setMoveCategories([]); setLicenseStatus("");
    setA({ dateFrom: "", dateTo: "", companies: [], weaponType: "", unit: "", region: "", provinces: [], buyers: [], buyerUnits: [], weapons: [], transportTypes: [], moveCategories: [], licenseStatus: "" });
    setSearched(false);
  };

  /* chart capture */
  const statusBarRef = useRef<HTMLDivElement>(null);
  const companyBarRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [copiedC, setCopiedC] = useState(false);

  /* chart interaction (ลูกเล่น) */
  const [activeSeries, setActiveSeries] = useState<MoveStatus | undefined>(undefined);
  const [hiddenSeries, setHiddenSeries] = useState<Set<MoveStatus>>(new Set());
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [lockedPieIndex, setLockedPieIndex] = useState<number | undefined>(undefined);
  const [hiddenPieStatus, setHiddenPieStatus] = useState<Set<MoveStatus>>(new Set());
  const [activeCompanyIndex, setActiveCompanyIndex] = useState<number | undefined>(undefined);
  const [hiddenCompanies, setHiddenCompanies] = useState<Set<string>>(new Set());
  const toggleSet = <T,>(set: Set<T>, v: T): Set<T> => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n; };

  const captureChart = async (ref: React.RefObject<HTMLDivElement>, fn: (el: HTMLDivElement) => Promise<void>) => {
    const el = ref.current; if (!el) return;
    const hidden = el.querySelectorAll<HTMLElement>("[data-capture-hide]");
    hidden.forEach((n) => { n.dataset.origDisplay = n.style.display; n.style.display = "none"; });
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await fn(el);
    hidden.forEach((n) => { n.style.display = n.dataset.origDisplay ?? ""; });
  };
  const downloadPNG = (ref: React.RefObject<HTMLDivElement>, filename: string) =>
    captureChart(ref, async (el) => {
      const { toPng } = await import("html-to-image");
      const url = await toPng(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    });
  const copyPNG = (ref: React.RefObject<HTMLDivElement>, setCopied: (v: boolean) => void) =>
    captureChart(ref, async (el) => {
      try {
        const { toBlob } = await import("html-to-image");
        const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      } catch (e) { console.error("copy failed", e); }
    });

  /* กรองที่ระดับ row (เหมือนเมนู 1) แล้วจัดกลุ่มเป็นหนังสืออนุญาต — เอกสารจะแสดงถ้ามี row ที่ผ่าน filter อย่างน้อย 1 */
  const filterRow = (r: MoveRow) => {
    if (a.companies.length && !a.companies.includes(r.companyId)) return false;
    if (a.transportTypes.length && !a.transportTypes.includes(r.transportType)) return false;
    if (a.moveCategories.length && !a.moveCategories.includes(moveCategoryOf(r))) return false;
    if (a.region && r.region !== a.region) return false;
    if (a.provinces.length && !a.provinces.includes(r.dstProvince)) return false;
    if (a.buyers.length && !a.buyers.includes(buyerUnitGroupId(r.buyerUnit))) return false;
    if (a.buyerUnits.length && !a.buyerUnits.includes(r.buyerUnit)) return false;
    if (a.unit && r.unit !== a.unit) return false;
    if (a.dateFrom && r.dateISO && r.dateISO < a.dateFrom) return false;
    if (a.dateTo && r.dateISO && r.dateISO > a.dateTo) return false;
    if (a.licenseStatus === "expired" && !isExpiredTH(r.expireTH)) return false;
    if (a.licenseStatus === "valid" && isExpiredTH(r.expireTH)) return false;
    if (a.weapons.length) {
      if (!a.weapons.includes(r.weaponCode)) return false;
    } else if (a.weaponType && r.weaponCategory !== a.weaponType) {
      return false;
    }
    return true;
  };
  const docs = !searched ? [] : buildDocs(ALL_ROWS.filter(filterRow));

  /* DDL options ที่ผูกกัน (ภาค→จังหวัด, กลุ่ม→หน่วยผู้ซื้อ, ประเภทอาวุธ→อาวุธ) */
  const filteredWeaponOptions = f_weaponType ? WEAPONS.filter((w) => w.category === f_weaponType) : [];
  const buyerUnitOptions = BUYER_UNIT_OPTIONS
    .filter((u) => f_buyers.length === 0 || f_buyers.includes(buyerUnitGroupId(u.name)))
    .map((u) => ({ id: u.name, label: u.name }));
  const provinceOptions = [...new Map(
    ALL_ROWS
      .filter((r) => r.dstProvince && (!f_region || r.region === f_region))
      .map((r) => [r.dstProvince, { id: r.dstProvince, label: r.dstProvince }])
  ).values()].sort((x, y) => x.label.localeCompare(y.label, "th"));

  const totalDocs = docs.length;
  const visibleStatuses = STATUSES.filter((s) => !hiddenSeries.has(s));

  /* chart 1 — grouped by company × status */
  const companyOrder: { id: string; name: string }[] = [];
  const cMap: Record<string, { id: string; name: string; "รอดำเนินการ": number; "กำลังขนย้าย": number; "เสร็จสิ้นแล้ว": number; total: number }> = {};
  docs.forEach((d) => {
    if (!cMap[d.companyId]) { cMap[d.companyId] = { id: d.companyId, name: d.company, "รอดำเนินการ": 0, "กำลังขนย้าย": 0, "เสร็จสิ้นแล้ว": 0, total: 0 }; companyOrder.push({ id: d.companyId, name: d.company }); }
    cMap[d.companyId][d.status] += 1;
    cMap[d.companyId].total += 1;
  });
  const companyStatusData = companyOrder.map((c) => cMap[c.id]).sort((a, b) => b.total - a.total);
  const companyColor: Record<string, string> = {};
  companyStatusData.forEach((d, i) => { companyColor[d.id] = PALETTE[i % PALETTE.length]; });
  // ยอดรวมกราฟ 1 = นับเฉพาะสถานะที่แสดงอยู่
  const statusBarTotal = docs.filter((d) => !hiddenSeries.has(d.status)).length;

  /* chart 2 — total docs by company (ซ่อนบริษัทได้) */
  const companyTotalData = companyStatusData.filter((d) => !hiddenCompanies.has(d.id)).map((d) => ({ id: d.id, name: d.name, value: d.total }));
  const companyBarTotal = companyTotalData.reduce((s, d) => s + d.value, 0);

  /* chart 3 — total docs by status (pie, ซ่อนสถานะได้) */
  const statusPieAll = STATUSES.map((s) => ({ name: s, value: docs.filter((d) => d.status === s).length, color: STATUS_COLOR[s] }));
  const statusPieData = statusPieAll.map((d) => ({ ...d, value: hiddenPieStatus.has(d.name) ? 0 : d.value }));
  const pieTotal = statusPieData.reduce((s, d) => s + d.value, 0);

  /* active pie shape — โชว์ชื่อ/จำนวน/% ตรงกลางโดนัท */
  const renderActiveShape = (props: Record<string, number & string>) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const pct = pieTotal > 0 ? ((value / pieTotal) * 100).toFixed(1) : "0.0";
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#0E1119" fontSize={13} fontWeight={700}>{payload.name}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={PRIMARY} fontSize={15} fontWeight={700}>{value.toLocaleString()} ฉบับ</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#8B8E95" fontSize={11}>{pct}%</text>
      </g>
    );
  };

  /* toggle chips (reusable) */
  const Chips = ({ items, hidden, onToggle, onReset, label }: { items: { id: string; name: string; color: string }[]; hidden: Set<string>; onToggle: (id: string) => void; onReset: () => void; label: string }) => (
    <div data-capture-hide style={{ marginTop: 12, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        {hidden.size > 0 && <button onClick={onReset} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((it) => {
          const h = hidden.has(it.id);
          return (
            <button key={it.id} onClick={() => onToggle(it.id)}
              style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${h ? "#E5E7EB" : it.color}`, background: h ? "#F9FAFB" : it.color + "22", color: h ? "#9CA3AF" : it.color, cursor: "pointer", fontWeight: 500, textDecoration: h ? "line-through" : "none", transition: "all 0.15s" }}>
              {it.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* table */
  const tableData = docs.map((d, i) => ({ ...d, key: d.docNo + "-" + i }));
  type TableRow = (typeof tableData)[0];

  const getColSearchProps = (dataIndex: keyof TableRow, placeholder: string): Partial<TableColumnsType<TableRow>[0]> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <input placeholder={`ค้นหา ${placeholder}`} value={selectedKeys[0] as string ?? ""}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])} onPressEnter={() => confirm()}
          style={{ height: 32, padding: "0 10px", fontSize: 13, border: "1px solid #C7D2FE", borderRadius: 6, outline: "none", width: 220 }} autoFocus />
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => confirm()} style={{ flex: 1, height: 30, background: PRIMARY, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>ค้นหา</button>
          <button onClick={() => { clearFilters?.(); confirm(); }} style={{ flex: 1, height: 30, background: "#F9FAFB", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#6B7280" }}>รีเซ็ต</button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => <Search size={13} color={filtered ? PRIMARY : "#C0C4CC"} />,
    onFilter: (value, record) => String(record[dataIndex]).toLowerCase().includes(String(value).toLowerCase()),
  });

  const antColumns: TableColumnsType<TableRow> = [
    { title: "#", key: "no", width: 56, fixed: "left" as const, align: "center" as const, render: (_: unknown, __: TableRow, i: number) => (tablePage - 1) * tablePageSize + i + 1 },
    { title: "หนังสืออนุญาต อ.10", dataIndex: "docNo", key: "docNo", width: 160, ...getColSearchProps("docNo", "หนังสืออนุญาต"), render: (v: string, record: TableRow) => <button onClick={() => setDetailDoc(record)} style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 13, color: PRIMARY, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>{v}</button> },
    { title: "วันที่อนุญาต อ.10", dataIndex: "dateTH", key: "dateTH", width: 140, sorter: (a, b) => a.dateISO.localeCompare(b.dateISO) },
    { title: "วันที่หมดอายุ อ.10", dataIndex: "expireTH", key: "expireTH", width: 140 },
    { title: "ประเภทขนย้าย", dataIndex: "transportType", key: "transportType", width: 180, ...getColSearchProps("transportType", "ประเภทขนย้าย") },
    { title: "ประเภทการขนย้าย", dataIndex: "moveCategory", key: "moveCategory", width: 240, ...getColSearchProps("moveCategory", "ประเภทการขนย้าย") },
    { title: "ผู้ประกอบการ", dataIndex: "company", key: "company", width: 240, sorter: (a, b) => a.company.localeCompare(b.company, "th"), ...getColSearchProps("company", "ผู้ประกอบการ") },
    { title: "กลุ่มหน่วยผู้ซื้อ", dataIndex: "buyerGroup", key: "buyerGroup", width: 180, ...getColSearchProps("buyerGroup", "กลุ่มหน่วยผู้ซื้อ") },
    { title: "หน่วยผู้ซื้อ", dataIndex: "buyerUnit", key: "buyerUnit", width: 200, ...getColSearchProps("buyerUnit", "หน่วยผู้ซื้อ") },
    { title: "สถานะหนังสืออนุญาต", dataIndex: "expired", key: "expired", width: 170, align: "center" as const,
      filters: [{ text: "ยังไม่หมดอายุ", value: false }, { text: "หมดอายุ", value: true }],
      onFilter: (value, record) => record.expired === value,
      render: (v: boolean) => {
        const st = LIC_STATUS_STYLE[v ? "expired" : "valid"];
        return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 24, padding: "0 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{st.label}</span>;
      },
    },
    { title: "สถานะการขนย้าย", dataIndex: "status", key: "status", width: 170, align: "center" as const,
      filters: STATUSES.map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
      render: (v: MoveStatus) => {
        const st = STATUS_STYLE[v];
        return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 24, padding: "0 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{v}</span>;
      },
    },
  ];

  const antTableProps: TableProps<TableRow> = {
    columns: antColumns,
    dataSource: tableData,
    size: "middle",
    pagination: { current: tablePage, pageSize: tablePageSize, showSizeChanger: true, pageSizeOptions: ["10","20","50"], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, locale: { items_per_page: "/หน้า", jump_to: "ไปที่", page: "หน้า" }, onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); } },
    scroll: { x: 1876 },
  };

  const exportExcel = () => {
    const data = docs.map((d, i) => ({
      "#": i + 1, "หนังสืออนุญาต อ.10": d.docNo, "วันที่อนุญาต อ.10": d.dateTH, "วันที่หมดอายุ อ.10": d.expireTH,
      "ประเภทขนย้าย": d.transportType, "ประเภทการขนย้าย": d.moveCategory, "ผู้ประกอบการ": d.company,
      "กลุ่มหน่วยผู้ซื้อ": d.buyerGroup, "หน่วยผู้ซื้อ": d.buyerUnit,
      "สถานะหนังสืออนุญาต": d.expired ? "หมดอายุ" : "ยังไม่หมดอายุ", "สถานะการขนย้าย": d.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 5 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 32 }, { wch: 40 }, { wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สถานะการขนย้าย");
    const d = new Date(); const p = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`;
    XLSX.writeFile(wb, `ติดตามสถานะการขนย้ายตามหนังสืออนุญาตขนย้ายอาวุธ_${stamp}.xlsx`);
  };

  const chartBtn = (onClick: () => void, copied: boolean, isCopy: boolean) => (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: isCopy && copied ? "#059669" : "#6B7280", cursor: "pointer" }}>
      {isCopy ? (copied ? <Check size={12} /> : <Copy size={12} />) : <Download size={12} />}{isCopy ? (copied ? "คัดลอกแล้ว" : "Copy") : "PNG"}
    </button>
  );

  return (
    <div style={{ fontFamily: FF }}>
      {/* Header */}
      <div style={{ fontSize: 12, color: "#8B8E95", marginBottom: 4 }}>ระบบ Dashboard / Dashboard</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>ติดตามสถานะการขนย้ายตามหนังสืออนุญาตขนย้ายอาวุธ</div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 16 }}>ค้นหาข้อมูล</div>

        {/* Row 1: ช่วงวันที่อนุญาต | ประเภทขนย้าย | ประเภทการขนย้าย */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>ช่วงวันที่อนุญาต</label>
            <ThaiDateRangePicker from={f_dateFrom} to={f_dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to); }} />
          </div>
          <div>
            <label style={LBL}>ประเภทขนย้าย</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={TRANSPORT_TYPES.map((t) => ({ id: t, label: t }))}
              selected={f_transportTypes} onChange={setTransportTypes} />
          </div>
          <div>
            <label style={LBL}>ประเภทการขนย้าย</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={MOVE_CATEGORIES.map((t) => ({ id: t, label: t }))}
              selected={f_moveCategories} onChange={setMoveCategories} showSearch />
          </div>
        </div>

        {/* Row 2: ผู้ประกอบการ | ภาค | จังหวัด */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>ผู้ประกอบการ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={COMPANIES.map((c) => ({ id: c.id, label: c.name }))}
              selected={f_companies} onChange={setCompanies} showSearch />
          </div>
          <div>
            <label style={LBL}>ภาค(ผู้รับปลายทาง)</label>
            <SelectField value={f_region} onChange={(v) => { setRegion(v); setProvinces([]); }} placeholder="ทั้งหมด"
              options={REGIONS.map((r) => ({ value: r.id, label: r.label }))} />
          </div>
          <div>
            <label style={LBL}>จังหวัด(ผู้รับปลายทาง)</label>
            <MultiSelect placeholder="ทั้งหมด" options={provinceOptions} selected={f_provinces} onChange={setProvinces} showSearch />
          </div>
        </div>

        {/* Row 3: กลุ่มหน่วยผู้ซื้อ(ผู้รับปลายทาง) 1/3 | หน่วยผู้ซื้อ(ผู้รับปลายทาง) 2/3 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>กลุ่มหน่วยผู้ซื้อ(ผู้รับปลายทาง)</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={BUYER_GROUPS.map((b) => ({ id: b.id, label: b.label }))}
              selected={f_buyers} onChange={(v) => { setBuyers(v); setBuyerUnits([]); }} showSearch />
          </div>
          <div>
            <label style={LBL}>หน่วยผู้ซื้อ(ผู้รับปลายทาง)</label>
            <MultiSelect placeholder="ทั้งหมด" options={buyerUnitOptions} selected={f_buyerUnits} onChange={setBuyerUnits} showSearch />
          </div>
        </div>

        {/* Row 4: ประเภทอาวุธ * | หน่วยนับ * | อาวุธ (1/3 เท่ากัน) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
          <div>
            <label style={LBL}>ประเภทอาวุธ</label>
            <SelectField value={f_weaponType} onChange={(v) => { setWeaponType(v); setWeapons([]); if (v === "กระสุน") setUnit("นัด"); }} placeholder="เลือกประเภท"
              options={WEAPON_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} />
          </div>
          <div>
            <label style={LBL}>หน่วยนับ</label>
            <SelectField value={f_unit} onChange={(v) => { setUnit(v); setWeapons([]); }} placeholder="เลือกหน่วยนับ"
              options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} />
          </div>
          <div>
            <label style={LBL}>อาวุธ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={filteredWeaponOptions} selected={f_weapons} onChange={setWeapons} showSearch />
          </div>
        </div>

        {/* Row 5: สถานะหนังสืออนุญาต */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={LBL}>สถานะหนังสืออนุญาต</label>
            <SelectField value={f_licenseStatus} onChange={setLicenseStatus} placeholder="ทั้งหมด"
              options={LICENSE_STATUS_OPTIONS} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={handleReset}
            style={{ height: 40, padding: "0 20px", fontSize: 13, border: `1.5px solid ${PRIMARY}`, borderRadius: 8, background: "#fff", color: PRIMARY, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
            รีเซ็ต
          </button>
          <button onClick={handleSearch} disabled={dataLoading}
            title={dataLoading ? "กำลังโหลดข้อมูล..." : ""}
            style={{ width: 40, height: 40, borderRadius: 8, background: dataLoading ? "#D1D5DB" : PRIMARY, border: "none", cursor: dataLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (!dataLoading) (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
            onMouseLeave={(e) => { if (!dataLoading) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
            <Search size={17} color="#fff" />
          </button>
        </div>
      </div>

      {/* Chart row 1 — grouped horizontal bar (status by company) */}
      <div ref={statusBarRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>สถานะการขนย้ายตามหนังสืออนุญาตขนย้าย</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการ (ฉบับ)</div>
          </div>
          <div data-capture-hide style={{ display: "flex", gap: 6 }}>
            {chartBtn(() => copyPNG(statusBarRef, setCopiedA), copiedA, true)}
            {chartBtn(() => downloadPNG(statusBarRef, "chart-status-by-company.png"), false, false)}
          </div>
        </div>
        {companyStatusData.length === 0 ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
        ) : (
          <>
          <ResponsiveContainer width="100%" height={Math.max(companyStatusData.length * 108, 180)}>
            <BarChart data={companyStatusData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={230} tick={<CompanyTick />} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#F5F3FF" }} formatter={(v: number, n: string) => [`${v.toLocaleString()} ฉบับ`, n]} />
              {visibleStatuses.map((s) => (
                <Bar key={s} dataKey={s} fill={STATUS_COLOR[s]} radius={[0, 4, 4, 0]} maxBarSize={26}
                  fillOpacity={activeSeries === undefined || activeSeries === s ? 1 : 0.25}
                  onMouseEnter={() => setActiveSeries(s)} onMouseLeave={() => setActiveSeries(undefined)}
                  label={{ position: "right", fontSize: 10, fill: "#6B7280", formatter: (v: number) => (v > 0 ? v : "") }} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{statusBarTotal.toLocaleString()} ฉบับ</span>
          </div>
          <Chips items={STATUSES.map((s) => ({ id: s, name: s, color: STATUS_COLOR[s] }))} hidden={hiddenSeries as Set<string>}
            onToggle={(id) => setHiddenSeries((prev) => toggleSet(prev, id as MoveStatus))} onReset={() => setHiddenSeries(new Set())} label="แสดง/ซ่อน สถานะ" />
          </>
        )}
      </div>

      {/* Chart row 2 — company total bar (left, 8) + pie (right, 4) */}
      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: 16, marginBottom: 16 }}>
        {/* Bar: total docs by company */}
        <div ref={companyBarRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>จำนวนหนังสืออนุญาตทั้งหมด</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการ (ฉบับ)</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              {chartBtn(() => copyPNG(companyBarRef, setCopiedB), copiedB, true)}
              {chartBtn(() => downloadPNG(companyBarRef, "chart-company-total.png"), false, false)}
            </div>
          </div>
          {docs.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
          ) : (
            <>
            <ResponsiveContainer width="100%" height={Math.max(companyTotalData.length * 44, 140)}>
              <BarChart data={companyTotalData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={230} tick={<CompanyTick />} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F5F3FF" }} formatter={(v: number) => [`${v.toLocaleString()} ฉบับ`, "จำนวน"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}
                  onMouseEnter={(_: unknown, i: number) => setActiveCompanyIndex(i)} onMouseLeave={() => setActiveCompanyIndex(undefined)}
                  label={{ position: "right", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}>
                  {companyTotalData.map((d, i) => <Cell key={i} fill={companyColor[d.id]} opacity={activeCompanyIndex === undefined || activeCompanyIndex === i ? 1 : 0.35} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{companyBarTotal.toLocaleString()} ฉบับ</span>
            </div>
            <Chips items={companyStatusData.map((d) => ({ id: d.id, name: d.name, color: companyColor[d.id] }))} hidden={hiddenCompanies}
              onToggle={(id) => setHiddenCompanies((prev) => toggleSet(prev, id))} onReset={() => setHiddenCompanies(new Set())} label="แสดง/ซ่อน ผู้ประกอบการ" />
            </>
          )}
        </div>

        {/* Pie: total docs by status */}
        <div ref={pieRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>จำนวนหนังสืออนุญาตทั้งหมด</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามสถานะการขนย้าย (ฉบับ)</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              {chartBtn(() => copyPNG(pieRef, setCopiedC), copiedC, true)}
              {chartBtn(() => downloadPNG(pieRef, "chart-status-pie.png"), false, false)}
            </div>
          </div>
          {docs.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={56} outerRadius={92} paddingAngle={3} dataKey="value"
                    activeIndex={lockedPieIndex ?? activePieIndex}
                    activeShape={renderActiveShape as Parameters<typeof Pie>[0]["activeShape"]}
                    onMouseEnter={(_: unknown, i: number) => { if (lockedPieIndex === undefined) setActivePieIndex(i); }}
                    onMouseLeave={() => { if (lockedPieIndex === undefined) setActivePieIndex(undefined); }}
                    onClick={(_: unknown, i: number) => { setLockedPieIndex((prev) => prev === i ? undefined : i); setActivePieIndex(undefined); }}
                    cursor="pointer">
                    {statusPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString()} ฉบับ`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {statusPieAll.map((d) => {
                  const hidden = hiddenPieStatus.has(d.name);
                  const shown = hidden ? 0 : d.value;
                  const pct = pieTotal > 0 ? ((shown / pieTotal) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px", opacity: hidden ? 0.45 : 1 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#374151", flex: 1, textDecoration: hidden ? "line-through" : "none" }}>{d.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1119" }}>{d.value.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "#8B8E95", width: 44, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{pieTotal.toLocaleString()} ฉบับ</span>
                </div>
              </div>
              <Chips items={STATUSES.map((s) => ({ id: s, name: s, color: STATUS_COLOR[s] }))} hidden={hiddenPieStatus as Set<string>}
                onToggle={(id) => setHiddenPieStatus((prev) => toggleSet(prev, id as MoveStatus))} onReset={() => setHiddenPieStatus(new Set())} label="แสดง/ซ่อน สถานะ" />
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการหนังสืออนุญาตขนย้ายและสถานะ</span>
          <button onClick={exportExcel}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", fontSize: 13, border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
            <FileSpreadsheet size={15} color="#059669" />Export ข้อมูล (Excel)
          </button>
        </div>
        <ConfigProvider theme={{ token: { colorPrimary: PRIMARY, fontFamily: FF, fontSize: 13 } }}>
          <Table {...antTableProps} style={{ fontFamily: FF }} />
        </ConfigProvider>
      </div>

      {/* Detail Modal — รายละเอียดหนังสืออนุญาต อ.10 */}
      {detailDoc && (
        <div onClick={() => setDetailDoc(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 720, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden", fontFamily: FF }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", borderBottom: "1px solid #F0F0F0" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={20} color={PRIMARY} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0E1119" }}>รายละเอียดหนังสืออนุญาต อ.10</div>
                <div style={{ fontSize: 12, color: "#8B8E95", fontFamily: "monospace", marginTop: 2 }}>{detailDoc.docNo}</div>
              </div>
              <button onClick={() => setDetailDoc(null)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#F3F4F6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={17} color="#6B7280" />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 22, maxHeight: "70vh", overflowY: "auto" }}>
              {/* Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 20 }}>
                {[
                  { l: "เลขที่หนังสือ อ.10", v: detailDoc.docNo },
                  { l: "ผู้ประกอบการ", v: detailDoc.company },
                  { l: "วันที่อนุญาต อ.10", v: detailDoc.dateTH },
                  { l: "วันที่หมดอายุ อ.10", v: detailDoc.expireTH },
                ].map((m) => (
                  <div key={m.l}>
                    <div style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, marginBottom: 2 }}>{m.l}</div>
                    <div style={{ fontSize: 13, color: "#0E1119", fontWeight: 500 }}>{m.v}</div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, marginBottom: 4 }}>สถานะหนังสืออนุญาต</div>
                  <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: LIC_STATUS_STYLE[detailDoc.expired ? "expired" : "valid"].bg, color: LIC_STATUS_STYLE[detailDoc.expired ? "expired" : "valid"].color }}>{LIC_STATUS_STYLE[detailDoc.expired ? "expired" : "valid"].label}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, marginBottom: 4 }}>สถานะการขนย้าย</div>
                  <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_STYLE[detailDoc.status].bg, color: STATUS_STYLE[detailDoc.status].color }}>{detailDoc.status}</span>
                </div>
              </div>

              {/* Block: อาวุธหรือวัตถุที่ขนย้าย */}
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                อาวุธหรือวัตถุที่ขนย้าย
                <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, background: "#EEF2FF", borderRadius: 20, padding: "1px 10px" }}>{detailDoc.items.length} รายการ</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {detailDoc.items.map((it, i) => (
                  <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0E1119" }}>{it.weaponName}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{it.weaponCategory} · <span style={{ fontFamily: "monospace" }}>{it.weaponCode}</span></div>
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "#6B7280" }}>จำนวนขออนุญาต</span>
                          <span style={{ fontWeight: 600, color: "#0E1119" }}>{it.requested.toLocaleString()} {it.unit}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "#6B7280" }}>จำนวนขนย้ายจริง</span>
                          <span style={{ fontWeight: 600, color: PRIMARY }}>{it.actual.toLocaleString()} {it.unit}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px dashed #E5E7EB", paddingTop: 6 }}>
                          <span style={{ color: "#6B7280" }}>ยอดคงเหลือ</span>
                          <span style={{ fontWeight: 700, color: it.remaining > 0 ? "#D97706" : "#059669" }}>{it.remaining.toLocaleString()} {it.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <GaugeHalf requested={it.requested} actual={it.actual} />
                      <div style={{ fontSize: 11, color: "#8B8E95", marginTop: -4 }}>ขนย้ายจริง / ขออนุญาต</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
