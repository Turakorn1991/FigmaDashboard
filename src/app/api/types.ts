// ─────────────────────────────────────────────────────────────────────────
// API Types — DID Dashboard (ตรงกับ docs/API-SPEC.md v1.2)
// FE import ใช้ได้ทันที — ดู client.ts / adapters.ts ประกอบ
// ─────────────────────────────────────────────────────────────────────────

/* ===== Envelope ===== */
export interface ApiError { code: string; message: string; }
export interface ApiEnvelope<T> { data: T | null; error: ApiError | null; }

/* ===== Unified Chart Object (ใช้กับทุกกราฟ) ===== */
export type ChartType = "bar-vertical" | "bar-horizontal" | "pie" | "grouped-bar";
export interface ChartCategory { id: string; label: string; }
export interface ChartSeries { id: string; label: string; values: number[]; }
export interface ChartObject {
  chartType: ChartType;
  valueUnit: string;          // เช่น "นัด" / "ฉบับ"
  categories: ChartCategory[];
  series: ChartSeries[];      // values[i] คู่กับ categories[i]
  total: number;              // ยอดรวม (FE โชว์ "ยอดรวม")
}

/* ===== Table payload (FE แบ่งหน้า/sort/ค้นหาคอลัมน์ฝั่ง client) ===== */
export interface TablePayload<T> { rows: T[]; total: number; }

/* ===== Lookups ===== */
export interface CompanyOption { id: string; name: string; }
export interface WeaponOption { code: string; name: string; category: string; unit: string; }
export interface BuyerGroupOption { id: string; label: string; }
export interface BuyerUnitOption { name: string; groupId: string; }
export interface PermitTypeOption { code: string; name: string; }

/* ===== Filters (ตรงกับ state ตัวกรองของแต่ละหน้า) ===== */
// เมนู 1 และ 2 ใช้ตัวกรองชุดเดียวกัน
export interface SaleMoveFilter {
  dateFrom: string; dateTo: string;
  transportTypes: string[];      // ประเภทขนย้าย
  moveCategories: string[];      // ประเภทการขนย้าย
  companies: string[];
  region: string; provinces: string[];   // provinces = จังหวัดปลายทาง (relate กับ region)
  buyers: string[]; buyerUnits: string[];
  weaponCategory: string; unit: string; weapons: string[];
}
export interface ImportFilter {
  dateFrom: string; dateTo: string; companies: string[]; unit: string; weapons: string[];
}
export interface MoveStatusFilter { dateFrom: string; dateTo: string; companies: string[]; }
export type PermitsFilter = MoveStatusFilter;

/* ===== Table rows ===== */
export interface SaleMoveRow {
  docNo: string; date: string; expireDate: string; purchaseDoc: string;
  transportType: string; moveCategory: string;
  company: string; buyerGroup: string; buyerUnit: string;
  weaponCode: string; weaponName: string;
  qty: number; actualQty: number; unit: string;   // qty = ที่ได้รับอนุญาต, actualQty = ขนย้ายจริง
}
export interface ImportRow {
  docNo: string; date: string; expireDate: string; company: string;
  weaponCode: string; weaponName: string; qty: number; unit: string;
}
export interface MoveStatusRow {
  docNo: string; date: string; expireDate: string; company: string; status: string;
}
export interface PermitsRow {
  docNo: string; date: string; expireDate: string;
  permitType: string; permitTypeName: string; company: string;
}

/* ===== Query responses (charts + table ในครั้งเดียว) ===== */
export interface SaleMoveQueryResponse {
  filter: SaleMoveFilter;
  charts: { purchaseDoc: ChartObject; buyerGroup: ChartObject; company: ChartObject };
  table: TablePayload<SaleMoveRow>;
}
export interface ImportQueryResponse {
  filter: ImportFilter;
  charts: { companyQty: ChartObject; companyDocs: ChartObject };
  table: TablePayload<ImportRow>;
}
export interface MoveStatusQueryResponse {
  filter: MoveStatusFilter;
  charts: { byCompany: ChartObject; companyTotal: ChartObject; statusTotal: ChartObject };
  table: TablePayload<MoveStatusRow>;
}
export interface PermitsQueryResponse {
  filter: PermitsFilter;
  charts: { byCompany: ChartObject; companyTotal: ChartObject; typeTotal: ChartObject };
  table: TablePayload<PermitsRow>;
}
