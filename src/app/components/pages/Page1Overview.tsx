import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, FileText, ChevronDown, X, Download, Copy, Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
import { Table, ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";
import {
  loadMoveRows, COMPANY_OPTIONS, WEAPON_OPTIONS, UNIT_OPTIONS, TRANSPORT_OPTIONS,
  WEAPON_CATEGORY_OPTIONS, REGION_OPTIONS, BUYER_GROUP_OPTIONS, BUYER_UNIT_OPTIONS,
} from "../../data/moveLicense";
import type { MoveRow } from "../../data/moveLicense";

const PRIMARY = "#6574FF";
const FF = "'Noto Sans Thai', Inter, sans-serif";
const PALETTE = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#14B8A6", "#F97316"];

// ── DDL ทั้งหมดมาจากข้อมูลจริง (docs/export_move_license.xlsx) ──
const COMPANIES = COMPANY_OPTIONS;
// กลุ่มหน่วยผู้ซื้อ(ผู้รับปลายทาง) — DDL (mock)
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
// map หน่วยผู้ซื้อ → กลุ่ม (deterministic) เพื่อให้ relate กัน + กระจายครบทุกกลุ่ม
const _BG_ASSIGN = ["1", "2", "3", "4", "5", "6", "7", "9"];
const _bgHash = (s: string) => { let n = 0; for (const c of s) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0; return n; };
const buyerUnitGroupId = (unit: string) => (!unit || unit === "-") ? "0" : _BG_ASSIGN[_bgHash(unit) % _BG_ASSIGN.length];
const buyerGroupLabel = (id: string) => BUYER_GROUPS.find((g) => g.id === id)?.label ?? id;
const REGIONS = REGION_OPTIONS.map((name) => ({ id: name, label: name }));
const WEAPONS = WEAPON_OPTIONS.map((w) => ({ id: w.id, label: w.name, category: w.category }));

const TRANSPORT_TYPES = TRANSPORT_OPTIONS;
type TransportType = string;

const PURCHASE_DOCS = ["หนังสือขอซื้อ", "ใบสั่งซื้อ", "สัญญาซื้อขายรัฐ", "ไม่ระบุ"] as const;
type PurchaseDoc = typeof PURCHASE_DOCS[number];

// ประเภทการขนย้าย (DDL)
const MOVE_CATEGORIES = [
  "ขนย้ายให้หน่วยงานตามมาตรา 7",
  "ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7",
  "ขนย้ายเพื่อทดสอบ",
  "ขนย้ายเพื่อจัดแสดง",
  "ขนย้ายกลับโรงงาน",
] as const;
// map: ประเภทขนย้าย = "ขายขนย้าย..." → ประเภทการขนย้าย เป็น "ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7" เท่านั้น
const MOVE_CAT_SALE = "ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7";
const MOVE_CAT_NONSALE = ["ขนย้ายให้หน่วยงานตามมาตรา 7", "ขนย้ายเพื่อทดสอบ", "ขนย้ายเพื่อจัดแสดง", "ขนย้ายกลับโรงงาน"];
const SALE_TRANSPORTS = ["ขายขนย้ายในราชอาณาจักร", "ขายขนย้ายนอกราชอาณาจักร"];
// สัดส่วน "จำนวนขนย้ายจริง" เทียบยอดที่ได้รับอนุญาต (≤ 1) — mock deterministic
const ACTUAL_RATIO = [1, 0.95, 0.88, 0.8, 0.72, 0.9, 1, 0.85, 0.78, 0.93];

// ── ข้อมูลจริง (โหลด async จาก JSON) + field alias ให้เข้ากับโค้ดเดิม ──
type MockRow = MoveRow & {
  regionId: string; weaponId: string; date: string; expireDate: string;
  purchaseDoc: PurchaseDoc; moveCategory: string; actualQty: number;
};
const toMockRow = (r: MoveRow): MockRow => ({
  ...r,
  regionId: r.region,
  weaponId: r.weaponCode,
  date: r.dateISO,
  expireDate: r.expireTH,
  purchaseDoc: PURCHASE_DOCS[r.id % PURCHASE_DOCS.length],
  moveCategory: SALE_TRANSPORTS.includes(r.transportType) ? MOVE_CAT_SALE : MOVE_CAT_NONSALE[r.id % MOVE_CAT_NONSALE.length],
  actualQty: Math.round(r.qty * ACTUAL_RATIO[r.id % ACTUAL_RATIO.length]),
  buyerGroupId: buyerUnitGroupId(r.buyerUnit),
  buyerGroup: buyerGroupLabel(buyerUnitGroupId(r.buyerUnit)),
});

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "อนุมัติ":         { bg: "#ECFDF5", color: "#059669" },
  "กำลังดำเนินการ": { bg: "#FFFBEB", color: "#D97706" },
  "รอดำเนินการ":    { bg: "#EFF6FF", color: "#2563EB" },
  "ไม่อนุมัติ":     { bg: "#FEF2F2", color: "#DC2626" },
};

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

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  };

  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => { if (!open) { if (value) { const d = new Date(value); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); } } setOpen(o => !o); }}
        style={{ ...SEL, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", padding: "0 10px 0 12px" }}
      >
        <span style={{ color: displayVal ? "#374151" : "#9CA3AF", fontSize: 13 }}>{displayVal || placeholder}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {value && <X size={12} color="#9CA3AF" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onChange(""); }} />}
          <CalendarDays size={15} color="#9CA3AF" />
        </span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 16, minWidth: 280 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
              <ChevronLeft size={16} color="#374151" />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{THAI_MONTHS[viewMonth]} {viewYear + 543}</span>
            <button type="button" onClick={nextMonth} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
              <ChevronRight size={16} color="#374151" />
            </button>
          </div>
          {/* Day names */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {THAI_DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#6B7280", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => day === null ? (
              <div key={i} />
            ) : (
              <button key={i} type="button" onClick={() => selectDay(day)}
                style={{ border: "none", cursor: "pointer", borderRadius: 6, padding: "6px 0", fontSize: 13, fontWeight: isSelected(day) ? 700 : 400,
                  background: isSelected(day) ? PRIMARY : "transparent",
                  color: isSelected(day) ? "#fff" : isToday(day) ? PRIMARY : "#374151",
                  outline: isToday(day) && !isSelected(day) ? `1.5px solid ${PRIMARY}` : "none"
                }}
                onMouseEnter={(e) => { if (!isSelected(day)) (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
                onMouseLeave={(e) => { if (!isSelected(day)) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >{day}</button>
            ))}
          </div>
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
  const display = selected.length === 0 ? placeholder
    : selected.length === options.length ? `ทั้งหมด`
    : `เลือก ${selected.length} รายการ`;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{ width: "100%", height: INPUT_H, padding: "0 10px 0 14px", fontSize: 13, border: INPUT_BORDER, borderRadius: INPUT_RADIUS, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "#374151", boxSizing: "border-box" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{display}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 6 }}>
          {selected.length > 0 && (
            <span onClick={(e) => { e.stopPropagation(); onChange([]); setKw(""); }} style={{ display: "flex", cursor: "pointer" }}>
              <X size={13} color="#9CA3AF" />
            </span>
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

/* ─── ChartTooltip ────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}>
      <div style={{ fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{label}</div>
      <div style={{ color: PRIMARY }}>{payload[0]?.value?.toLocaleString()} นัด</div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export function Page1Overview() {
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
  const [a, setA] = useState({ dateFrom: "", dateTo: "", companies: [] as string[], weaponType: "", unit: "", region: "", provinces: [] as string[], buyers: [] as string[], buyerUnits: [] as string[], weapons: [] as string[], transportTypes: [] as string[], moveCategories: [] as string[] });
  const [searched, setSearched] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  /* โหลดข้อมูลจริง (12,749 แถว) แบบ async จาก public/moveLicense.rows.json */
  const [MOCK_ROWS, setMockRows] = useState<MockRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    loadMoveRows().then((rows) => { if (alive) { setMockRows(rows.map(toMockRow)); setDataLoading(false); } });
    return () => { alive = false; };
  }, []);

  const handleSearch = () => { setA({ dateFrom: f_dateFrom, dateTo: f_dateTo, companies: f_companies, weaponType: f_weaponType, unit: f_unit, region: f_region, provinces: f_provinces, buyers: f_buyers, buyerUnits: f_buyerUnits, weapons: f_weapons, transportTypes: f_transportTypes, moveCategories: f_moveCategories }); setSearched(true); setTablePage(1); };
  const handleReset  = () => {
    setDateFrom(""); setDateTo(""); setCompanies([]); setWeaponType(""); setUnit(""); setWeapons([]);
    setRegion(""); setProvinces([]); setBuyers([]); setBuyerUnits([]); setTransportTypes([]); setMoveCategories([]);
    setA({ dateFrom: "", dateTo: "", companies: [], weaponType: "", unit: "", region: "", provinces: [], buyers: [], buyerUnits: [], weapons: [], transportTypes: [], moveCategories: [] });
    setSearched(false);
  };

  /* chart interaction */
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [lockedPieIndex, setLockedPieIndex] = useState<number | undefined>(undefined);
  const [activeDocIndex, setActiveDocIndex] = useState<number | undefined>(undefined);
  const [lockedDocIndex, setLockedDocIndex] = useState<number | undefined>(undefined);
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>(undefined);
  const [hiddenCompanies, setHiddenCompanies] = useState<Set<string>>(new Set());
  const [hiddenBuyers,    setHiddenBuyers]    = useState<Set<string>>(new Set());
  const [hiddenDocs,      setHiddenDocs]      = useState<Set<string>>(new Set());
  const toggleCompany = (id: string) => setHiddenCompanies((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleBuyer   = (id: string) => setHiddenBuyers((s)    => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleDoc     = (id: string) => setHiddenDocs((s)      => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const docChartRef = useRef<HTMLDivElement>(null);
  const [copiedBar, setCopiedBar] = useState(false);
  const [copiedPie, setCopiedPie] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  const captureChart = async (ref: React.RefObject<HTMLDivElement>, fn: (el: HTMLDivElement) => Promise<void>) => {
    const el = ref.current;
    if (!el) return;
    const hidden = el.querySelectorAll<HTMLElement>("[data-capture-hide]");
    const shown  = el.querySelectorAll<HTMLElement>("[data-capture-show]");
    hidden.forEach((n) => { n.dataset.origDisplay = n.style.display; n.style.display = "none"; });
    shown.forEach((n)  => { n.dataset.origDisplay = n.style.display; n.style.display = "block"; });
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await fn(el);
    hidden.forEach((n) => { n.style.display = n.dataset.origDisplay ?? ""; });
    shown.forEach((n)  => { n.style.display = n.dataset.origDisplay ?? "none"; });
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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("copy failed", e);
      }
    });

  /* filtered rows */
  const rows = !searched ? [] : MOCK_ROWS.filter((r) => {
    if (a.companies.length && !a.companies.includes(r.companyId)) return false;
    if (a.transportTypes.length && !a.transportTypes.includes(r.transportType)) return false;
    if (a.moveCategories.length && !a.moveCategories.includes(r.moveCategory)) return false;
    if (a.region   && r.regionId !== a.region)                    return false;
    if (a.provinces.length && !a.provinces.includes(r.dstProvince)) return false;
    if (a.buyers.length    && !a.buyers.includes(r.buyerGroupId)) return false;
    if (a.buyerUnits.length && !a.buyerUnits.includes(r.buyerUnit)) return false;
    if (a.unit && r.unit !== a.unit) return false;
    if (a.dateFrom && r.dateISO && r.dateISO < a.dateFrom) return false;
    if (a.dateTo   && r.dateISO && r.dateISO > a.dateTo)   return false;
    if (a.weapons.length) {
      if (!a.weapons.includes(r.weaponId)) return false;
    } else if (a.weaponType && r.weaponCategory !== a.weaponType) {
      return false;
    }
    return true;
  });

  const filteredWeaponOptions = f_weaponType
    ? WEAPONS.filter((w) => w.category === f_weaponType)
    : [];

  const buyerUnitOptions = BUYER_UNIT_OPTIONS
    .filter((u) => f_buyers.length === 0 || f_buyers.includes(buyerUnitGroupId(u.name)))
    .map((u) => ({ id: u.name, label: u.name }));

  // จังหวัด (ปลายทาง) — relate กับภาค: เลือกภาคแล้วกรองเฉพาะจังหวัดในภาคนั้น
  const provinceOptions = [...new Map(
    MOCK_ROWS
      .filter((r) => r.dstProvince && (!f_region || r.regionId === f_region))
      .map((r) => [r.dstProvince, { id: r.dstProvince, label: r.dstProvince }])
  ).values()].sort((x, y) => x.label.localeCompare(y.label, "th"));

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  const formatThaiDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  const addMonths = (iso: string, n: number) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y - 543, m - 1 + n, d);
    const ny = dt.getFullYear() + 543;
    const nm = String(dt.getMonth() + 1).padStart(2, "0");
    const nd = String(dt.getDate()).padStart(2, "0");
    return `${nd}/${nm}/${ny}`;
  };

  const exportRawExcel = () => {
    const headers = [
      "เลขที่หนังสือ อ.10","วันที่อนุญาต อ.10","วันที่หมดอายุ อ.10","เอกสารการซื้อ","ประเภทขนย้าย","ประเภทการขนย้าย","ผู้ประกอบการ",
      "กลุ่มหน่วยผู้ซื้อ","หน่วยผู้ซื้อ",
      "สถานที่ต้นทาง","บ้านเลขที่สถานที่ต้นทาง","อาคารสถานที่ต้นทาง","หมู่ที่สถานที่ต้นทาง",
      "ซอยสถานที่ต้นทาง","ถนนสถานที่ต้นทาง","ตำบลสถานที่ต้นทาง","อำเภอสถานที่ต้นทาง",
      "จังหวัดสถานที่ต้นทาง","รหัสไปรษณีย์สถานที่ต้นทาง",
      "สถานที่ปลายทาง","บ้านเลขที่สถานที่ปลายทาง","อาคารสถานที่ปลายทาง","หมู่ที่สถานที่ปลายทาง",
      "ซอยสถานที่ปลายทาง","ถนนสถานที่ปลายทาง","ตำบลสถานที่ปลายทาง","อำเภอสถานที่ปลายทาง",
      "จังหวัดสถานที่ปลายทาง","รหัสไปรษณีย์สถานที่ปลายทาง","ภาคสถานที่ปลายทาง",
      "รหัสอาวุธ","ชื่ออาวุธ","จำนวนที่ได้รับอนุญาต","จำนวนขนย้ายจริง","หน่วยนับ",
    ];
    const dataRows = rows.map((r) => [
      r.docNo, r.dateTH, r.expireTH, r.purchaseDoc, r.transportType, r.moveCategory, r.company,
      r.buyerGroup, r.buyerUnit,
      r.srcPlace, r.srcBaan, r.srcAkhan, r.srcMoo, r.srcSoi, r.srcRoad, r.srcTambon, r.srcAmphoe, r.srcProvince, r.srcZip,
      r.dstPlace, r.dstBaan, r.dstAkhan, r.dstMoo, r.dstSoi, r.dstRoad, r.dstTambon, r.dstAmphoe, r.dstProvince, r.dstZip, r.region,
      r.weaponCode, r.weaponName, r.qty, r.actualQty, r.unit || "-",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws["!cols"] = headers.map((_, i) => ({ wch: [18,14,14,18,24,26,40,20,60,40,10,10,6,14,20,14,16,20,8,60,10,10,6,14,20,14,16,20,8,16,12,40,16,14,8][i] ?? 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลดิบ");
    XLSX.writeFile(wb, "ข้อมูลดิบยอดอนุญาตให้ขายขนย้ายอาวุธ.xlsx");
  };

  const exportSummaryExcel = () => {
    const exportData = rows.map((r, i) => ({
      "#": i + 1,
      "ผู้ประกอบการ": r.company,
      "กลุ่มหน่วยผู้ซื้อ": r.buyerGroup,
      "อาวุธ": r.weaponName,
      "จำนวน": r.qty,
      "หน่วยนับ": r.unit,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [{ wch: 5 }, { wch: 40 }, { wch: 20 }, { wch: 50 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สรุปยอดอนุญาต");
    XLSX.writeFile(wb, "สรุปยอดอนุญาตให้ขายขนย้ายอาวุธ.xlsx");
  };

  const getBuyerLabel = (id: string) => BUYER_GROUPS.find((b) => b.id === id)?.label ?? "";
  const getRegionLabel = (id: string) => REGIONS.find((r) => r.id === id)?.label ?? "";
  const getWeaponLabel = (id: string) => WEAPONS.find((w) => w.id === id)?.label ?? id;

  const tableData = rows.map((r) => ({
    ...r,
    key: r.id,
    buyerGroupLabel: getBuyerLabel(r.buyerGroupId),
    regionLabel: getRegionLabel(r.regionId),
    weaponLabel: getWeaponLabel(r.weaponId),
    dateFormatted: r.dateTH,
  }));

  type TableRow = (typeof tableData)[0];

  const getColSearchProps = (dataIndex: keyof TableRow, placeholder: string): Partial<TableColumnsType<TableRow>[0]> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <input
          placeholder={`ค้นหา ${placeholder}`}
          value={selectedKeys[0] as string ?? ""}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ height: 32, padding: "0 10px", fontSize: 13, border: "1px solid #C7D2FE", borderRadius: 6, outline: "none", width: 220 }}
          autoFocus
        />
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
    { title: "#",               key: "no",            width: 52,  fixed: "left" as const, align: "center" as const, render: (_: unknown, __: TableRow, i: number) => (tablePage - 1) * tablePageSize + i + 1 },
    { title: "เลขที่หนังสือ อ.10", dataIndex: "docNo",       key: "docNo",         width: 140, ...getColSearchProps("docNo", "เลขที่หนังสือ") },
    { title: "วันที่อนุญาต อ.10",    dataIndex: "dateFormatted", key: "date",          width: 140, sorter: (a, b) => a.date.localeCompare(b.date) },
    { title: "วันที่หมดอายุ อ.10",   dataIndex: "expireDate",    key: "expireDate",    width: 140 },
    { title: "ประเภทขนย้าย",   dataIndex: "transportType", key: "transportType", width: 210,
      filters: TRANSPORT_TYPES.map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.transportType === value,
      render: (v: TransportType) => <span>{v}</span>,
    },
    { title: "ประเภทการขนย้าย", dataIndex: "moveCategory", key: "moveCategory", width: 220,
      filters: MOVE_CATEGORIES.map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.moveCategory === value,
    },
    { title: "ผู้ประกอบการ",    dataIndex: "company",       key: "company",       width: 220, sorter: (a, b) => a.company.localeCompare(b.company, "th"), ...getColSearchProps("company", "ผู้ประกอบการ") },
    { title: "กลุ่มหน่วยผู้ซื้อ", dataIndex: "buyerGroupLabel", key: "buyerGroup", width: 170, sorter: (a, b) => a.buyerGroupLabel.localeCompare(b.buyerGroupLabel, "th"), ...getColSearchProps("buyerGroupLabel", "กลุ่มหน่วยผู้ซื้อ") },
    { title: "หน่วยผู้ซื้อ",    dataIndex: "buyerUnit",     key: "buyerUnit",     width: 220, sorter: (a, b) => a.buyerUnit.localeCompare(b.buyerUnit, "th"), ...getColSearchProps("buyerUnit", "หน่วยผู้ซื้อ") },
    { title: "อาวุธ",           dataIndex: "weaponLabel",   key: "weapon",        width: 200, sorter: (a, b) => a.weaponLabel.localeCompare(b.weaponLabel, "th"), ...getColSearchProps("weaponLabel", "อาวุธ") },
    { title: "จำนวนที่ได้รับอนุญาต", dataIndex: "qty",      key: "qty",           width: 150, align: "right" as const, sorter: (a, b) => a.qty - b.qty, render: (v: number) => <span style={{ color: PRIMARY, fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "จำนวนขนย้ายจริง", dataIndex: "actualQty",    key: "actualQty",     width: 140, align: "right" as const, sorter: (a, b) => a.actualQty - b.actualQty, render: (v: number) => <span style={{ color: "#374151" }}>{v.toLocaleString()}</span> },
    { title: "หน่วยนับ",        dataIndex: "unit",          key: "unit",          width: 90,  align: "center" as const, render: (v: string) => <span style={{ color: "#374151" }}>{v || "-"}</span> },
  ];

  const antTableProps: TableProps<TableRow> = {
    columns: antColumns,
    dataSource: tableData,
    size: "middle",
    pagination: { current: tablePage, pageSize: tablePageSize, showSizeChanger: true, pageSizeOptions: ["10","20","50"], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, locale: { items_per_page: "/หน้า", jump_to: "ไปที่", page: "หน้า" }, onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); } },
    scroll: { x: 2140 },
  };

  /* bar chart — only companies present in filtered rows */
  const chartMap: Record<string, { id: string; name: string; qty: number }> = {};
  rows.forEach((r) => {
    if (!chartMap[r.companyId]) chartMap[r.companyId] = { id: r.companyId, name: r.company, qty: 0 };
    chartMap[r.companyId].qty += r.qty;
  });
  const chartData = Object.values(chartMap).filter((d) => !hiddenCompanies.has(d.id)).sort((a, b) => b.qty - a.qty);

  /* pie chart — only buyer groups present in filtered rows */
  // 9 สี ครอบคลุมกลุ่มหน่วยผู้ซื้อทั้งหมด (9 กลุ่ม)
  const PIE_COLORS = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
  const activeBuyerGroupIds = [...new Set(rows.map((r) => r.buyerGroupId))];
  const buyerPieData = BUYER_GROUPS
    .filter((bg) => activeBuyerGroupIds.includes(bg.id))
    .map((bg, i) => ({
      id: bg.id, name: bg.label,
      value: hiddenBuyers.has(bg.id) ? 0 : rows.filter((r) => r.buyerGroupId === bg.id).reduce((s, r) => s + r.qty, 0),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  /* pie chart — purchase document type */
  const activeDocs = PURCHASE_DOCS.filter((d) => rows.some((r) => r.purchaseDoc === d));
  const docPieData = activeDocs.map((d, i) => ({
    id: d, name: d,
    value: hiddenDocs.has(d) ? 0 : rows.filter((r) => r.purchaseDoc === d).reduce((s, r) => s + r.qty, 0),
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  /* active pie shape */
  const renderActiveShape = (props: Record<string, number & string>) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const pct = totalQty > 0 ? ((value / totalQty) * 100).toFixed(1) : "0.0";
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#0E1119" fontSize={13} fontWeight={700}>{payload.name}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={PRIMARY} fontSize={14} fontWeight={700}>{value.toLocaleString()}</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill="#8B8E95" fontSize={11}>{pct}%</text>
      </g>
    );
  };

  return (
    <div style={{ fontFamily: FF }}>

      {/* Header */}
      <div style={{ fontSize: 12, color: "#8B8E95", marginBottom: 4 }}>ระบบ Dashboard / Dashboard</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ</div>
        </div>
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
            <label style={LBL}>ประเภทอาวุธ <span style={{ color: "#EF4444" }}>*</span></label>
            <SelectField value={f_weaponType} onChange={(v) => { setWeaponType(v); setWeapons([]); if (v === "กระสุน") setUnit("นัด"); }} placeholder="เลือกประเภท"
              options={WEAPON_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} />
          </div>
          <div>
            <label style={LBL}>หน่วยนับ <span style={{ color: "#EF4444" }}>*</span></label>
            <SelectField value={f_unit} onChange={(v) => { setUnit(v); setWeapons([]); }} placeholder="เลือกหน่วยนับ"
              options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} />
          </div>
          <div>
            <label style={LBL}>อาวุธ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={filteredWeaponOptions} selected={f_weapons} onChange={setWeapons} showSearch />
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
          <button onClick={handleSearch} disabled={!f_weaponType || !f_unit || dataLoading}
            title={dataLoading ? "กำลังโหลดข้อมูล..." : ""}
            style={{ width: 40, height: 40, borderRadius: 8, background: (!f_weaponType || !f_unit || dataLoading) ? "#D1D5DB" : PRIMARY, border: "none", cursor: (!f_weaponType || !f_unit || dataLoading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (f_weaponType && f_unit && !dataLoading) (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
            onMouseLeave={(e) => { if (f_weaponType && f_unit && !dataLoading) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
            <Search size={17} color="#fff" />
          </button>
        </div>
      </div>

      {/* Charts row 1 — two pies */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Doc pie chart */}
        <div ref={docChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{searched && a.weaponType ? `ยอดอนุญาตให้การขาย/ขนย้าย${a.weaponType}` : "ยอดอนุญาตให้การขาย/ขนย้าย"}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามเอกสารการซื้อ{searched && a.unit ? ` (${a.unit})` : ""}</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              <button onClick={() => copyPNG(docChartRef, setCopiedDoc)}
                style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: copiedDoc ? "#059669" : "#6B7280", cursor: "pointer" }}>
                {copiedDoc ? <Check size={12} /> : <Copy size={12} />}{copiedDoc ? "คัดลอกแล้ว" : "Copy"}
              </button>
              <button onClick={() => downloadPNG(docChartRef, "chart-purchase-doc.png")}
                style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#6B7280", cursor: "pointer" }}>
                <Download size={12} />PNG
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={docPieData} margin={{ top: 22, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#4B5563" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F5F3FF" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}
                label={{ position: "top", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}
                onMouseEnter={(_: unknown, index: number) => setActiveDocIndex(index)}
                onMouseLeave={() => setActiveDocIndex(undefined)}>
                {docPieData.map((d, i) => (
                  <Cell key={i} fill={d.color} opacity={activeDocIndex === undefined || activeDocIndex === i ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {docPieData.map((d) => {
              const pct = totalQty > 0 ? ((d.value / totalQty) * 100).toFixed(1) : "0.0";
              return (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1119" }}>{d.value.toLocaleString()}</span>
                  <span style={{ fontSize: 11, color: "#8B8E95", width: 44, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{docPieData.reduce((s, d) => s + d.value, 0).toLocaleString()}{a.unit ? ` ${a.unit}` : ""}</span>
            </div>
          </div>
          {/* Toggle chips */}
          <div data-capture-hide style={{ marginTop: 12, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>แสดง/ซ่อน เอกสาร</span>
              {hiddenDocs.size > 0 && (
                <button onClick={() => setHiddenDocs(new Set())} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {docPieData.map((d, i) => {
                const hidden = hiddenDocs.has(d.id);
                return (
                  <button key={d.id} onClick={() => toggleDoc(d.id)}
                    style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PIE_COLORS[i % PIE_COLORS.length]}`, background: hidden ? "#F9FAFB" : PIE_COLORS[i % PIE_COLORS.length] + "22", color: hidden ? "#9CA3AF" : PIE_COLORS[i % PIE_COLORS.length], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Pie chart */}
        <div ref={pieChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{searched && a.weaponType ? `ยอดอนุญาตให้การขาย/ขนย้าย${a.weaponType}` : "ยอดอนุญาตให้การขาย/ขนย้าย"}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามกลุ่มหน่วยผู้ซื้อ{searched && a.unit ? ` (${a.unit})` : ""}</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              <button onClick={() => copyPNG(pieChartRef, setCopiedPie)}
                style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: copiedPie ? "#059669" : "#6B7280", cursor: "pointer" }}>
                {copiedPie ? <Check size={12} /> : <Copy size={12} />}{copiedPie ? "คัดลอกแล้ว" : "Copy"}
              </button>
              <button onClick={() => downloadPNG(pieChartRef, "chart-buyers.png")}
                style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#6B7280", cursor: "pointer" }}>
                <Download size={12} />PNG
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={buyerPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={85} paddingAngle={3} dataKey="value"
                activeIndex={lockedPieIndex ?? activePieIndex}
                activeShape={renderActiveShape as Parameters<typeof Pie>[0]["activeShape"]}
                onMouseEnter={(_: unknown, index: number) => { if (lockedPieIndex === undefined) setActivePieIndex(index); }}
                onMouseLeave={() => { if (lockedPieIndex === undefined) setActivePieIndex(undefined); }}
                onClick={(_: unknown, index: number) => {
                  setLockedPieIndex((prev) => prev === index ? undefined : index);
                  setActivePieIndex(undefined);
                }}
                cursor="pointer">
                {buyerPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {buyerPieData.map((d) => {
              const pct = totalQty > 0 ? ((d.value / totalQty) * 100).toFixed(1) : "0.0";
              return (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1119" }}>{d.value.toLocaleString()}</span>
                  <span style={{ fontSize: 11, color: "#8B8E95", width: 44, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{buyerPieData.reduce((s, d) => s + d.value, 0).toLocaleString()}{a.unit ? ` ${a.unit}` : ""}</span>
            </div>
          </div>
          {/* Toggle chips */}
          <div data-capture-hide style={{ marginTop: 12, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>แสดง/ซ่อน กลุ่ม</span>
              {hiddenBuyers.size > 0 && (
                <button onClick={() => setHiddenBuyers(new Set())} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {buyerPieData.map((bg, i) => {
                const hidden = hiddenBuyers.has(bg.id);
                return (
                  <button key={bg.id} onClick={() => toggleBuyer(bg.id)}
                    style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PIE_COLORS[i]}`, background: hidden ? "#F9FAFB" : PIE_COLORS[i] + "22", color: hidden ? "#9CA3AF" : PIE_COLORS[i], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                    {bg.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 — bar full width */}
      <div ref={barChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{searched && a.weaponType ? `ยอดอนุญาตให้การขาย/ขนย้าย${a.weaponType}` : "ยอดอนุญาตให้การขาย/ขนย้าย"}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการ{searched && a.unit ? ` (${a.unit})` : ""}</div>
          </div>
          <div data-capture-hide style={{ display: "flex", gap: 6 }}>
            <button onClick={() => copyPNG(barChartRef, setCopiedBar)}
              style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: copiedBar ? "#059669" : "#6B7280", cursor: "pointer" }}>
              {copiedBar ? <Check size={13} /> : <Copy size={13} />}{copiedBar ? "คัดลอกแล้ว" : "Copy"}
            </button>
            <button onClick={() => downloadPNG(barChartRef, "chart-company.png")}
              style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#6B7280", cursor: "pointer" }}>
              <Download size={13} />PNG
            </button>
          </div>
        </div>
        {(() => {
          const CHAR_W = 7.2;
          const LINE_H = 15;
          const MAX_W = 320;
          const yAxisW = Math.min(MAX_W, Math.max(...(chartData.map((d) => d.name.length * CHAR_W)), 80));
          const charsPerLine = Math.floor(yAxisW / CHAR_W);
          const CustomYTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
            const words = payload.value.split(" ");
            const lines: string[] = [];
            let cur = "";
            words.forEach((w) => { if ((cur + (cur ? " " : "") + w).length <= charsPerLine) { cur += (cur ? " " : "") + w; } else { if (cur) lines.push(cur); cur = w; } });
            if (cur) lines.push(cur);
            const offsetY = -((lines.length - 1) * LINE_H) / 2;
            return (
              <g transform={`translate(${x},${y})`}>
                {lines.map((l, i) => (
                  <text key={i} x={-6} y={offsetY + i * LINE_H} textAnchor="end" fill="#111827" fontSize={11} dominantBaseline="middle">{l}</text>
                ))}
              </g>
            );
          };
          return (
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 52, 100)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 70, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D1D5DB" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#4B5563" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={yAxisW} tick={<CustomYTick x={0} y={0} payload={{ value: "" }} />} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F5F3FF" }} />
            <Bar dataKey="qty" radius={[0, 6, 6, 0]} maxBarSize={26}
              label={{ position: "right", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}
              onMouseEnter={(_: unknown, index: number) => setActiveBarIndex(index)}
              onMouseLeave={() => setActiveBarIndex(undefined)}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]}
                  opacity={activeBarIndex === undefined || activeBarIndex === i ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
          );
        })()}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{chartData.reduce((s, d) => s + d.qty, 0).toLocaleString()}{a.unit ? ` ${a.unit}` : ""}</span>
        </div>
        {/* Toggle chips */}
        <div data-capture-hide style={{ marginTop: 14, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>แสดง/ซ่อน ผู้ประกอบการ</span>
            {hiddenCompanies.size > 0 && (
              <button onClick={() => setHiddenCompanies(new Set())} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chartData.map((c, i) => {
              const hidden = hiddenCompanies.has(c.id);
              return (
                <button key={c.id} onClick={() => toggleCompany(c.id)}
                  style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PALETTE[i % PALETTE.length]}`, background: hidden ? "#F9FAFB" : PALETTE[i % PALETTE.length] + "22", color: hidden ? "#9CA3AF" : PALETTE[i % PALETTE.length], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการยอดอนุญาตให้ขาย/ขนย้ายอาวุธ</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", fontSize: 13, border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
              onClick={exportRawExcel}>
              <FileSpreadsheet size={15} color="#059669" />Export ข้อมูล (Excel)
            </button>
          </div>
        </div>
        <ConfigProvider theme={{ token: { colorPrimary: PRIMARY, fontFamily: FF, fontSize: 13 } }}>
          <Table {...antTableProps} style={{ fontFamily: FF }} />
        </ConfigProvider>
      </div>

    </div>
  );
}
