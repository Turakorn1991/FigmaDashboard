import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, ChevronDown, X, Download, Copy, Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Table, ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";
import { WEAPON_ITEMS, UNIT_OPTIONS, COMPANY_OPTIONS, IMPORT_ROWS } from "../../data/weaponItems";
import type { ImportRow } from "../../data/weaponItems";

const PRIMARY = "#6574FF";
const MONEY = "#059669";
const FF = "'Noto Sans Thai', Inter, sans-serif";
const PALETTE = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#14B8A6", "#F97316"];

/* ─── Derived mock fields (ไม่มีใน source data) ─────────── */
const SRC_COUNTRIES = ["สหรัฐอเมริกา", "เยอรมนี", "อิตาลี", "ออสเตรีย", "เบลเยียม", "สาธารณรัฐเช็ก", "บราซิล", "เกาหลีใต้", "สวิตเซอร์แลนด์", "ตุรกี"];
const hashStr = (s: string) => { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) >>> 0; return n; };
const pad = (x: number) => String(x).padStart(2, "0");

const countryOf     = (r: ImportRow) => SRC_COUNTRIES[hashStr(r.weaponCode + r.docNo) % SRC_COUNTRIES.length];
const actualQtyOf   = (r: ImportRow) => Math.round(r.qty * (0.7 + (hashStr(r.docNo + r.id) % 31) / 100));
const roundOf       = (r: ImportRow) => (hashStr("r" + r.id + r.docNo) % 3) + 1;
const unitPriceOf   = (r: ImportRow) => 15 + (hashStr("p" + r.weaponCode) % 7986); // 15..8000 บาท
const totalValueOf  = (r: ImportRow) => actualQtyOf(r) * unitPriceOf(r);

const addDaysISO = (iso: string, n: number) => { const d = new Date(iso); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const isoToTH = (iso: string) => { const d = new Date(iso); if (isNaN(d.getTime())) return "-"; return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear() + 543}`; };
const notifyISOOf  = (r: ImportRow) => addDaysISO(r.dateISO, 3 + (hashStr("n" + r.id) % 18));  // 3..20 วันหลังอนุญาต
const approveISOOf = (r: ImportRow) => addDaysISO(notifyISOOf(r), 2 + (hashStr("a" + r.id) % 12)); // 2..13 วันหลังแจ้ง

const LBL: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const INPUT_H = 44;
const INPUT_RADIUS = 10;
const INPUT_BORDER = "1px solid #E5E7EB";
const SEL: React.CSSProperties = { width: "100%", height: INPUT_H, padding: "0 12px", fontSize: 13, border: INPUT_BORDER, borderRadius: INPUT_RADIUS, outline: "none", background: "#fff", color: "#374151", appearance: "none" };

/* ─── Thai calendar constants ─────────────────────────── */
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_DAYS_SHORT = ["อา","จ","อ","พ","พฤ","ศ","ส"];

/* ─── ThaiDateRangePicker ─────────────────────────────── */
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

  const fmt = (isoStr: string) => { if (!isoStr) return ""; const d = new Date(isoStr); if (isNaN(d.getTime())) return ""; return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear() + 543}`; };
  const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

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
          <span style={{ color: from ? "#374151" : "#9CA3AF" }}>{fmt(from) || "วันที่แจ้งเริ่มต้น"}</span>
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

/* ─── PNG capture helpers ─────────────────────────────── */
const captureChart = async (el: HTMLDivElement | null, fn: (el: HTMLDivElement) => Promise<void>) => {
  if (!el) return;
  const hidden = el.querySelectorAll<HTMLElement>("[data-capture-hide]");
  hidden.forEach((n) => { n.dataset.origDisplay = n.style.display; n.style.display = "none"; });
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  await fn(el);
  hidden.forEach((n) => { n.style.display = n.dataset.origDisplay ?? ""; });
};
const downloadPNG = (el: HTMLDivElement | null, filename: string) =>
  captureChart(el, async (e) => {
    const { toPng } = await import("html-to-image");
    const url = await toPng(e, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  });
const copyPNG = (el: HTMLDivElement | null, setCopied: (v: boolean) => void) =>
  captureChart(el, async (e) => {
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(e, { pixelRatio: 2, backgroundColor: "#ffffff" });
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error("copy failed", err); }
  });

/* ─── ChartCard header (Copy/PNG buttons) ─────────────── */
function ChartHeader({ title1, title2, onCopy, onPng, copied, filename }: { title1: string; title2: string; onCopy: () => void; onPng: () => void; copied: boolean; filename: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{title1}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>{title2}</div>
      </div>
      <div data-capture-hide style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onCopy} title="คัดลอกรูป"
          style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: copied ? "#059669" : "#6B7280", cursor: "pointer" }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "คัดลอกแล้ว" : "Copy"}
        </button>
        <button onClick={onPng} title={filename}
          style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#6B7280", cursor: "pointer" }}>
          <Download size={13} />PNG
        </button>
      </div>
    </div>
  );
}

type ChartDatum = { id: string; name: string; value: number };

/* ─── HorizontalBarCard — แยกตามผู้ประกอบการ ──────────── */
function HBarCard({ title1, title2, data, isMoney, unitLabel, filename, searched, chips }: {
  title1: string; title2: string; data: ChartDatum[]; isMoney: boolean; unitLabel: string; filename: string; searched: boolean;
  chips: { items: ChartDatum[]; hidden: Set<string>; onToggle: (id: string) => void; onReset: () => void };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const accent = isMoney ? MONEY : PRIMARY;
  const total = data.reduce((s, d) => s + d.value, 0);
  const totalStr = isMoney ? `${total.toLocaleString()} บาท` : `${total.toLocaleString()}${unitLabel ? ` ${unitLabel}` : ""}`;

  const Tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}>
        <div style={{ fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{label}</div>
        <div style={{ color: accent }}>{payload[0]?.value?.toLocaleString()} {isMoney ? "บาท" : unitLabel}</div>
      </div>
    );
  };

  return (
    <div ref={ref} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
      <ChartHeader title1={title1} title2={title2} copied={copied} filename={filename}
        onCopy={() => copyPNG(ref.current, setCopied)} onPng={() => downloadPNG(ref.current, filename)} />
      {data.length === 0 ? (
        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
          {searched ? "ไม่พบข้อมูล" : "กรุณาค้นหาข้อมูล"}
        </div>
      ) : (() => {
        const CHAR_W = 7.2, LINE_H = 15, MAX_W = 320;
        const yAxisW = Math.min(MAX_W, Math.max(...data.map((d) => d.name.length * CHAR_W), 80));
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
              {lines.map((l, i) => <text key={i} x={-6} y={offsetY + i * LINE_H} textAnchor="end" fill="#111827" fontSize={11} dominantBaseline="middle">{l}</text>)}
            </g>
          );
        };
        return (
          <ResponsiveContainer width="100%" height={Math.max(data.length * 52, 100)}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: isMoney ? 90 : 70, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D1D5DB" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#4B5563" }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={yAxisW} tick={<CustomYTick x={0} y={0} payload={{ value: "" }} />} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{ fill: "#F5F3FF" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}
                label={{ position: "right", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}
                onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} opacity={activeIndex === undefined || activeIndex === i ? 1 : 0.4} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      })()}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{totalStr}</span>
      </div>
      {/* Toggle chips */}
      <div data-capture-hide style={{ marginTop: 14, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>แสดง/ซ่อน ผู้ประกอบการ</span>
          {chips.hidden.size > 0 && <button onClick={chips.onReset} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {chips.items.map((c, i) => {
            const hidden = chips.hidden.has(c.id);
            return (
              <button key={c.id} onClick={() => chips.onToggle(c.id)}
                style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PALETTE[i % PALETTE.length]}`, background: hidden ? "#F9FAFB" : PALETTE[i % PALETTE.length] + "22", color: hidden ? "#9CA3AF" : PALETTE[i % PALETTE.length], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── VerticalBarCard — Top 5 ประเทศแหล่งที่มา ─────────── */
function VBarCard({ title1, title2, data, isMoney, unitLabel, filename, searched, chips }: {
  title1: string; title2: string; data: { name: string; value: number }[]; isMoney: boolean; unitLabel: string; filename: string; searched: boolean;
  chips?: { items: { name: string }[]; hidden: Set<string>; onToggle: (name: string) => void; onReset: () => void };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const accent = isMoney ? MONEY : PRIMARY;
  const total = data.reduce((s, d) => s + d.value, 0);
  const totalStr = isMoney ? `${total.toLocaleString()} บาท` : `${total.toLocaleString()}${unitLabel ? ` ${unitLabel}` : ""}`;

  const Tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}>
        <div style={{ fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>{label}</div>
        <div style={{ color: accent }}>{payload[0]?.value?.toLocaleString()} {isMoney ? "บาท" : unitLabel}</div>
      </div>
    );
  };

  return (
    <div ref={ref} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
      <ChartHeader title1={title1} title2={title2} copied={copied} filename={filename}
        onCopy={() => copyPNG(ref.current, setCopied)} onPng={() => downloadPNG(ref.current, filename)} />
      {data.length === 0 ? (
        <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
          {searched ? "ไม่พบข้อมูล" : "กรุณาค้นหาข้อมูล"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ left: 10, right: 20, top: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} interval={0} />
            <YAxis type="number" tick={{ fontSize: 11, fill: "#4B5563" }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} cursor={{ fill: "#F5F3FF" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}
              label={{ position: "top", fontSize: 10, fill: "#374151", fontWeight: 600, formatter: (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString() }}
              onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} opacity={activeIndex === undefined || activeIndex === i ? 1 : 0.4} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม Top 5</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{totalStr}</span>
      </div>
      {/* Toggle chips — ประเทศแหล่งที่มา */}
      {chips && (
        <div data-capture-hide style={{ marginTop: 14, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>แสดง/ซ่อน ประเทศแหล่งที่มา</span>
            {chips.hidden.size > 0 && <button onClick={chips.onReset} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chips.items.map((c, i) => {
              const hidden = chips.hidden.has(c.name);
              return (
                <button key={c.name} onClick={() => chips.onToggle(c.name)}
                  style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PALETTE[i % PALETTE.length]}`, background: hidden ? "#F9FAFB" : PALETTE[i % PALETTE.length] + "22", color: hidden ? "#9CA3AF" : PALETTE[i % PALETTE.length], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export function Page6ImportA8() {
  const [f_dateFrom,  setDateFrom]  = useState("");
  const [f_dateTo,    setDateTo]    = useState("");
  const [f_companies, setCompanies] = useState<string[]>([]);
  const [f_unit,      setUnit]      = useState("");
  const [f_weapons,   setWeapons]   = useState<string[]>([]);
  const [a, setA] = useState({ dateFrom: "", dateTo: "", companies: [] as string[], unit: "", weapons: [] as string[] });
  const [searched, setSearched] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [hiddenCompanies, setHiddenCompanies] = useState<Set<string>>(new Set());
  const toggleCompany = (id: string) => setHiddenCompanies((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [hiddenCountries, setHiddenCountries] = useState<Set<string>>(new Set());
  const toggleCountry = (c: string) => setHiddenCountries((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });

  const handleSearch = () => { setA({ dateFrom: f_dateFrom, dateTo: f_dateTo, companies: f_companies, unit: f_unit, weapons: f_weapons }); setSearched(true); setTablePage(1); };
  const handleReset  = () => {
    setDateFrom(""); setDateTo(""); setCompanies([]); setUnit(""); setWeapons([]);
    setA({ dateFrom: "", dateTo: "", companies: [], unit: "", weapons: [] });
    setSearched(false); setHiddenCompanies(new Set());
  };

  const canSearch = !!f_unit && f_weapons.length > 0;

  /* filtered rows — อิงข้อมูลจริงจาก IMPORT_ROWS, กรองตามวันที่แจ้งนำเข้า */
  const rows = !searched ? [] : IMPORT_ROWS.filter((r) => {
    if (a.unit && r.unit !== a.unit) return false;
    if (a.companies.length && !a.companies.includes(r.companyId)) return false;
    if (a.weapons.length && !a.weapons.includes(r.weaponCode)) return false;
    const nISO = notifyISOOf(r);
    if (a.dateFrom && nISO < a.dateFrom) return false;
    if (a.dateTo && nISO > a.dateTo) return false;
    return true;
  });

  const filteredWeaponOptions = WEAPON_ITEMS
    .filter((w) => !f_unit || w.unit === f_unit)
    .map((w) => ({ id: w.id, label: w.name }));

  /* ─── chart data ─── */
  const companyQtyMap: Record<string, ChartDatum> = {};
  const companyValMap: Record<string, ChartDatum> = {};
  rows.forEach((r) => {
    if (!companyQtyMap[r.companyId]) companyQtyMap[r.companyId] = { id: r.companyId, name: r.company, value: 0 };
    if (!companyValMap[r.companyId]) companyValMap[r.companyId] = { id: r.companyId, name: r.company, value: 0 };
    companyQtyMap[r.companyId].value += actualQtyOf(r);
    companyValMap[r.companyId].value += totalValueOf(r);
  });
  const companyQtyData = Object.values(companyQtyMap).filter((d) => !hiddenCompanies.has(d.id)).sort((x, y) => y.value - x.value);
  const companyValData = Object.values(companyValMap).filter((d) => !hiddenCompanies.has(d.id)).sort((x, y) => y.value - x.value);

  const countryQtyMap: Record<string, number> = {};
  const countryValMap: Record<string, number> = {};
  rows.forEach((r) => {
    const c = countryOf(r);
    countryQtyMap[c] = (countryQtyMap[c] ?? 0) + actualQtyOf(r);
    countryValMap[c] = (countryValMap[c] ?? 0) + totalValueOf(r);
  });
  const allCountryQty = Object.entries(countryQtyMap).map(([name, value]) => ({ name, value })).sort((x, y) => y.value - x.value);
  const allCountryVal = Object.entries(countryValMap).map(([name, value]) => ({ name, value })).sort((x, y) => y.value - x.value);
  // chips = Top 5 base (เท่าจำนวนแท่ง); ซ่อนแล้วแท่งหาย ไม่ดึงตัวที่ 6 ขึ้นมา
  const top5QtyBase = allCountryQty.slice(0, 5);
  const top5ValBase = allCountryVal.slice(0, 5);
  const top5CountryQty = top5QtyBase.filter((d) => !hiddenCountries.has(d.name));
  const top5CountryVal = top5ValBase.filter((d) => !hiddenCountries.has(d.name));

  const companyChips = Object.values(companyQtyMap).sort((x, y) => y.value - x.value);

  /* ─── table ─── */
  const tableData = rows.map((r) => {
    const nISO = notifyISOOf(r);
    const aISO = approveISOOf(r);
    const uPrice = unitPriceOf(r);
    const aQty = actualQtyOf(r);
    return {
      key: r.id,
      docNo: r.docNo,
      dateTH: r.dateTH,
      expireTH: r.expireTH,
      company: r.company,
      notifyTH: isoToTH(nISO),
      approveTH: isoToTH(aISO),
      weaponCode: r.weaponCode,
      weaponName: r.weaponName,
      unit: r.unit,
      qty: r.qty,
      round: roundOf(r),
      actualQty: aQty,
      unitPrice: uPrice,
      totalValue: aQty * uPrice,
      country: countryOf(r),
    };
  });
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
    { title: "#",                    key: "no",         width: 52,  fixed: "left" as const, align: "center" as const, render: (_: unknown, __: TableRow, i: number) => (tablePage - 1) * tablePageSize + i + 1 },
    { title: "เลขที่หนังสือ อ.8",     dataIndex: "docNo",      key: "docNo",      width: 120, ...getColSearchProps("docNo", "เลขที่หนังสือ อ.8") },
    { title: "วันที่อนุญาต อ.8",      dataIndex: "dateTH",     key: "dateTH",     width: 130, sorter: (x, y) => x.dateTH.localeCompare(y.dateTH) },
    { title: "วันที่หมดอายุ อ.8",     dataIndex: "expireTH",   key: "expireTH",   width: 130 },
    { title: "ผู้ประกอบการ",          dataIndex: "company",    key: "company",    width: 240, sorter: (x, y) => x.company.localeCompare(y.company, "th"), ...getColSearchProps("company", "ผู้ประกอบการ") },
    { title: "วันที่แจ้งนำเข้า",       dataIndex: "notifyTH",   key: "notifyTH",   width: 130 },
    { title: "วันที่อนุมัตินำเข้า",    dataIndex: "approveTH",  key: "approveTH",  width: 140 },
    { title: "รหัสวัตถุหรืออาวุธ",     dataIndex: "weaponCode", key: "weaponCode", width: 140, sorter: (x, y) => x.weaponCode.localeCompare(y.weaponCode), ...getColSearchProps("weaponCode", "รหัสวัตถุหรืออาวุธ"), render: (v: string) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
    { title: "วัตถุหรืออาวุธ",         dataIndex: "weaponName", key: "weaponName", width: 280, sorter: (x, y) => x.weaponName.localeCompare(y.weaponName, "th"), ...getColSearchProps("weaponName", "วัตถุหรืออาวุธ") },
    { title: "หน่วยนับ",              dataIndex: "unit",       key: "unit",       width: 100, align: "center" as const, render: (v: string) => <span style={{ color: "#374151" }}>{v || "-"}</span> },
    { title: "จำนวนที่ได้รับอนุญาต",   dataIndex: "qty",        key: "qty",        width: 150, align: "right" as const, sorter: (x, y) => x.qty - y.qty, render: (v: number) => <span style={{ color: PRIMARY, fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "ครั้งที่",              dataIndex: "round",      key: "round",      width: 80,  align: "center" as const, sorter: (x, y) => x.round - y.round },
    { title: "จำนวนที่นำเข้าจริง",     dataIndex: "actualQty",  key: "actualQty",  width: 150, align: "right" as const, sorter: (x, y) => x.actualQty - y.actualQty, render: (v: number) => <span style={{ color: "#0EA5E9", fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "ราคาต่อหน่วยวัตถุที่นำเข้า", dataIndex: "unitPrice", key: "unitPrice", width: 180, align: "right" as const, sorter: (x, y) => x.unitPrice - y.unitPrice, render: (v: number) => <span style={{ color: "#374151" }}>{v.toLocaleString()}</span> },
    { title: "รวมมูลค่า (บาท)",        dataIndex: "totalValue", key: "totalValue", width: 160, align: "right" as const, sorter: (x, y) => x.totalValue - y.totalValue, render: (v: number) => <span style={{ color: MONEY, fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "ประเทศแหล่งที่มา(ต้นทาง)", dataIndex: "country",  key: "country",    width: 170, sorter: (x, y) => x.country.localeCompare(y.country, "th"), ...getColSearchProps("country", "ประเทศแหล่งที่มา") },
  ];

  const antTableProps: TableProps<TableRow> = {
    columns: antColumns,
    dataSource: tableData,
    size: "middle",
    pagination: { current: tablePage, pageSize: tablePageSize, showSizeChanger: true, pageSizeOptions: ["10","20","50"], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, locale: { items_per_page: "/หน้า", jump_to: "ไปที่", page: "หน้า" }, onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); } },
    scroll: { x: 2400 },
  };

  const exportRawExcel = () => {
    const headers = [
      "#","เลขที่หนังสือ อ.8","วันที่อนุญาต อ.8","วันที่หมดอายุ อ.8","ผู้ประกอบการ",
      "วันที่แจ้งนำเข้า","วันที่อนุมัตินำเข้า","รหัสวัตถุหรืออาวุธ","วัตถุหรืออาวุธ","หน่วยนับ",
      "จำนวนที่ได้รับอนุญาต","ครั้งที่","จำนวนที่นำเข้าจริง","ราคาต่อหน่วยวัตถุที่นำเข้า","รวมมูลค่า","ประเทศแหล่งที่มา(ต้นทาง)",
    ];
    const dataRows = tableData.map((r, i) => [
      i + 1, r.docNo, r.dateTH, r.expireTH, r.company,
      r.notifyTH, r.approveTH, r.weaponCode, r.weaponName, r.unit || "-",
      r.qty, r.round, r.actualQty, r.unitPrice, r.totalValue, r.country,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws["!cols"] = headers.map((_, i) => ({ wch: [6,16,16,16,40,15,16,16,44,10,18,8,16,20,16,22][i] ?? 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลดิบ");
    const n = new Date();
    const ts = `${n.getFullYear()}${pad(n.getMonth() + 1)}${pad(n.getDate())}${pad(n.getHours())}${pad(n.getMinutes())}`;
    XLSX.writeFile(wb, `ยอดการแจ้งนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8_${ts}.xlsx`);
  };

  const unitSuffix = searched && a.unit ? a.unit : "";
  const unitTag = unitSuffix ? ` (${unitSuffix})` : "";

  return (
    <div style={{ fontFamily: FF }}>
      {/* Header */}
      <div style={{ fontSize: 12, color: "#8B8E95", marginBottom: 4 }}>ระบบ Dashboard / Dashboard</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>ยอดการแจ้งนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8</div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 16 }}>ค้นหาข้อมูล</div>

        {/* Row 1: ช่วงวันที่แจ้งการนำเข้า (1/3) | ผู้ประกอบการ (2/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>ช่วงวันที่แจ้งการนำเข้า</label>
            <ThaiDateRangePicker from={f_dateFrom} to={f_dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to); }} />
          </div>
          <div>
            <label style={LBL}>ผู้ประกอบการ</label>
            <MultiSelect placeholder="ทั้งหมด" options={COMPANY_OPTIONS.map((c) => ({ id: c.id, label: c.name }))} selected={f_companies} onChange={setCompanies} showSearch />
          </div>
        </div>

        {/* Row 2: หน่วยนับ (1/3) | วัตถุหรืออาวุธ (2/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, alignItems: "end" }}>
          <div>
            <label style={LBL}>หน่วยนับ <span style={{ color: "#EF4444" }}>*</span></label>
            <SelectField value={f_unit} onChange={(v) => { setUnit(v); setWeapons([]); }} placeholder="เลือกหน่วยนับ" options={UNIT_OPTIONS.map((u) => ({ value: u.name, label: u.name }))} />
          </div>
          <div>
            <label style={LBL}>วัตถุหรืออาวุธ <span style={{ color: "#EF4444" }}>*</span></label>
            <MultiSelect placeholder="เลือกวัตถุหรืออาวุธ" options={filteredWeaponOptions} selected={f_weapons} onChange={setWeapons} showSearch />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={handleReset}
            style={{ height: 44, padding: "0 20px", fontSize: 13, border: `1.5px solid ${PRIMARY}`, borderRadius: 10, background: "#fff", color: PRIMARY, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
            รีเซ็ต
          </button>
          <button onClick={handleSearch} disabled={!canSearch}
            style={{ width: 44, height: 44, borderRadius: 10, background: !canSearch ? "#D1D5DB" : PRIMARY, border: "none", cursor: !canSearch ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (canSearch) (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
            onMouseLeave={(e) => { if (canSearch) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
            <Search size={17} color="#fff" />
          </button>
        </div>
      </div>

      {/* Charts row 1: จำนวน */}
      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: 16, marginBottom: 16 }}>
        <HBarCard searched={searched} isMoney={false} unitLabel={unitSuffix}
          title1="ยอดการแจ้งนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8"
          title2={`แยกตามผู้ประกอบการ${unitTag}`}
          data={companyQtyData} filename="chart-a8-company-qty.png"
          chips={{ items: companyChips, hidden: hiddenCompanies, onToggle: toggleCompany, onReset: () => setHiddenCompanies(new Set()) }} />
        <VBarCard searched={searched} isMoney={false} unitLabel={unitSuffix}
          title1="ยอดการแจ้งนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8"
          title2={`Top 5 แยกตามประเทศแหล่งที่มา(ต้นทาง)${unitTag}`}
          data={top5CountryQty} filename="chart-a8-country-qty.png"
          chips={{ items: top5QtyBase, hidden: hiddenCountries, onToggle: toggleCountry, onReset: () => setHiddenCountries(new Set()) }} />
      </div>

      {/* Charts row 2: มูลค่า (บาท) */}
      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: 16, marginBottom: 16 }}>
        <HBarCard searched={searched} isMoney={true} unitLabel=""
          title1="ยอดมูลค่าการนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8"
          title2="แยกตามผู้ประกอบการ (บาท)"
          data={companyValData} filename="chart-a8-company-value.png"
          chips={{ items: companyChips, hidden: hiddenCompanies, onToggle: toggleCompany, onReset: () => setHiddenCompanies(new Set()) }} />
        <VBarCard searched={searched} isMoney={true} unitLabel=""
          title1="ยอดมูลค่าการนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8"
          title2="Top 5 แยกตามประเทศแหล่งที่มา(ต้นทาง) (บาท)"
          data={top5CountryVal} filename="chart-a8-country-value.png"
          chips={{ items: top5ValBase, hidden: hiddenCountries, onToggle: toggleCountry, onReset: () => setHiddenCountries(new Set()) }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการยอดการแจ้งนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ ตามแบบ อ.8</span>
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
