// ─────────────────────────────────────────────────────────────────────────
// API Client — DID Dashboard
// ตั้งค่า base URL ผ่าน env: VITE_API_BASE_URL (เช่น "https://host/api/v1")
// ถ้าไม่ตั้ง จะใช้ "/api/v1" (เรียกผ่าน proxy/เซิร์ฟเวอร์เดียวกัน)
// ─────────────────────────────────────────────────────────────────────────
import type {
  ApiEnvelope, ApiError,
  CompanyOption, WeaponOption, BuyerGroupOption, BuyerUnitOption, PermitTypeOption,
  SaleMoveFilter, ImportFilter, MoveStatusFilter, PermitsFilter,
  SaleMoveQueryResponse, ImportQueryResponse, MoveStatusQueryResponse, PermitsQueryResponse,
} from "./types";

const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

/* ===== Auth token (FE เซ็ตหลัง login) ===== */
let _token: string | null = null;
export function setAuthToken(token: string | null) { _token = token; }
function authHeader(): Record<string, string> {
  const t = _token ?? (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ===== Error ===== */
export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(status: number, err: ApiError) { super(err.message); this.status = status; this.code = err.code; this.name = "ApiClientError"; }
}

/* ===== Core fetch ===== */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new ApiClientError(res.status, { code: `HTTP_${res.status}`, message: res.statusText || "request failed" });
  }
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.error) throw new ApiClientError(res.status, json.error);
  return json.data as T;
}
const get = <T,>(path: string) => request<T>(path, { method: "GET" });
const post = <TReq, TRes>(path: string, body: TReq) => request<TRes>(path, { method: "POST", body: JSON.stringify(body) });

/* ===== Export (ดาวน์โหลดไฟล์ xlsx) ===== */
async function downloadExport(path: string, body: unknown, filename: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiClientError(res.status, { code: `HTTP_${res.status}`, message: "export failed" });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ===== Public API ===== */
export const api = {
  lookups: {
    companies: () => get<CompanyOption[]>("/lookups/companies"),
    units: () => get<string[]>("/lookups/units"),
    weaponCategories: () => get<string[]>("/lookups/weapon-categories"),
    weapons: (p?: { category?: string; unit?: string }) => {
      const q = new URLSearchParams();
      if (p?.category) q.set("category", p.category);
      if (p?.unit) q.set("unit", p.unit);
      const qs = q.toString();
      return get<WeaponOption[]>(`/lookups/weapons${qs ? `?${qs}` : ""}`);
    },
    transportTypes: () => get<string[]>("/lookups/transport-types"),
    regions: () => get<string[]>("/lookups/regions"),
    buyerGroups: () => get<BuyerGroupOption[]>("/lookups/buyer-groups"),
    buyerUnits: (groupIds?: string[]) => get<BuyerUnitOption[]>(`/lookups/buyer-units${groupIds?.length ? `?groupIds=${groupIds.join(",")}` : ""}`),
    permitTypes: () => get<PermitTypeOption[]>("/lookups/permit-types"),
    moveStatuses: () => get<string[]>("/lookups/move-statuses"),
  },

  // เมนู 1 — ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ
  saleMove: {
    query: (f: SaleMoveFilter) => post<SaleMoveFilter, SaleMoveQueryResponse>("/dashboard/sale-move/query", f),
    export: (f: SaleMoveFilter) => downloadExport("/dashboard/sale-move/export?format=xlsx", f, "ข้อมูลดิบยอดอนุญาตให้ขายขนย้ายอาวุธ.xlsx"),
  },
  // เมนู 2 — ตามแบบ อ.10 (ใช้ filter/response เดียวกับเมนู 1)
  moveA10: {
    query: (f: SaleMoveFilter) => post<SaleMoveFilter, SaleMoveQueryResponse>("/dashboard/move-a10/query", f),
    export: (f: SaleMoveFilter) => downloadExport("/dashboard/move-a10/export?format=xlsx", f, "ข้อมูลดิบยอดการขนย้ายตามแบบ-อ10.xlsx"),
  },
  // เมนู 3 — สั่ง/นำเข้าฯ
  importPermit: {
    query: (f: ImportFilter) => post<ImportFilter, ImportQueryResponse>("/dashboard/import/query", f),
    export: (f: ImportFilter) => downloadExport("/dashboard/import/export?format=xlsx", f, "ยอดอนุญาตให้สั่งหรือนำเข้าวัตถุหรืออาวุธ.xlsx"),
  },
  // เมนู 4 — ติดตามสถานะการขนย้ายฯ
  moveStatus: {
    query: (f: MoveStatusFilter) => post<MoveStatusFilter, MoveStatusQueryResponse>("/dashboard/move-status/query", f),
  },
  // เมนู 5 — จำนวนหนังสืออนุญาตฯ
  permits: {
    query: (f: PermitsFilter) => post<PermitsFilter, PermitsQueryResponse>("/dashboard/permits/query", f),
  },
};
