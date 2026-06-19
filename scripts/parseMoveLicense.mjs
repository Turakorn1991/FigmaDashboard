// Parser: docs/export_move_license.xlsx  ->  src/app/data/moveLicense.ts
// ข้อมูลจริง "ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ" — ใช้เฉพาะ Page1Overview เท่านั้น
// รัน: node scripts/parseMoveLicense.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
const XLSX = createRequire(import.meta.url)("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../docs/export_move_license.xlsx");
const OUT = resolve(__dirname, "../src/app/data/moveLicense.ts");

const wb = XLSX.readFile(SRC);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }).slice(1).filter((r) => r.length > 5);

const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
// "28-DEC-18" -> { iso: "2018-12-28", th: "28/12/2561" }
function parseDate(s) {
  const m = /^(\d{1,2})-([A-Z]{3})-(\d{2})$/.exec(String(s || "").trim().toUpperCase());
  if (!m) return { iso: "", th: "" };
  const d = +m[1], mo = MONTHS[m[2]] || 1, yy = +m[3];
  const yearAD = 2000 + yy;
  const pad = (n) => String(n).padStart(2, "0");
  return { iso: `${yearAD}-${pad(mo)}-${pad(d)}`, th: `${pad(d)}/${pad(mo)}/${yearAD + 543}` };
}
const txt = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
const num = (v) => Number(String(v).replace(/,/g, "")) || 0;

const companies = new Map();   // id -> name
const weapons = new Map();     // code -> { id, name, category }
const units = new Set();
const transports = new Set();
const categories = new Set();
const regions = new Set();
const buyerGroups = new Map(); // id -> label
const buyerUnits = new Map();  // name -> group
const rows = [];

for (const c of raw) {
  const da = parseDate(c[1]);
  const de = parseDate(c[2]);
  const transportType = txt(c[3]);
  const companyId = txt(c[4]);
  const company = txt(c[5]);
  const weaponCode = txt(c[6]);
  const weaponName = txt(c[7]);
  const weaponCategory = txt(c[10]);
  const qty = num(c[11]);
  const unit = txt(c[13]);
  const buyerUnit = txt(c[14]);
  const buyerGroupId = txt(c[16]) || "0";
  const buyerGroup = txt(c[17]) || "ไม่ระบุ";
  const region = txt(c[38]);

  if (companyId && company) companies.set(companyId, company);
  if (weaponCode && weaponName && !weapons.has(weaponCode)) weapons.set(weaponCode, { id: weaponCode, name: weaponName, category: weaponCategory });
  if (unit) units.add(unit);
  if (transportType) transports.add(transportType);
  if (weaponCategory) categories.add(weaponCategory);
  if (region) regions.add(region);
  buyerGroups.set(buyerGroupId, buyerGroup);
  if (buyerUnit && buyerUnit !== "-" && !buyerUnits.has(buyerUnit)) buyerUnits.set(buyerUnit, buyerGroupId);

  rows.push({
    id: rows.length + 1,
    docNo: txt(c[0]), dateISO: da.iso, dateTH: da.th, expireTH: de.th,
    transportType, companyId, company,
    weaponCode, weaponName, weaponCategory,
    qty, unit, buyerUnit, buyerGroupId, buyerGroup, region,
    srcPlace: txt(c[18]), srcBaan: txt(c[19]), srcAkhan: txt(c[20]), srcMoo: txt(c[21]),
    srcSoi: txt(c[22]), srcRoad: txt(c[23]), srcTambon: txt(c[24]), srcAmphoe: txt(c[25]),
    srcProvince: txt(c[26]), srcZip: txt(c[27]),
    dstPlace: txt(c[28]), dstBaan: txt(c[29]), dstAkhan: txt(c[30]), dstMoo: txt(c[31]),
    dstSoi: txt(c[32]), dstRoad: txt(c[33]), dstTambon: txt(c[34]), dstAmphoe: txt(c[35]),
    dstProvince: txt(c[36]), dstZip: txt(c[37]),
  });
}

const companyItems = [...companies.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
const weaponItems = [...weapons.values()].sort((a, b) => a.name.localeCompare(b.name, "th"));
const unitItems = [...units];
const transportItems = [...transports];
const categoryItems = [...categories];
const regionItems = [...regions];
const GROUP_ORDER = ["1", "2", "3", "9", "0"];
const buyerGroupItems = [...buyerGroups.entries()].map(([id, label]) => ({ id, label }))
  .sort((a, b) => GROUP_ORDER.indexOf(a.id) - GROUP_ORDER.indexOf(b.id));
const buyerUnitItems = [...buyerUnits.entries()].map(([name, group]) => ({ name, group })).sort((a, b) => a.name.localeCompare(b.name, "th"));

const J = JSON.stringify;
// เก็บแถวเป็น JSON positional array (ตัด company/weaponName/weaponCategory/buyerGroup ที่ lookup ได้)
// แล้วโหลดแบบ runtime fetch เพื่อไม่ให้ JS bundle บวม (ป้องกันหน้าค้างตอน dev)
// ลำดับ: docNo,dateISO,dateTH,expireTH,transportType,companyId,weaponCode,qty,unit,buyerUnit,buyerGroupId,region,
//        srcPlace,srcBaan,srcAkhan,srcMoo,srcSoi,srcRoad,srcTambon,srcAmphoe,srcProvince,srcZip,
//        dstPlace,dstBaan,dstAkhan,dstMoo,dstSoi,dstRoad,dstTambon,dstAmphoe,dstProvince,dstZip
// sample แถวลงเหลือ SAMPLE_SIZE แบบ stride กระจายทั่วชุดข้อมูล (คง DDL ครบจากข้อมูลเต็ม)
const SAMPLE_SIZE = 2000;
const sampled = rows.length <= SAMPLE_SIZE
  ? rows
  : (() => {
      const stride = rows.length / SAMPLE_SIZE;
      const out = [];
      for (let k = 0; k < SAMPLE_SIZE; k++) out.push(rows[Math.floor(k * stride)]);
      return out;
    })();
const rawArr = sampled.map((r) => [
  r.docNo, r.dateISO, r.dateTH, r.expireTH, r.transportType, r.companyId, r.weaponCode, r.qty, r.unit, r.buyerUnit, r.buyerGroupId, r.region,
  r.srcPlace, r.srcBaan, r.srcAkhan, r.srcMoo, r.srcSoi, r.srcRoad, r.srcTambon, r.srcAmphoe, r.srcProvince, r.srcZip,
  r.dstPlace, r.dstBaan, r.dstAkhan, r.dstMoo, r.dstSoi, r.dstRoad, r.dstTambon, r.dstAmphoe, r.dstProvince, r.dstZip,
]);
const JSON_OUT = resolve(__dirname, "../public/moveLicense.rows.json");
writeFileSync(JSON_OUT, J(rawArr), "utf8");

const out = `// ข้อมูลจริง "ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ" — สร้างอัตโนมัติจาก docs/export_move_license.xlsx
// อย่าแก้ไฟล์นี้ด้วยมือ — แก้ที่ไฟล์ xlsx แล้วรัน: node scripts/parseMoveLicense.mjs
// ใช้เฉพาะหน้า Page1Overview เท่านั้น — แถวข้อมูลโหลดแบบ runtime fetch จาก public/moveLicense.rows.json
export interface MoveRow {
  id: number; docNo: string; dateISO: string; dateTH: string; expireTH: string;
  transportType: string; companyId: string; company: string;
  weaponCode: string; weaponName: string; weaponCategory: string;
  qty: number; unit: string; buyerUnit: string; buyerGroupId: string; buyerGroup: string; region: string;
  srcPlace: string; srcBaan: string; srcAkhan: string; srcMoo: string; srcSoi: string; srcRoad: string; srcTambon: string; srcAmphoe: string; srcProvince: string; srcZip: string;
  dstPlace: string; dstBaan: string; dstAkhan: string; dstMoo: string; dstSoi: string; dstRoad: string; dstTambon: string; dstAmphoe: string; dstProvince: string; dstZip: string;
}
export interface CompanyOption { id: string; name: string; }
export interface WeaponOption { id: string; name: string; category: string; }
export interface BuyerGroupOption { id: string; label: string; }
export interface BuyerUnitOption { name: string; group: string; }

export const COMPANY_OPTIONS: CompanyOption[] = ${J(companyItems)};

export const WEAPON_OPTIONS: WeaponOption[] = ${J(weaponItems)};

export const UNIT_OPTIONS: string[] = ${J(unitItems)};

export const TRANSPORT_OPTIONS: string[] = ${J(transportItems)};

export const WEAPON_CATEGORY_OPTIONS: string[] = ${J(categoryItems)};

export const REGION_OPTIONS: string[] = ${J(regionItems)};

export const BUYER_GROUP_OPTIONS: BuyerGroupOption[] = ${J(buyerGroupItems)};

export const BUYER_UNIT_OPTIONS: BuyerUnitOption[] = ${J(buyerUnitItems)};

type Raw = [string,string,string,string,string,string,string,number,string,string,string,string,
  string,string,string,string,string,string,string,string,string,string,
  string,string,string,string,string,string,string,string,string,string];

const _companyMap: Record<string, string> = Object.fromEntries(COMPANY_OPTIONS.map((c) => [c.id, c.name]));
const _weaponMap: Record<string, WeaponOption> = Object.fromEntries(WEAPON_OPTIONS.map((w) => [w.id, w]));
const _groupMap: Record<string, string> = Object.fromEntries(BUYER_GROUP_OPTIONS.map((g) => [g.id, g.label]));

function mapRaw(RAW: Raw[]): MoveRow[] {
  return RAW.map((r, i) => ({
    id: i + 1,
    docNo: r[0], dateISO: r[1], dateTH: r[2], expireTH: r[3], transportType: r[4],
    companyId: r[5], company: _companyMap[r[5]] ?? r[5],
    weaponCode: r[6], weaponName: _weaponMap[r[6]]?.name ?? r[6], weaponCategory: _weaponMap[r[6]]?.category ?? "",
    qty: r[7], unit: r[8], buyerUnit: r[9], buyerGroupId: r[10], buyerGroup: _groupMap[r[10]] ?? r[10], region: r[11],
    srcPlace: r[12], srcBaan: r[13], srcAkhan: r[14], srcMoo: r[15], srcSoi: r[16], srcRoad: r[17], srcTambon: r[18], srcAmphoe: r[19], srcProvince: r[20], srcZip: r[21],
    dstPlace: r[22], dstBaan: r[23], dstAkhan: r[24], dstMoo: r[25], dstSoi: r[26], dstRoad: r[27], dstTambon: r[28], dstAmphoe: r[29], dstProvince: r[30], dstZip: r[31],
  }));
}

let _cache: MoveRow[] | null = null;
// โหลดแถวข้อมูลทั้งหมด (12,749 แถว) แบบ async จาก public/moveLicense.rows.json
export async function loadMoveRows(): Promise<MoveRow[]> {
  if (_cache) return _cache;
  const res = await fetch(\`\${import.meta.env.BASE_URL}moveLicense.rows.json\`);
  const RAW = (await res.json()) as Raw[];
  _cache = mapRaw(RAW);
  return _cache;
}
`;

writeFileSync(OUT, out, "utf8");
console.log(`Companies:${companyItems.length} Weapons:${weaponItems.length} Units:${unitItems.length} Transports:${transportItems.length} Categories:${categoryItems.length} Regions:${regionItems.length} BuyerGroups:${buyerGroupItems.length} BuyerUnits:${buyerUnitItems.length} Rows(full):${rows.length} Rows(sampled):${sampled.length}`);
console.log(`-> ${OUT}`);
console.log(`-> ${JSON_OUT}`);
