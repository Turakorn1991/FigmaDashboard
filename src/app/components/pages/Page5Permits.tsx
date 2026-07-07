import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, ChevronDown, X, Download, Copy, Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
import { Table, ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";
import { loadMoveRows, COMPANY_OPTIONS } from "../../data/moveLicense";
import type { MoveRow } from "../../data/moveLicense";

const PRIMARY = "#6574FF";
const FF = "'Noto Sans Thai', Inter, sans-serif";
const PALETTE = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#14B8A6", "#F97316"];

/* ─── ประเภทหนังสืออนุญาต (4 แบบ) ────────────────────── */
const DOC_TYPES = [
  { key: "อ.8",  color: "#6574FF", full: "หนังสืออนุญาตให้สั่งหรือนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ เพื่อใช้ในการผลิตอาวุธ ฯ (แบบ อ.8)" },
  { key: "อ.10", color: "#06B6D4", full: "หนังสืออนุญาตให้ขนย้ายวัตถุหรืออาวุธที่ใช้ในการผลิตอาวุธ หรืออาวุธที่ผลิตขึ้นออกจากโรงงานหรือสถานที่เก็บ (แบบ อ.10)" },
  { key: "อ.16", color: "#F59E0B", full: "หนังสืออนุญาตให้ขาย หรือจำหน่ายอาวุธให้แก่บุคคลอื่นนอกจากหน่วยงานตามมาตรา 7 โดยการส่งออกไปนอกราชอาณาจักร (แบบ อ.16)" },
  { key: "อ.17", color: "#10B981", full: "หนังสืออนุญาตให้ขาย หรือจำหน่ายอาวุธให้แก่บุคคลอื่น นอกจากหน่วยงานตามมาตรา 7 ในราชอาณาจักร (แบบ อ.17)" },
] as const;
const TYPE_KEYS = DOC_TYPES.map((d) => d.key) as string[];
const TYPE_COLOR: Record<string, string> = Object.fromEntries(DOC_TYPES.map((d) => [d.key, d.color]));
const TYPE_FULL: Record<string, string> = Object.fromEntries(DOC_TYPES.map((d) => [d.key, d.full]));
const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  "อ.8": { bg: "#EEF2FF", color: "#4338CA" },
  "อ.10": { bg: "#ECFEFF", color: "#0E7490" },
  "อ.16": { bg: "#FFFBEB", color: "#D97706" },
  "อ.17": { bg: "#ECFDF5", color: "#059669" },
};
// ประเภทหนังสือ deterministic จาก docNo (กระจาย อ.8 30% / อ.10 30% / อ.16 20% / อ.17 20%)
const hashStr = (s: string) => { let n = 0; for (const c of s) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0; return n; };
const TYPE_POOL = ["อ.8", "อ.8", "อ.8", "อ.10", "อ.10", "อ.10", "อ.16", "อ.16", "อ.17", "อ.17"];
const docType = (docNo: string): string => TYPE_POOL[hashStr(docNo) % TYPE_POOL.length];

/* ─── การชำระเงิน / จำนวนเงิน / วันที่ใบเสร็จ (deterministic จาก docNo) ─── */
const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const fmtThaiShort = (iso: string) => { if (!iso) return "-"; const d = new Date(iso); if (isNaN(d.getTime())) return "-"; return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`; };
const addDaysISO = (iso: string, n: number) => { const d = new Date(iso); if (isNaN(d.getTime())) return ""; d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// ค่าธรรมเนียมพื้นฐานต่อประเภทหนังสือ (บาท) + variance
const FEE_BASE: Record<string, number> = { "อ.8": 5000, "อ.10": 2000, "อ.16": 8000, "อ.17": 3000 };
const docAmount = (docNo: string, type: string) => (FEE_BASE[type] ?? 2000) + (hashStr(docNo + "amt") % 40) * 100;
const docPaid = (docNo: string) => hashStr(docNo + "pay") % 100 < 72; // 72% ชำระแล้ว

interface DocRow {
  docNo: string; dateISO: string; dateTH: string; expireTH: string;
  companyId: string; company: string; docType: string;
  paid: boolean; receiptISO: string; receiptTH: string; amount: number;
}
// จัดกลุ่ม MoveRow (รายบรรทัด) → หนังสืออนุญาต (ฉบับ) ตาม docNo
const buildDocs = (rows: MoveRow[]): DocRow[] => {
  const map = new Map<string, DocRow>();
  for (const r of rows) {
    if (!r.docNo || map.has(r.docNo)) continue;
    const type = docType(r.docNo);
    const paid = docPaid(r.docNo);
    const receiptISO = paid && r.dateISO ? addDaysISO(r.dateISO, (hashStr(r.docNo + "rc") % 20) + 1) : "";
    map.set(r.docNo, {
      docNo: r.docNo, dateISO: r.dateISO, dateTH: r.dateTH, expireTH: r.expireTH,
      companyId: r.companyId, company: r.company, docType: type,
      paid, receiptISO, receiptTH: fmtThaiShort(receiptISO), amount: docAmount(r.docNo, type),
    });
  }
  return [...map.values()];
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

/* ─── ThaiDateRangePicker ─────────────────────────────── */
function ThaiDateRangePicker({ from, to, onChange, phFrom = "เริ่มต้น", phTo = "สิ้นสุด" }: { from: string; to: string; onChange: (from: string, to: string) => void; phFrom?: string; phTo?: string }) {
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
          <span style={{ color: from ? "#374151" : "#9CA3AF" }}>{fmt(from) || phFrom}</span>
          <span style={{ color: "#9CA3AF" }}>→</span>
          <span style={{ color: to ? "#374151" : "#9CA3AF" }}>{fmt(to) || phTo}</span>
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

/* ─── Custom Y tick (truncate long company names) ─────── */
const CompanyTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const v = payload?.value ?? "";
  const text = v.length > 26 ? v.slice(0, 25) + "…" : v;
  return <text x={x} y={y} dy={4} textAnchor="end" fill="#374151" fontSize={11}>{text}</text>;
};

/* ─── Main component ─────────────────────────────────── */
export function Page5Permits() {
  const [f_permitFrom, setPermitFrom] = useState("");
  const [f_permitTo,   setPermitTo]   = useState("");
  const [f_receiptFrom, setReceiptFrom] = useState("");
  const [f_receiptTo,   setReceiptTo]   = useState("");
  const [f_companies, setCompanies] = useState<string[]>([]);
  const [f_types, setTypes] = useState<string[]>([]);
  const [a, setA] = useState({ permitFrom: "", permitTo: "", receiptFrom: "", receiptTo: "", companies: [] as string[], types: [] as string[] });
  const [searched, setSearched] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  /* โหลดข้อมูลจริง (async) แล้วจัดกลุ่มเป็นหนังสืออนุญาต (ฉบับ) */
  const [ALL_DOCS, setDocs] = useState<DocRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    loadMoveRows().then((rows) => { if (alive) { setDocs(buildDocs(rows)); setDataLoading(false); } });
    return () => { alive = false; };
  }, []);

  const handleSearch = () => { setA({ permitFrom: f_permitFrom, permitTo: f_permitTo, receiptFrom: f_receiptFrom, receiptTo: f_receiptTo, companies: f_companies, types: f_types }); setSearched(true); setTablePage(1); };
  const handleReset  = () => { setPermitFrom(""); setPermitTo(""); setReceiptFrom(""); setReceiptTo(""); setCompanies([]); setTypes([]); setA({ permitFrom: "", permitTo: "", receiptFrom: "", receiptTo: "", companies: [], types: [] }); setSearched(false); };

  /* chart capture */
  const groupBarRef = useRef<HTMLDivElement>(null);
  const companyBarRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const moneyCoRef = useRef<HTMLDivElement>(null);
  const moneyTypeRef = useRef<HTMLDivElement>(null);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [copiedC, setCopiedC] = useState(false);
  const [copiedD, setCopiedD] = useState(false);
  const [copiedE, setCopiedE] = useState(false);

  /* chart interaction (ลูกเล่น) */
  const [activeSeries, setActiveSeries] = useState<string | undefined>(undefined);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [hiddenPay, setHiddenPay] = useState<Set<string>>(new Set()); // "paid" | "unpaid"
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [lockedPieIndex, setLockedPieIndex] = useState<number | undefined>(undefined);
  const [hiddenPieType, setHiddenPieType] = useState<Set<string>>(new Set());
  const [activeCompanyIndex, setActiveCompanyIndex] = useState<number | undefined>(undefined);
  const [hiddenCompanies, setHiddenCompanies] = useState<Set<string>>(new Set());
  const [activeMoneyCoIndex, setActiveMoneyCoIndex] = useState<number | undefined>(undefined);
  const [hiddenMoneyCo, setHiddenMoneyCo] = useState<Set<string>>(new Set());
  const [activeMoneyTypeIndex, setActiveMoneyTypeIndex] = useState<number | undefined>(undefined);
  const [hiddenMoneyType2, setHiddenMoneyType2] = useState<Set<string>>(new Set());
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

  /* filtered docs */
  const docs = !searched ? [] : ALL_DOCS.filter((d) => {
    if (a.companies.length && !a.companies.includes(d.companyId)) return false;
    if (a.types.length && !a.types.includes(d.docType)) return false;
    if (a.permitFrom && d.dateISO && d.dateISO < a.permitFrom) return false;
    if (a.permitTo && d.dateISO && d.dateISO > a.permitTo) return false;
    if (a.receiptFrom && (!d.paid || d.receiptISO < a.receiptFrom)) return false;
    if (a.receiptTo && (!d.paid || d.receiptISO > a.receiptTo)) return false;
    return true;
  });

  const visibleTypes = TYPE_KEYS.filter((t) => !hiddenSeries.has(t));

  /* chart 1 — grouped by company × ประเภทหนังสือ */
  const companyOrder: { id: string; name: string }[] = [];
  const cMap: Record<string, any> = {};
  docs.forEach((d) => {
    if (!cMap[d.companyId]) { const base: any = { id: d.companyId, name: d.company, total: 0 }; TYPE_KEYS.forEach((k) => { base[k] = 0; base[`${k}_paid`] = 0; base[`${k}_unpaid`] = 0; }); cMap[d.companyId] = base; companyOrder.push({ id: d.companyId, name: d.company }); }
    cMap[d.companyId][d.docType] += 1;
    cMap[d.companyId][`${d.docType}_${d.paid ? "paid" : "unpaid"}`] += 1;
    cMap[d.companyId].total += 1;
  });
  const companyStatusData = companyOrder.map((c) => cMap[c.id]).sort((a, b) => b.total - a.total);
  const companyColor: Record<string, string> = {};
  companyStatusData.forEach((d, i) => { companyColor[d.id] = PALETTE[i % PALETTE.length]; });
  // ยอดรวมกราฟ 1 = นับเฉพาะประเภทที่แสดงอยู่
  const groupBarTotal = docs.filter((d) => !hiddenSeries.has(d.docType) && !hiddenPay.has(d.paid ? "paid" : "unpaid")).length;
  const payVisible = { paid: !hiddenPay.has("paid"), unpaid: !hiddenPay.has("unpaid") };
  // label ตัวเลขรวม (ที่มองเห็น) ปลายแท่งของแต่ละประเภทหนังสือ
  const stackLabel = (t: string) => (props: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
    const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
    const row = companyStatusData[index] as Record<string, number> | undefined;
    if (!row) return null;
    let total = 0;
    if (payVisible.paid) total += row[`${t}_paid`] || 0;
    if (payVisible.unpaid) total += row[`${t}_unpaid`] || 0;
    if (total <= 0) return null;
    return <text x={x + width + 5} y={y + height / 2} dy={4} fontSize={10} fontWeight={600} fill="#4B5563" textAnchor="start">{total.toLocaleString()}</text>;
  };

  /* chart 2 — total docs by company (ซ่อนบริษัทได้) */
  const companyTotalData = companyStatusData.filter((d) => !hiddenCompanies.has(d.id)).map((d) => ({ id: d.id, name: d.name, value: d.total }));
  const companyBarTotal = companyTotalData.reduce((s, d) => s + d.value, 0);

  /* chart 3 — total docs by ประเภทหนังสือ (pie, ซ่อนประเภทได้) */
  const typePieAll = DOC_TYPES.map((t) => ({ name: t.key, value: docs.filter((d) => d.docType === t.key).length, color: t.color }));
  const typePieData = typePieAll.map((d) => ({ ...d, value: hiddenPieType.has(d.name) ? 0 : d.value }));
  const pieTotal = typePieData.reduce((s, d) => s + d.value, 0);

  /* chart 4/5 — จำนวนเงินที่ชำระ (เฉพาะหนังสือที่ชำระแล้ว) */
  const paidDocs = docs.filter((d) => d.paid);
  const moneyCoMap: Record<string, { id: string; name: string; value: number }> = {};
  paidDocs.forEach((d) => { if (!moneyCoMap[d.companyId]) moneyCoMap[d.companyId] = { id: d.companyId, name: d.company, value: 0 }; moneyCoMap[d.companyId].value += d.amount; });
  const moneyCoAll = Object.values(moneyCoMap).sort((a, b) => b.value - a.value);
  const moneyCoData = moneyCoAll.filter((d) => !hiddenMoneyCo.has(d.id));
  const moneyCoTotal = moneyCoData.reduce((s, d) => s + d.value, 0);
  const moneyCoColor: Record<string, string> = {};
  moneyCoAll.forEach((d, i) => { moneyCoColor[d.id] = PALETTE[i % PALETTE.length]; });
  const moneyTypeAll = DOC_TYPES.map((t) => ({ name: t.key, value: paidDocs.filter((d) => d.docType === t.key).reduce((s, d) => s + d.amount, 0), color: t.color }));
  const moneyTypeData = moneyTypeAll.filter((d) => !hiddenMoneyType2.has(d.name));
  const moneyTypeTotal = moneyTypeData.reduce((s, d) => s + d.value, 0);

  /* active pie shape — โชว์ชื่อ/จำนวน/% ตรงกลางโดนัท */
  const renderActiveShape = (props: Record<string, number & string>) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const pct = pieTotal > 0 ? ((value / pieTotal) * 100).toFixed(1) : "0.0";
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#0E1119" fontSize={14} fontWeight={700}>{payload.name}</text>
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

  const pillStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", height: 24, padding: "0 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 };
  const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", height: 22, padding: "0 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 };

  const antColumns: TableColumnsType<TableRow> = [
    { title: "#", key: "no", width: 56, fixed: "left" as const, align: "center" as const, render: (_: unknown, __: TableRow, i: number) => (tablePage - 1) * tablePageSize + i + 1 },
    { title: "ผู้ประกอบการ", dataIndex: "company", key: "company", width: 240, sorter: (a, b) => a.company.localeCompare(b.company, "th"), ...getColSearchProps("company", "ผู้ประกอบการ") },
    { title: "เลขที่หนังสือ", dataIndex: "docNo", key: "docNo", width: 130, ...getColSearchProps("docNo", "เลขที่หนังสือ"), render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span> },
    { title: "วันที่อนุญาต", dataIndex: "dateTH", key: "dateTH", width: 120, sorter: (a, b) => a.dateISO.localeCompare(b.dateISO) },
    { title: "วันที่หมดอายุ", dataIndex: "expireTH", key: "expireTH", width: 120 },
    { title: "ประเภทหนังสือ", dataIndex: "docType", key: "docType", width: 120, align: "center" as const,
      filters: TYPE_KEYS.map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.docType === value,
      render: (v: string) => <span style={{ ...badgeStyle, background: TYPE_STYLE[v]?.bg ?? "#F3F4F6", color: TYPE_STYLE[v]?.color ?? "#374151" }} title={TYPE_FULL[v]}>{v}</span>,
    },
    { title: "สถานะการชำระเงิน", dataIndex: "paid", key: "paid", width: 150, align: "center" as const,
      filters: [{ text: "ชำระแล้ว", value: true }, { text: "ยังไม่ชำระ", value: false }],
      onFilter: (value, record) => record.paid === value,
      render: (paid: boolean) => paid
        ? <span style={{ ...pillStyle, background: "#ECFDF5", color: "#059669" }}>ชำระแล้ว</span>
        : <span style={{ ...pillStyle, background: "#FFF7ED", color: "#EA580C" }}>ยังไม่ชำระ</span>,
    },
    { title: "วันที่ใบเสร็จ", dataIndex: "receiptTH", key: "receiptTH", width: 130, render: (v: string) => <span style={{ color: v === "-" ? "#9CA3AF" : "#374151" }}>{v}</span> },
    { title: "จำนวนเงิน", dataIndex: "amount", key: "amount", width: 130, align: "right" as const, sorter: (a, b) => (a.paid ? a.amount : 0) - (b.paid ? b.amount : 0),
      render: (v: number, r: TableRow) => r.paid ? <span style={{ fontWeight: 600, color: "#0E1119" }}>{v.toLocaleString()} บาท</span> : <span style={{ color: "#9CA3AF" }}>-</span> },
  ];

  const antTableProps: TableProps<TableRow> = {
    columns: antColumns,
    dataSource: tableData,
    size: "middle",
    pagination: { current: tablePage, pageSize: tablePageSize, showSizeChanger: true, pageSizeOptions: ["10","20","50"], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, locale: { items_per_page: "/หน้า", jump_to: "ไปที่", page: "หน้า" }, onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); } },
    scroll: { x: 1200 },
  };

  const exportExcel = () => {
    const data = docs.map((d, i) => ({
      "#": i + 1, "ผู้ประกอบการ": d.company, "เลขที่หนังสือ": d.docNo,
      "วันที่อนุญาต": d.dateTH, "วันที่หมดอายุ": d.expireTH, "ประเภทหนังสือ": TYPE_FULL[d.docType],
      "สถานะการชำระเงิน": d.paid ? "ชำระแล้ว" : "ยังไม่ชำระ",
      "วันที่ใบเสร็จ": d.paid ? d.receiptTH : "-",
      "จำนวนเงิน": d.paid ? d.amount : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 5 }, { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 70 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "หนังสืออนุญาต");
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}${p(now.getHours())}${p(now.getMinutes())}`;
    XLSX.writeFile(wb, `จำนวนหนังสืออนุญาตให้ สั่ง ขาย ขนย้าย อาวุธและวัตถุ_${ts}.xlsx`);
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
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>จำนวนหนังสืออนุญาตให้ สั่ง ขาย ขนย้าย อาวุธและวัตถุ</div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 16 }}>ค้นหาข้อมูล</div>

        {/* Row 1: ช่วงวันที่อนุญาต (1/3) | ช่วงวันที่ใบเสร็จ (1/3) | ผู้ประกอบการ (1/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LBL}>ช่วงวันที่อนุญาต</label>
            <ThaiDateRangePicker from={f_permitFrom} to={f_permitTo} onChange={(fr, t) => { setPermitFrom(fr); setPermitTo(t); }} />
          </div>
          <div>
            <label style={LBL}>ช่วงวันที่ใบเสร็จ</label>
            <ThaiDateRangePicker from={f_receiptFrom} to={f_receiptTo} onChange={(fr, t) => { setReceiptFrom(fr); setReceiptTo(t); }} phFrom="เริ่มต้น" phTo="สิ้นสุด" />
          </div>
          <div>
            <label style={LBL}>ผู้ประกอบการ</label>
            <MultiSelect placeholder="ทั้งหมด" options={COMPANY_OPTIONS.map((c) => ({ id: c.id, label: c.name }))} selected={f_companies} onChange={setCompanies} showSearch />
          </div>
        </div>

        {/* Row 2: ประเภทหนังสือ (1/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
          <div>
            <label style={LBL}>ประเภทหนังสือ</label>
            <MultiSelect placeholder="ทั้งหมด" options={DOC_TYPES.map((t) => ({ id: t.key, label: t.key }))} selected={f_types} onChange={setTypes} />
          </div>
        </div>

        {/* Row 2: ปุ่ม */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={handleReset}
            style={{ height: 44, padding: "0 20px", fontSize: 13, border: `1.5px solid ${PRIMARY}`, borderRadius: 10, background: "#fff", color: PRIMARY, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
            รีเซ็ต
          </button>
          <button onClick={handleSearch} disabled={dataLoading}
            title={dataLoading ? "กำลังโหลดข้อมูล..." : ""}
            style={{ width: 44, height: 44, borderRadius: 10, background: dataLoading ? "#D1D5DB" : PRIMARY, border: "none", cursor: dataLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (!dataLoading) (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
            onMouseLeave={(e) => { if (!dataLoading) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
            <Search size={17} color="#fff" />
          </button>
        </div>
      </div>

      {/* Chart row 1 — grouped horizontal bar (ประเภทหนังสือ by company) */}
      <div ref={groupBarRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>จำนวนหนังสืออนุญาต</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการและประเภทหนังสือ (ฉบับ)</div>
          </div>
          <div data-capture-hide style={{ display: "flex", gap: 6 }}>
            {chartBtn(() => copyPNG(groupBarRef, setCopiedA), copiedA, true)}
            {chartBtn(() => downloadPNG(groupBarRef, "chart-type-by-company.png"), false, false)}
          </div>
        </div>
        {companyStatusData.length === 0 ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
        ) : (
          <>
          <ResponsiveContainer width="100%" height={Math.max(companyStatusData.length * 128, 200)}>
            <BarChart data={companyStatusData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={230} tick={<CompanyTick />} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#F5F3FF" }} formatter={(v: number, n: string) => [`${v.toLocaleString()} ฉบับ`, n]} />
              {visibleTypes.flatMap((t) => [
                payVisible.paid ? (
                  <Bar key={`${t}_p`} dataKey={`${t}_paid`} name={`${t} · ชำระแล้ว`} stackId={t} fill={TYPE_COLOR[t]} maxBarSize={22}
                    radius={payVisible.unpaid ? [0, 0, 0, 0] : [0, 4, 4, 0]}
                    label={!payVisible.unpaid ? stackLabel(t) : undefined}
                    fillOpacity={activeSeries === undefined || activeSeries === t ? 1 : 0.2}
                    onMouseEnter={() => setActiveSeries(t)} onMouseLeave={() => setActiveSeries(undefined)} />
                ) : null,
                payVisible.unpaid ? (
                  <Bar key={`${t}_u`} dataKey={`${t}_unpaid`} name={`${t} · ยังไม่ชำระ`} stackId={t} fill={TYPE_COLOR[t]} maxBarSize={22} radius={[0, 4, 4, 0]}
                    label={stackLabel(t)}
                    fillOpacity={activeSeries === undefined || activeSeries === t ? 0.3 : 0.1}
                    onMouseEnter={() => setActiveSeries(t)} onMouseLeave={() => setActiveSeries(undefined)} />
                ) : null,
              ].filter(Boolean))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{groupBarTotal.toLocaleString()} ฉบับ</span>
          </div>
          <Chips items={[{ id: "paid", name: "ชำระแล้ว", color: PRIMARY }, { id: "unpaid", name: "ยังไม่ชำระ", color: "#9CA3AF" }]} hidden={hiddenPay}
            onToggle={(id) => setHiddenPay((prev) => toggleSet(prev, id))} onReset={() => setHiddenPay(new Set())} label="แสดง/ซ่อน สถานะการชำระเงิน" />
          <Chips items={DOC_TYPES.map((t) => ({ id: t.key, name: t.key, color: t.color }))} hidden={hiddenSeries}
            onToggle={(id) => setHiddenSeries((prev) => toggleSet(prev, id))} onReset={() => setHiddenSeries(new Set())} label="แสดง/ซ่อน ประเภทหนังสือ" />
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

        {/* Pie: total docs by ประเภทหนังสือ */}
        <div ref={pieRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>จำนวนหนังสืออนุญาตทั้งหมด</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามประเภทหนังสือ (ฉบับ)</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              {chartBtn(() => copyPNG(pieRef, setCopiedC), copiedC, true)}
              {chartBtn(() => downloadPNG(pieRef, "chart-type-pie.png"), false, false)}
            </div>
          </div>
          {docs.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={typePieData} cx="50%" cy="50%" innerRadius={56} outerRadius={92} paddingAngle={3} dataKey="value"
                    activeIndex={lockedPieIndex ?? activePieIndex}
                    activeShape={renderActiveShape as Parameters<typeof Pie>[0]["activeShape"]}
                    onMouseEnter={(_: unknown, i: number) => { if (lockedPieIndex === undefined) setActivePieIndex(i); }}
                    onMouseLeave={() => { if (lockedPieIndex === undefined) setActivePieIndex(undefined); }}
                    onClick={(_: unknown, i: number) => { setLockedPieIndex((prev) => prev === i ? undefined : i); setActivePieIndex(undefined); }}
                    cursor="pointer">
                    {typePieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString()} ฉบับ`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {typePieAll.map((d) => {
                  const hidden = hiddenPieType.has(d.name);
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
              <Chips items={DOC_TYPES.map((t) => ({ id: t.key, name: t.key, color: t.color }))} hidden={hiddenPieType}
                onToggle={(id) => setHiddenPieType((prev) => toggleSet(prev, id))} onReset={() => setHiddenPieType(new Set())} label="แสดง/ซ่อน ประเภทหนังสือ" />
            </>
          )}
        </div>
      </div>

      {/* Chart row 3 — money by company (left, horizontal) + money by type (right, vertical) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Money by company (horizontal) */}
        <div ref={moneyCoRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>จำนวนเงินที่ชำระค่าหนังสืออนุญาต</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการ (บาท)</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              {chartBtn(() => copyPNG(moneyCoRef, setCopiedD), copiedD, true)}
              {chartBtn(() => downloadPNG(moneyCoRef, "chart-money-by-company.png"), false, false)}
            </div>
          </div>
          {moneyCoData.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
          ) : (
            <>
            <ResponsiveContainer width="100%" height={Math.max(moneyCoData.length * 44, 140)}>
              <BarChart data={moneyCoData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toLocaleString()} />
                <YAxis type="category" dataKey="name" width={200} tick={<CompanyTick />} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F5F3FF" }} formatter={(v: number) => [`${v.toLocaleString()} บาท`, "ยอดชำระ"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}
                  onMouseEnter={(_: unknown, i: number) => setActiveMoneyCoIndex(i)} onMouseLeave={() => setActiveMoneyCoIndex(undefined)}
                  label={{ position: "right", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}>
                  {moneyCoData.map((d, i) => <Cell key={i} fill={moneyCoColor[d.id]} opacity={activeMoneyCoIndex === undefined || activeMoneyCoIndex === i ? 1 : 0.35} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{moneyCoTotal.toLocaleString()} บาท</span>
            </div>
            <Chips items={moneyCoAll.map((d) => ({ id: d.id, name: d.name, color: moneyCoColor[d.id] }))} hidden={hiddenMoneyCo}
              onToggle={(id) => setHiddenMoneyCo((prev) => toggleSet(prev, id))} onReset={() => setHiddenMoneyCo(new Set())} label="แสดง/ซ่อน ผู้ประกอบการ" />
            </>
          )}
        </div>

        {/* Money by type (vertical) */}
        <div ref={moneyTypeRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>จำนวนเงินที่ชำระค่าหนังสืออนุญาต</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามประเภทหนังสือ (บาท)</div>
            </div>
            <div data-capture-hide style={{ display: "flex", gap: 6 }}>
              {chartBtn(() => copyPNG(moneyTypeRef, setCopiedE), copiedE, true)}
              {chartBtn(() => downloadPNG(moneyTypeRef, "chart-money-by-type.png"), false, false)}
            </div>
          </div>
          {moneyTypeData.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>กดค้นหาเพื่อแสดงข้อมูล</div>
          ) : (
            <>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={moneyTypeData} margin={{ left: 10, right: 10, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#4B5563" }} axisLine={false} tickLine={false} />
                <YAxis type="number" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toLocaleString()} />
                <Tooltip cursor={{ fill: "#F5F3FF" }} formatter={(v: number, _n: string, p: { payload?: { name?: string } }) => [`${v.toLocaleString()} บาท`, p?.payload?.name ?? "ยอดชำระ"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}
                  onMouseEnter={(_: unknown, i: number) => setActiveMoneyTypeIndex(i)} onMouseLeave={() => setActiveMoneyTypeIndex(undefined)}
                  label={{ position: "top", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}>
                  {moneyTypeData.map((d, i) => <Cell key={i} fill={d.color} opacity={activeMoneyTypeIndex === undefined || activeMoneyTypeIndex === i ? 1 : 0.35} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{moneyTypeTotal.toLocaleString()} บาท</span>
            </div>
            <Chips items={DOC_TYPES.map((t) => ({ id: t.key, name: t.key, color: t.color }))} hidden={hiddenMoneyType2}
              onToggle={(id) => setHiddenMoneyType2((prev) => toggleSet(prev, id))} onReset={() => setHiddenMoneyType2(new Set())} label="แสดง/ซ่อน ประเภทหนังสือ" />
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการหนังสืออนุญาตให้ สั่ง ขาย ขนย้าย อาวุธและวัตถุ</span>
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
    </div>
  );
}
