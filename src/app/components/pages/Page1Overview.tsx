import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, FileText, ChevronDown, X, Download, Copy, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";

const PRIMARY = "#6574FF";
const FF = "'Noto Sans Thai', Inter, sans-serif";
const PALETTE = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#14B8A6", "#F97316"];

const COMPANIES = [
  { id: "1",  name: "บริษัท เนแรค อาร์มส อินดัสตรี จำกัด" },
  { id: "2",  name: "บริษัท ณธรรศชาตรี จำกัด" },
  { id: "3",  name: "บริษัท รอยัล แอมมูนิชั่น จำกัด" },
  { id: "4",  name: "บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด" },
  { id: "5",  name: "บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด" },
  { id: "6",  name: "บริษัท บุลเล็ท มาสเตอร์ จำกัด" },
  { id: "7",  name: "บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด" },
  { id: "8",  name: "บริษัท ไทยอามส์ จำกัด" },
  { id: "14", name: "บริษัท สยาม แอมมูนิชั่น จำกัด" },
  { id: "15", name: "บริษัท ไทย ทรัพย์นคร จำกัด" },
];

const BUYER_GROUPS = [
  { id: "1", label: "ทหาร" },
  { id: "2", label: "ตำรวจ" },
  { id: "3", label: "สมาคม" },
  { id: "9", label: "อื่น ๆ" },
  { id: "0", label: "ไม่ระบุ" },
];

const REGIONS = [
  { id: "C",  label: "ภาคกลาง" },
  { id: "E",  label: "ภาคตะวันออก" },
  { id: "W",  label: "ภาคตะวันตก" },
  { id: "N",  label: "ภาคเหนือ" },
  { id: "NE", label: "ภาคตะวันออกเฉียงเหนือ" },
  { id: "S",  label: "ภาคใต้" },
];

const WEAPONS = [
  { id: "P-0026", label: "กระสุนปืน .32 นิ้ว (จริง)" },
  { id: "P-0027", label: "กระสุนปืน .357 นิ้ว (จริง)" },
  { id: "P-0028", label: "กระสุนปืน .380 นิ้ว (จริง)" },
  { id: "P-0031", label: "กระสุนปืน .40 นิ้ว (จริง)" },
  { id: "P-0032", label: "กระสุนปืน .44 นิ้ว (จริง)" },
  { id: "P-0033", label: "กระสุนปืน .45 นิ้ว (จริง)" },
  { id: "P-0034", label: "กระสุนปืน 9 มิลลิเมตร (จริง)" },
  { id: "P-0035", label: "กระสุนปืน 5.56 มิลลิเมตร (จริง)" },
  { id: "P-0036", label: "กระสุนปืน 7.62 มิลลิเมตร (จริง)" },
  { id: "P-0037", label: "กระสุนปืน 6.35 มิลลิเมตร (จริง)" },
  { id: "P-0038", label: "กระสุนปืน .22 นิ้ว (จริง)" },
  { id: "P-0039", label: "กระสุนปืน .38 นิ้ว (จริง)" },
  { id: "P-0040", label: "กระสุนปืนลูกซอง 12 เกจ (จริง)" },
  { id: "P-0041", label: "กระสุนปืนลูกซอง 16 เกจ (จริง)" },
  { id: "P-0042", label: "กระสุนปืนลูกซอง 20 เกจ (จริง)" },
  { id: "P-0050", label: "กระสุนปืนไรเฟิล .223 นิ้ว" },
  { id: "P-0051", label: "กระสุนปืนไรเฟิล .308 นิ้ว" },
  { id: "P-0052", label: "กระสุนปืนไรเฟิล .30-06 นิ้ว" },
  { id: "P-0053", label: "กระสุนปืนไรเฟิล 7.62x39 มม." },
  { id: "P-0054", label: "กระสุนปืนไรเฟิล 7.62x54R มม." },
  { id: "P-0060", label: "กระสุนปืนกล 12.7 มิลลิเมตร" },
  { id: "P-0061", label: "กระสุนปืนกล 14.5 มิลลิเมตร" },
  { id: "P-0062", label: "กระสุนปืนกลเบา 5.56 มิลลิเมตร" },
  { id: "P-0063", label: "กระสุนปืนกลเบา 7.62 มิลลิเมตร" },
  { id: "P-0070", label: "กระสุนฝึก .32 นิ้ว" },
  { id: "P-0071", label: "กระสุนฝึก .38 นิ้ว" },
  { id: "P-0072", label: "กระสุนฝึก 9 มิลลิเมตร" },
  { id: "P-0073", label: "กระสุนฝึก 5.56 มิลลิเมตร" },
  { id: "P-0074", label: "กระสุนฝึก 7.62 มิลลิเมตร" },
  { id: "P-0080", label: "กระสุนยาง (ควบคุมฝูงชน)" },
  { id: "P-0081", label: "กระสุนแก๊สน้ำตา" },
  { id: "P-0082", label: "กระสุนสีทำเครื่องหมาย" },
  { id: "P-0090", label: "ระเบิดมือ (สังหาร)" },
  { id: "P-0091", label: "ระเบิดมือ (ควัน)" },
  { id: "P-0092", label: "ระเบิดมือ (แสงสว่าง)" },
  { id: "P-0100", label: "ระเบิด RPG-7" },
  { id: "P-0101", label: "ระเบิด M72 LAW" },
  { id: "P-0110", label: "กระสุนปืนใหญ่ 105 มม." },
  { id: "P-0111", label: "กระสุนปืนใหญ่ 155 มม." },
  { id: "P-0120", label: "กระสุนครก 60 มม." },
  { id: "P-0121", label: "กระสุนครก 81 มม." },
  { id: "P-0122", label: "กระสุนครก 120 มม." },
  { id: "P-0130", label: "กระสุนเจาะเกราะ HEAT" },
  { id: "P-0131", label: "กระสุนเจาะเกราะ APDS" },
  { id: "P-0140", label: "จรวด 2.75 นิ้ว" },
  { id: "P-0141", label: "จรวด 5 นิ้ว" },
  { id: "P-0150", label: "ทุ่นระเบิดสังหารบุคคล" },
  { id: "P-0151", label: "ทุ่นระเบิดต่อสู้รถถัง" },
  { id: "P-0160", label: "วัตถุระเบิด TNT" },
  { id: "P-0161", label: "วัตถุระเบิด C-4" },
  { id: "P-0162", label: "วัตถุระเบิด Semtex" },
  { id: "P-0170", label: "ดินปืนไร้ควัน" },
  { id: "P-0171", label: "ดินปืนดำ" },
  { id: "P-0180", label: "ชนวนระเบิด (ไฟฟ้า)" },
  { id: "P-0181", label: "ชนวนระเบิด (ไม่ใช้ไฟฟ้า)" },
  { id: "P-0190", label: "กระสุน .50 BMG" },
  { id: "P-0191", label: "กระสุน 20 มม. (ปืนใหญ่อากาศ)" },
  { id: "P-0192", label: "กระสุน 23 มม. (ปืนใหญ่อากาศ)" },
  { id: "P-0193", label: "กระสุน 30 มม. (ปืนใหญ่อากาศ)" },
  { id: "P-0500", label: "อาวุธปืนพก (ประเภท A)" },
  { id: "P-0501", label: "อาวุธปืนพก (ประเภท B)" },
  { id: "P-0510", label: "ปืนเล็กยาวอัตโนมัติ" },
  { id: "P-0511", label: "ปืนเล็กยาวกึ่งอัตโนมัติ" },
  { id: "P-0520", label: "ปืนกลมือ" },
  { id: "P-0530", label: "ปืนลูกซองสั้น" },
  { id: "P-0531", label: "ปืนลูกซองยาว" },
  { id: "P-1000", label: "อาวุธต่อสู้รถถัง (ATM)" },
  { id: "P-1001", label: "อาวุธนำวิถีต่อสู้อากาศยาน (SAM)" },
  { id: "P-1939", label: "อาวุธอื่นๆ ตามที่กำหนด" },
];

interface MockRow {
  id: number; companyId: string; company: string;
  buyerGroupId: string; regionId: string; weaponId: string;
  qty: number; date: string; status: string;
}

const MOCK_ROWS: MockRow[] = [
  { id:1,  companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"1", regionId:"S",  weaponId:"P-0035", qty:230000, date:"2568-01-15", status:"อนุมัติ" },
  { id:2,  companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"2", regionId:"C",  weaponId:"P-0034", qty:85000,  date:"2568-02-10", status:"อนุมัติ" },
  { id:3,  companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"1", regionId:"N",  weaponId:"P-0036", qty:150000, date:"2568-02-20", status:"อนุมัติ" },
  { id:4,  companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"1", regionId:"NE", weaponId:"P-0035", qty:320000, date:"2568-03-05", status:"อนุมัติ" },
  { id:5,  companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"2", regionId:"E",  weaponId:"P-0034", qty:65000,  date:"2568-03-18", status:"กำลังดำเนินการ" },
  { id:6,  companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"3", regionId:"W",  weaponId:"P-0160", qty:12000,  date:"2568-04-01", status:"อนุมัติ" },
  { id:7,  companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"1", regionId:"C",  weaponId:"P-0060", qty:45000,  date:"2568-04-12", status:"อนุมัติ" },
  { id:8,  companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"9", regionId:"C",  weaponId:"P-0033", qty:8500,   date:"2568-04-25", status:"รอดำเนินการ" },
  { id:9,  companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"0", regionId:"S",  weaponId:"P-0161", qty:3200,   date:"2568-05-02", status:"อนุมัติ" },
  { id:10, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"2", regionId:"N",  weaponId:"P-0028", qty:22000,  date:"2568-05-14", status:"อนุมัติ" },
  { id:11, companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"1", regionId:"NE", weaponId:"P-0035", qty:180000, date:"2568-05-20", status:"อนุมัติ" },
  { id:12, companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"2", regionId:"C",  weaponId:"P-0034", qty:75000,  date:"2568-06-03", status:"กำลังดำเนินการ" },
  { id:13, companyId:"7",  company:"บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด",            buyerGroupId:"1", regionId:"S",  weaponId:"P-0036", qty:95000,  date:"2568-06-10", status:"อนุมัติ" },
  { id:14, companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"3", regionId:"E",  weaponId:"P-0050", qty:5500,   date:"2568-06-18", status:"อนุมัติ" },
  { id:15, companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"1", regionId:"S",  weaponId:"P-0035", qty:410000, date:"2568-07-01", status:"อนุมัติ" },
  { id:16, companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"9", regionId:"N",  weaponId:"P-0090", qty:1200,   date:"2568-07-15", status:"อนุมัติ" },
  { id:17, companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"2", regionId:"W",  weaponId:"P-0034", qty:48000,  date:"2568-07-22", status:"อนุมัติ" },
  { id:18, companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"1", regionId:"NE", weaponId:"P-0063", qty:28000,  date:"2568-08-05", status:"รอดำเนินการ" },
  { id:19, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"2", regionId:"C",  weaponId:"P-0031", qty:15000,  date:"2568-08-12", status:"อนุมัติ" },
  { id:20, companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"0", regionId:"E",  weaponId:"P-0170", qty:2200,   date:"2568-08-20", status:"อนุมัติ" },
];

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

/* ─── SelectField ─────────────────────────────────────── */
function SelectField({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void;
  placeholder: string; options: { value: string; label: string }[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={SEL}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={15} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
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
  const [f_dateFrom, setDateFrom] = useState("");
  const [f_dateTo,   setDateTo]   = useState("");
  const [f_company,  setCompany]  = useState("");
  const [f_region,   setRegion]   = useState("");
  const [f_buyers,   setBuyers]   = useState<string[]>([]);
  const [f_weapons,  setWeapons]  = useState<string[]>([]);
  const [a, setA] = useState({ company: "", region: "", buyers: [] as string[], weapons: [] as string[] });

  const handleSearch = () => setA({ company: f_company, region: f_region, buyers: f_buyers, weapons: f_weapons });
  const handleReset  = () => {
    setDateFrom(""); setDateTo(""); setCompany(""); setRegion(""); setBuyers([]); setWeapons([]);
    setA({ company: "", region: "", buyers: [], weapons: [] });
  };

  /* chart interaction */
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>(undefined);
  const [hiddenCompanies, setHiddenCompanies] = useState<Set<string>>(new Set());
  const [hiddenBuyers,    setHiddenBuyers]    = useState<Set<string>>(new Set());
  const toggleCompany = (id: string) => setHiddenCompanies((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleBuyer   = (id: string) => setHiddenBuyers((s)    => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const [copiedBar, setCopiedBar] = useState(false);
  const [copiedPie, setCopiedPie] = useState(false);

  const captureChart = async (ref: React.RefObject<HTMLDivElement>, fn: (el: HTMLDivElement) => Promise<void>) => {
    const el = ref.current;
    if (!el) return;
    const hidden = el.querySelectorAll<HTMLElement>("[data-capture-hide]");
    const shown  = el.querySelectorAll<HTMLElement>("[data-capture-show]");
    hidden.forEach((n) => { n.dataset.origDisplay = n.style.display; n.style.display = "none"; });
    shown.forEach((n)  => { n.dataset.origDisplay = n.style.display; n.style.display = "block"; });
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
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });

  /* filtered rows */
  const rows = MOCK_ROWS.filter((r) => {
    if (a.company  && r.companyId    !== a.company)             return false;
    if (a.region   && r.regionId     !== a.region)              return false;
    if (a.buyers.length  && !a.buyers.includes(r.buyerGroupId)) return false;
    if (a.weapons.length && !a.weapons.includes(r.weaponId))    return false;
    return true;
  });

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  /* bar chart — all companies always shown */
  const chartMap: Record<string, { id: string; name: string; qty: number }> = {};
  COMPANIES.forEach((c) => { chartMap[c.id] = { id: c.id, name: c.name, qty: 0 }; });
  rows.forEach((r) => { if (chartMap[r.companyId]) chartMap[r.companyId].qty += r.qty; });
  const chartData = Object.values(chartMap).filter((d) => !hiddenCompanies.has(d.id)).sort((a, b) => b.qty - a.qty);

  /* pie chart — buyer groups always shown */
  const PIE_COLORS = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
  const buyerPieData = BUYER_GROUPS.map((bg, i) => ({
    id: bg.id, name: bg.label,
    value: hiddenBuyers.has(bg.id) ? 0 : rows.filter((r) => r.buyerGroupId === bg.id).reduce((s, r) => s + r.qty, 0),
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
      <div style={{ fontSize: 12, color: "#8B8E95", marginBottom: 4 }}>ระบบรายงาน / รายงาน</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>รายงานยอดขายกระสุนปืนให้หน่วยงานตามมาตรา 7</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", fontSize: 13, border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}>
            <FileSpreadsheet size={15} color="#059669" />Export Excel
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", fontSize: 13, border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}>
            <FileText size={15} color="#DC2626" />Export PDF
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 16 }}>ค้นหาข้อมูล</div>

        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>วันที่อนุญาต เริ่ม</label>
            <input type="date" value={f_dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ ...SEL, padding: "0 12px" }} />
          </div>
          <div>
            <label style={LBL}>วันที่อนุญาต สิ้นสุด</label>
            <input type="date" value={f_dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ ...SEL, padding: "0 12px" }} />
          </div>
          <div>
            <label style={LBL}>ผู้ประกอบการ</label>
            <SelectField value={f_company} onChange={setCompany} placeholder="ทั้งหมด"
              options={COMPANIES.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <div>
            <label style={LBL}>ภาค</label>
            <SelectField value={f_region} onChange={setRegion} placeholder="ทั้งหมด"
              options={REGIONS.map((r) => ({ value: r.id, label: r.label }))} />
          </div>
        </div>

        {/* Row 2 — 1/4 กลุ่มหน่วยผู้ซื้อ | 2/4 อาวุธ | 1/4 ปุ่ม */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12, alignItems: "end" }}>
          <div>
            <label style={LBL}>กลุ่มหน่วยผู้ซื้อ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={BUYER_GROUPS.map((b) => ({ id: b.id, label: b.label }))}
              selected={f_buyers} onChange={setBuyers} />
          </div>
          <div>
            <label style={LBL}>อาวุธ/กระสุน</label>
            <MultiSelect placeholder="ทั้งหมด" options={WEAPONS} selected={f_weapons} onChange={setWeapons} showSearch />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleReset}
              style={{ height: 40, padding: "0 20px", fontSize: 13, border: `1.5px solid ${PRIMARY}`, borderRadius: 8, background: "#fff", color: PRIMARY, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
              รีเซ็ต
            </button>
            <button onClick={handleSearch}
              style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: PRIMARY, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
              <Search size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Bar chart */}
        <div ref={barChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div data-capture-show style={{ display: "none", fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>ยอดขายกระสุนปืนให้หน่วยงานตามมาตรา 7</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการ (นัด)</div>
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
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 46, 100)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 70, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={280} tick={{ fontSize: 12, fill: "#454A55" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F5F3FF" }} />
              <Bar dataKey="qty" radius={[0, 6, 6, 0]} maxBarSize={26}
                label={{ position: "right", fontSize: 11, fill: "#9CA3AF", formatter: (v: number) => v.toLocaleString() }}
                onMouseEnter={(_: unknown, index: number) => setActiveBarIndex(index)}
                onMouseLeave={() => setActiveBarIndex(undefined)}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]}
                    opacity={activeBarIndex === undefined || activeBarIndex === i ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Toggle chips */}
          <div data-capture-hide style={{ marginTop: 14, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#8B8E95", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>แสดง/ซ่อน ผู้ประกอบการ</span>
              {hiddenCompanies.size > 0 && (
                <button onClick={() => setHiddenCompanies(new Set())} style={{ fontSize: 11, color: PRIMARY, background: "#EEF2FF", border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>แสดงทั้งหมด</button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COMPANIES.map((c, i) => {
                const hidden = hiddenCompanies.has(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCompany(c.id)}
                    style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PALETTE[i % PALETTE.length]}`, background: hidden ? "#F9FAFB" : PALETTE[i % PALETTE.length] + "22", color: hidden ? "#9CA3AF" : PALETTE[i % PALETTE.length], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                    {c.name.replace("บริษัท ", "").replace(" จำกัด", "")}
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
              <div data-capture-show style={{ display: "none", fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>ยอดขายกระสุนปืนให้หน่วยงานตามมาตรา 7</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามกลุ่มหน่วยผู้ซื้อ (นัด)</div>
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
                activeIndex={activePieIndex}
                activeShape={renderActiveShape as Parameters<typeof Pie>[0]["activeShape"]}
                onMouseEnter={(_: unknown, index: number) => setActivePieIndex(index)}
                onMouseLeave={() => setActivePieIndex(undefined)}>
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
              {BUYER_GROUPS.map((bg, i) => {
                const hidden = hiddenBuyers.has(bg.id);
                return (
                  <button key={bg.id} onClick={() => toggleBuyer(bg.id)}
                    style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PIE_COLORS[i]}`, background: hidden ? "#F9FAFB" : PIE_COLORS[i] + "22", color: hidden ? "#9CA3AF" : PIE_COLORS[i], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                    {bg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายละเอียดรายการขาย/จำหน่าย</span>
          <span style={{ fontSize: 12, color: "#8B8E95" }}>ทั้งหมด {rows.length} รายการ · รวม {totalQty.toLocaleString()} นัด</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F0F0F0" }}>
                {["#", "ผู้ประกอบการ", "กลุ่มผู้ซื้อ", "ภาค", "อาวุธ/กระสุน", "จำนวน (นัด)", "วันที่อนุญาต", "สถานะ"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.88)", background: "#fff", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>ไม่พบข้อมูล</td></tr>
              ) : rows.map((r, i) => {
                const st = STATUS_STYLE[r.status] ?? { bg: "#F3F4F6", color: "#6B7280" };
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#9CA3AF", width: 40 }}>{i + 1}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#0E1119", fontWeight: 500 }}>{r.company}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{BUYER_GROUPS.find((b) => b.id === r.buyerGroupId)?.label ?? "-"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{REGIONS.find((rg) => rg.id === r.regionId)?.label ?? "-"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{WEAPONS.find((w) => w.id === r.weaponId)?.label ?? r.weaponId}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: PRIMARY, fontWeight: 600, textAlign: "right" }}>{r.qty.toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>{r.date}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
