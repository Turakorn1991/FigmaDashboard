// Parser: src/app/data/weapons_raw.txt  ->  src/app/data/weaponItems.ts
// รูปแบบแต่ละบรรทัด:  CODE \t | --> \t NAME \t | --> \t UNITCODE \t = \t UNITNAME
// รองรับชื่อหลายบรรทัดที่อยู่ในเครื่องหมายคำพูด " ... "
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_PATH = resolve(__dirname, "../src/app/data/weapons_raw.txt");
const OUT_PATH = resolve(__dirname, "../src/app/data/weaponItems.ts");

const UNIT_MAP = {
  "1": "อัน", "2": "ชิ้น", "3": "เครื่อง", "4": "ชุด", "5": "กิโลกรัม",
  "7": "กระบอก", "8": "หัว", "9": "ปลอก", "10": "นัด", "11": "เมตร",
  "12": "แท่ง", "13": "ดอก", "16": "หลอด", "17": "ใบ", "18": "แผ่น",
  "19": "กรัม", "20": "กระปุก",
};

const raw = readFileSync(RAW_PATH, "utf8");

// รวมบรรทัดที่ถูกตัดจากชื่อ multi-line: ถ้าบรรทัดไม่ขึ้นต้นด้วย P- ให้ผนวกกับบรรทัดก่อนหน้า
const rawLines = raw.split(/\r?\n/);
const merged = [];
for (const line of rawLines) {
  if (/^P-\d/.test(line.trimStart())) merged.push(line);
  else if (merged.length) merged[merged.length - 1] += " " + line.trim();
}

const seen = new Map();
for (const line of merged) {
  const parts = line.split("| -->");
  if (parts.length < 3) continue;
  const code = parts[0].trim();
  let name = parts[1].replace(/\t/g, " ").trim();
  // ตัดเครื่องหมายคำพูดครอบ + ยุบช่องว่างซ้ำ
  name = name.replace(/^"+|"+$/g, "").replace(/\s+/g, " ").trim();
  const unitPart = parts.slice(2).join("| -->");
  const unitCode = (unitPart.split("=")[0] || "").trim();
  const unitName = UNIT_MAP[unitCode] || (unitPart.split("=")[1] || "").trim() || "";
  if (!code || !name) continue;
  if (!seen.has(code)) seen.set(code, { id: code, name, unit: unitName });
}

const items = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "th"));

const body = items
  .map((w) => `  { id: ${JSON.stringify(w.id)}, name: ${JSON.stringify(w.name)}, unit: ${JSON.stringify(w.unit)} },`)
  .join("\n");

const out = `// วัตถุหรืออาวุธ (DDL) — สร้างอัตโนมัติจาก weapons_raw.txt ด้วย scripts/parseWeapons.mjs
// อย่าแก้ไฟล์นี้ด้วยมือ — แก้ที่ weapons_raw.txt แล้วรัน: node scripts/parseWeapons.mjs
export interface WeaponItem {
  id: string;
  name: string;
  unit: string;
}

export const WEAPON_ITEMS: WeaponItem[] = [
${body}
];
`;

writeFileSync(OUT_PATH, out, "utf8");
console.log(`Parsed ${items.length} weapon items -> ${OUT_PATH}`);
