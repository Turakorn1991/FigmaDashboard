// Parser: docs/import-sample.txt (TSV)  ->  src/app/data/weaponItems.ts
// คอลัมน์: 0 เลขที่หนังสือ | 1 วันที่อนุญาต | 2 วันที่หมดอายุ | 3 รหัสผู้ประกอบการ | 4 ผู้ประกอบการ
//          | 5 รหัสวัตถุหรืออาวุธ | 6 ชื่อวัตถุหรืออาวุธ | 7 จำนวน | 8 รหัสหน่วยนับ | 9 หน่วยนับ
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../docs/import-sample.txt");
const OUT = resolve(__dirname, "../src/app/data/weaponItems.ts");

const lines = readFileSync(SRC, "utf8").split(/\r?\n/).filter(Boolean);
lines.shift(); // ตัดหัวตาราง

const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
// "19-JUN-18" -> { iso: "2018-06-19", th: "19/06/2561" }  (ปีในไฟล์เป็น ค.ศ. 2 หลัก)
function parseDate(s) {
  const m = /^(\d{1,2})-([A-Z]{3})-(\d{2})$/.exec((s || "").trim().toUpperCase());
  if (!m) return { iso: "", th: "" };
  const d = +m[1], mo = MONTHS[m[2]] || 1, yy = +m[3];
  const yearAD = 2000 + yy;
  const pad = (n) => String(n).padStart(2, "0");
  return { iso: `${yearAD}-${pad(mo)}-${pad(d)}`, th: `${pad(d)}/${pad(mo)}/${yearAD + 543}` };
}

const weapons = new Map();   // id -> { id, name, unit }
const units = new Map();     // code -> name
const companies = new Map(); // id -> name
const rows = [];

for (const line of lines) {
  const c = line.split("\t");
  if (c.length < 10) continue;
  const docNo = (c[0] || "").trim();
  const da = parseDate(c[1]);
  const de = parseDate(c[2]);
  const companyId = (c[3] || "").trim();
  const company = (c[4] || "").replace(/\s+/g, " ").trim();
  const wId = (c[5] || "").trim();
  const wName = (c[6] || "").replace(/\s+/g, " ").trim();
  const qty = Number(String(c[7]).replace(/,/g, "")) || 0;
  const uCode = (c[8] || "").trim();
  const uName = (c[9] || "").trim();
  if (uCode && uName && !units.has(uCode)) units.set(uCode, uName);
  if (wId && wName && !weapons.has(wId)) weapons.set(wId, { id: wId, name: wName, unit: uName });
  if (companyId && company && !companies.has(companyId)) companies.set(companyId, company);
  rows.push({ id: rows.length + 1, docNo, dateISO: da.iso, dateTH: da.th, expireTH: de.th, companyId, company, weaponCode: wId, weaponName: wName, qty, unit: uName });
}

const companyItems = [...companies.entries()]
  .map(([id, name]) => ({ id, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "th"));

const weaponItems = [...weapons.values()].sort((a, b) => a.name.localeCompare(b.name, "th"));
const unitItems = [...units.entries()]
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "th"));

const wBody = weaponItems
  .map((w) => `  { id: ${JSON.stringify(w.id)}, name: ${JSON.stringify(w.name)}, unit: ${JSON.stringify(w.unit)} },`)
  .join("\n");
const uBody = unitItems
  .map((u) => `  { code: ${JSON.stringify(u.code)}, name: ${JSON.stringify(u.name)} },`)
  .join("\n");
const cBody = companyItems
  .map((c) => `  { id: ${JSON.stringify(c.id)}, name: ${JSON.stringify(c.name)} },`)
  .join("\n");
const rBody = rows
  .map((r) => `  { id: ${r.id}, docNo: ${JSON.stringify(r.docNo)}, dateISO: ${JSON.stringify(r.dateISO)}, dateTH: ${JSON.stringify(r.dateTH)}, expireTH: ${JSON.stringify(r.expireTH)}, companyId: ${JSON.stringify(r.companyId)}, company: ${JSON.stringify(r.company)}, weaponCode: ${JSON.stringify(r.weaponCode)}, weaponName: ${JSON.stringify(r.weaponName)}, qty: ${r.qty}, unit: ${JSON.stringify(r.unit)} },`)
  .join("\n");

const out = `// วัตถุหรืออาวุธ + หน่วยนับ + ผู้ประกอบการ + ข้อมูลรายการ (DDL/Data) — สร้างอัตโนมัติจาก docs/import-sample.txt
// อย่าแก้ไฟล์นี้ด้วยมือ — แก้ที่ import-sample.txt แล้วรัน: node scripts/parseImportData.mjs
export interface WeaponItem {
  id: string;
  name: string;
  unit: string;
}

export interface UnitOption {
  code: string;
  name: string;
}

export interface CompanyOption {
  id: string;
  name: string;
}

export interface ImportRow {
  id: number;
  docNo: string;
  dateISO: string;
  dateTH: string;
  expireTH: string;
  companyId: string;
  company: string;
  weaponCode: string;
  weaponName: string;
  qty: number;
  unit: string;
}

export const WEAPON_ITEMS: WeaponItem[] = [
${wBody}
];

export const UNIT_OPTIONS: UnitOption[] = [
${uBody}
];

export const COMPANY_OPTIONS: CompanyOption[] = [
${cBody}
];

export const IMPORT_ROWS: ImportRow[] = [
${rBody}
];
`;

writeFileSync(OUT, out, "utf8");
console.log(`Weapons: ${weaponItems.length}, Units: ${unitItems.length}, Companies: ${companyItems.length}, Rows: ${rows.length} -> ${OUT}`);
