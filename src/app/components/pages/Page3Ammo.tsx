import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, FileText, ChevronDown, X, Download, Copy, Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
import { Table, ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";
import { BUYER_UNITS } from "../../data/buyerUnits";
import { WEAPON_ITEMS, UNIT_OPTIONS, COMPANY_OPTIONS, IMPORT_ROWS } from "../../data/weaponItems";
import type { ImportRow } from "../../data/weaponItems";

/* ─── Derived manufacturer fields (mock — ไม่มีใน source data) ──────── */
const MFG_COUNTRIES = ["สหรัฐอเมริกา", "เยอรมนี", "อิตาลี", "ออสเตรีย", "เบลเยียม", "สาธารณรัฐเช็ก", "บราซิล", "เกาหลีใต้", "สวิตเซอร์แลนด์", "ตุรกี"];
const hashStr = (s: string) => { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) >>> 0; return n; };
const countryOf = (r: ImportRow) => MFG_COUNTRIES[hashStr(r.weaponCode + r.docNo) % MFG_COUNTRIES.length];
const actualQtyOf = (r: ImportRow) => Math.round(r.qty * (0.7 + (hashStr(r.docNo + r.id) % 31) / 100));

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

const WEAPON_TYPE_FILTER: Record<string, (w: { id: string; label: string }) => boolean> = {
  "กระสุน":   (w) => /^(กระสุน|จรวด|ดินปืน|ชนวน)/.test(w.label),
  "ระเบิด":   (w) => /ระเบิด/.test(w.label),
  "อาวุธปืน": (w) => /^(อาวุธปืน|ปืน)/.test(w.label),
};

interface RawRow {
  id: number; companyId: string; company: string;
  buyerGroupId: string; buyerUnit: string; regionId: string; weaponId: string;
  qty: number; date: string; status: string;
}

// ── ข้อมูล address mock ต่อผู้ประกอบการ (simulate API response) ──
const COMPANY_ADDR: Record<string, { baan: string; moo: string; soi: string; road: string; tambon: string; amphoe: string; province: string; zip: string }> = {
  "1":  { baan:"99/1",  moo:"3", soi:"สุขุมวิท 71",   road:"สุขุมวิท",       tambon:"พระโขนงเหนือ", amphoe:"วัฒนา",        province:"กรุงเทพมหานคร", zip:"10110" },
  "2":  { baan:"45",    moo:"2", soi:"-",              road:"วิภาวดีรังสิต",  tambon:"จตุจักร",      amphoe:"จตุจักร",      province:"กรุงเทพมหานคร", zip:"10900" },
  "3":  { baan:"12/3",  moo:"1", soi:"ลาดพร้าว 41",   road:"ลาดพร้าว",      tambon:"จอมพล",        amphoe:"จตุจักร",      province:"กรุงเทพมหานคร", zip:"10900" },
  "4":  { baan:"88",    moo:"5", soi:"-",              road:"พระรามที่ 9",    tambon:"บางกะปิ",      amphoe:"ห้วยขวาง",     province:"กรุงเทพมหานคร", zip:"10310" },
  "5":  { baan:"200",   moo:"4", soi:"เพชรบุรี 7",    road:"เพชรบุรี",       tambon:"มักกะสัน",     amphoe:"ราษฎร์บูรณะ",  province:"กรุงเทพมหานคร", zip:"10400" },
  "6":  { baan:"33/2",  moo:"2", soi:"-",              road:"รัชดาภิเษก",     tambon:"ดินแดง",       amphoe:"ดินแดง",       province:"กรุงเทพมหานคร", zip:"10400" },
  "7":  { baan:"55",    moo:"6", soi:"สาทร 12",        road:"สาทรใต้",        tambon:"ยานนาวา",      amphoe:"สาทร",         province:"กรุงเทพมหานคร", zip:"10120" },
  "8":  { baan:"77/4",  moo:"1", soi:"-",              road:"พหลโยธิน",       tambon:"สามเสนใน",     amphoe:"พญาไท",        province:"กรุงเทพมหานคร", zip:"10400" },
  "9":  { baan:"10",    moo:"3", soi:"นวมินทร์ 20",   road:"นวมินทร์",       tambon:"คลองกุ่ม",     amphoe:"บึงกุ่ม",      province:"กรุงเทพมหานคร", zip:"10230" },
  "10": { baan:"66/1",  moo:"2", soi:"-",              road:"บางนา-ตราด",     tambon:"บางนา",        amphoe:"บางนา",        province:"กรุงเทพมหานคร", zip:"10260" },
  "14": { baan:"21/1",  moo:"1", soi:"ราษฎร์พัฒนา 3", road:"ราษฎร์พัฒนา",   tambon:"สะพานสูง",     amphoe:"สะพานสูง",     province:"กรุงเทพมหานคร", zip:"10240" },
  "15": { baan:"158",   moo:"7", soi:"-",              road:"เจริญกรุง",       tambon:"วังบูรพาภิรมย์",amphoe:"พระนคร",      province:"กรุงเทพมหานคร", zip:"10200" },
};

const REGION_PROVINCE: Record<string, { province: string; amphoe: string; tambon: string; zip: string }> = {
  "C":  { province:"กรุงเทพมหานคร",          amphoe:"พระนคร",        tambon:"พระบรมมหาราชวัง", zip:"10200" },
  "N":  { province:"เชียงใหม่",               amphoe:"เมืองเชียงใหม่", tambon:"ช้างเผือก",       zip:"50300" },
  "NE": { province:"ขอนแก่น",                 amphoe:"เมืองขอนแก่น",  tambon:"ในเมือง",          zip:"40000" },
  "S":  { province:"สงขลา",                   amphoe:"เมืองสงขลา",    tambon:"บ่อยาง",           zip:"90000" },
  "E":  { province:"ชลบุรี",                  amphoe:"เมืองชลบุรี",   tambon:"บางปลาสร้อย",     zip:"20000" },
  "W":  { province:"กาญจนบุรี",               amphoe:"เมืองกาญจนบุรี",tambon:"ปากแพรก",          zip:"71000" },
};

const TRANSPORT_TYPES = ["ขนย้าย", "ขายขนย้ายในราชอาณาจักร", "ขายขนย้ายนอกราชอาณาจักร"] as const;
type TransportType = typeof TRANSPORT_TYPES[number];

const PURCHASE_DOCS = ["หนังสือขอซื้อ", "ใบสั่งซื้อ", "สัญญาซื้อขายรัฐ", "ไม่ระบุ"] as const;
type PurchaseDoc = typeof PURCHASE_DOCS[number];

type MockRow = RawRow & {
  docNo: string; expireDate: string; transportType: TransportType; purchaseDoc: PurchaseDoc;
  srcBaan: string; srcAkhan: string; srcMoo: string; srcSoi: string; srcRoad: string;
  srcTambon: string; srcAmphoe: string; srcProvince: string; srcZip: string;
  dstBaan: string; dstAkhan: string; dstMoo: string; dstSoi: string; dstRoad: string;
  dstTambon: string; dstAmphoe: string; dstProvince: string; dstZip: string;
  weaponCode: string; weaponName: string;
};

const enrichRow = (r: RawRow): MockRow => {
  const src = COMPANY_ADDR[r.companyId] ?? COMPANY_ADDR["1"];
  const dst = REGION_PROVINCE[r.regionId] ?? REGION_PROVINCE["C"];
  const [y, m, d] = r.date.split("-").map(Number);
  const exp = new Date(y - 543, m - 1 + 12, d);
  const expStr = `${String(exp.getDate()).padStart(2,"0")}/${String(exp.getMonth()+1).padStart(2,"0")}/${exp.getFullYear()+543}`;
  const weapon = WEAPONS.find((w) => w.id === r.weaponId);
  return {
    ...r,
    docNo: `${String(r.id).padStart(3,"0")}/${r.date.slice(0,4)}`,
    expireDate: expStr,
    transportType: TRANSPORT_TYPES[r.id % 3],
    purchaseDoc: PURCHASE_DOCS[r.id % 4],
    srcBaan: src.baan, srcAkhan: "-", srcMoo: src.moo, srcSoi: src.soi, srcRoad: src.road,
    srcTambon: src.tambon, srcAmphoe: src.amphoe, srcProvince: src.province, srcZip: src.zip,
    dstBaan: "-", dstAkhan: "-", dstMoo: "-", dstSoi: "-", dstRoad: "-",
    dstTambon: dst.tambon, dstAmphoe: dst.amphoe, dstProvince: dst.province, dstZip: dst.zip,
    weaponCode: r.weaponId,
    weaponName: weapon?.label ?? r.weaponId,
  };
};

const MOCK_ROWS: MockRow[] = ([
  // บริษัท เนแรค อาร์มส (1)
  { id:1,  companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"1", buyerUnit:"กองพันทหารม้าที่ 4 กองพลที่ 1 รักษาพระองค์",                          regionId:"N",  weaponId:"P-0036", qty:150000, date:"2568-01-10", status:"อนุมัติ" },
  { id:2,  companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"2", buyerUnit:"กองร้อยตำรวจตระเวนชายแดนที่ 414",                                      regionId:"C",  weaponId:"P-0035", qty:42000,  date:"2568-02-15", status:"อนุมัติ" },
  { id:3,  companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"3", buyerUnit:"สมาคมยิงปืนเขาเขียวนครสวรรค์",                                        regionId:"E",  weaponId:"P-0050", qty:5500,   date:"2568-03-20", status:"อนุมัติ" },
  { id:4,  companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"9", buyerUnit:"สำนักป้องกันรักษาป่าและควบคุมไฟป่า กรมป่าไม้ กรุงเทพ ฯ",            regionId:"W",  weaponId:"P-0034", qty:8800,   date:"2568-04-05", status:"กำลังดำเนินการ" },
  { id:5,  companyId:"1",  company:"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด",         buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"S",  weaponId:"P-0033", qty:2100,   date:"2568-05-12", status:"อนุมัติ" },
  { id:6,  companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"1", buyerUnit:"กรมทหารราบที่ 6 ค่ายสรรพสิทธิประสงค์",                               regionId:"NE", weaponId:"P-0063", qty:68000,  date:"2568-01-18", status:"อนุมัติ" },
  { id:7,  companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"2", buyerUnit:"ศูนย์ฝึกอบรมตำรวจภูธรภาค 6",                                         regionId:"N",  weaponId:"P-0034", qty:25000,  date:"2568-02-22", status:"อนุมัติ" },
  { id:8,  companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"3", buyerUnit:"สมาคมกีฬายิงปืนหัวหิน",                                               regionId:"C",  weaponId:"P-0050", qty:3200,   date:"2568-03-14", status:"รอดำเนินการ" },
  { id:9,  companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"9", buyerUnit:"โรงเรียนนายร้อยตำรวจ",                                                regionId:"C",  weaponId:"P-0033", qty:8500,   date:"2568-04-25", status:"รอดำเนินการ" },
  { id:10, companyId:"2",  company:"บริษัท ณธรรศชาตรี จำกัด",                      buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"E",  weaponId:"P-0031", qty:1800,   date:"2568-06-08", status:"อนุมัติ" },
  { id:11, companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"1", buyerUnit:"มณฑลทหารบกที่ 46 ค่ายอิงคยุทธบริหาร",                               regionId:"NE", weaponId:"P-0035", qty:180000, date:"2568-01-25", status:"อนุมัติ" },
  { id:12, companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"2", buyerUnit:"กองทะเบียนประวัติอาชญากร สำนักงานพิสูจน์หลักฐานตำรวจ สำนักงานตำรวจแห่งชาติ", regionId:"C", weaponId:"P-0034", qty:85000, date:"2568-02-10", status:"อนุมัติ" },
  { id:13, companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"3", buyerUnit:"สมาคมกีฬายิงปืนหัวหิน",                                               regionId:"S",  weaponId:"P-0036", qty:7200,   date:"2568-03-30", status:"อนุมัติ" },
  { id:14, companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"9", buyerUnit:"กรมราชทัณฑ์",                                                          regionId:"W",  weaponId:"P-0028", qty:4500,   date:"2568-05-05", status:"อนุมัติ" },
  { id:15, companyId:"3",  company:"บริษัท รอยัล แอมมูนิชั่น จำกัด",               buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"N",  weaponId:"P-0027", qty:1200,   date:"2568-07-11", status:"กำลังดำเนินการ" },
  { id:16, companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"1", buyerUnit:"กองพลทหารปืนใหญ่ ค่ายพิลูลสงคราม",                                   regionId:"C",  weaponId:"P-0090", qty:15000,  date:"2568-02-01", status:"อนุมัติ" },
  { id:17, companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"2", buyerUnit:"ตำรวจภูธรจังหวัดน่าน",                                                 regionId:"S",  weaponId:"P-0160", qty:6000,   date:"2568-03-10", status:"อนุมัติ" },
  { id:18, companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"3", buyerUnit:"สมาคมยิงปืนเขาเขียวนครสวรรค์",                                        regionId:"W",  weaponId:"P-0160", qty:12000,  date:"2568-04-01", status:"อนุมัติ" },
  { id:19, companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"9", buyerUnit:"สำนักงานศาลยุติธรรม ศูนย์รักษาความปลอดภัย",                          regionId:"N",  weaponId:"P-0090", qty:1200,   date:"2568-07-15", status:"อนุมัติ" },
  { id:20, companyId:"4",  company:"บริษัท พี.วี.เอ็กซโพลซิฟ (ไทยแลนด์) จำกัด", buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"NE", weaponId:"P-0161", qty:900,    date:"2568-08-20", status:"รอดำเนินการ" },
  { id:21, companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"1", buyerUnit:"กรมการทหารสื่อสารที่ 1 ค่ายกำแพงเพชรอัครโยธิน",                     regionId:"S",  weaponId:"P-0170", qty:22000,  date:"2568-01-30", status:"อนุมัติ" },
  { id:22, companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"2", buyerUnit:"ศูนย์ฝึกอบรมตำรวจภูธรภาค 9",                                         regionId:"C",  weaponId:"P-0171", qty:8000,   date:"2568-03-05", status:"อนุมัติ" },
  { id:23, companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"3", buyerUnit:"สมาคมยิงปืนเขาเขียวนครสวรรค์",                                        regionId:"E",  weaponId:"P-0160", qty:4500,   date:"2568-04-18", status:"กำลังดำเนินการ" },
  { id:24, companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"9", buyerUnit:"กรมสอบสวนคดีพิเศษ",                                                    regionId:"N",  weaponId:"P-0161", qty:2800,   date:"2568-06-22", status:"อนุมัติ" },
  { id:25, companyId:"5",  company:"บริษัท อัสพรรณ เอ็กซ์โพลซีฟ จำกัด",          buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"S",  weaponId:"P-0161", qty:3200,   date:"2568-05-02", status:"อนุมัติ" },
  { id:26, companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"1", buyerUnit:"มณฑลทหารบกที่ 15 ค่ายรามราชนิเวศน์",                                 regionId:"NE", weaponId:"P-0035", qty:320000, date:"2568-01-08", status:"อนุมัติ" },
  { id:27, companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"2", buyerUnit:"ตำรวจภูธรจังหวัดเชียงราย",                                            regionId:"C",  weaponId:"P-0034", qty:75000,  date:"2568-02-28", status:"กำลังดำเนินการ" },
  { id:28, companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"3", buyerUnit:"สมาคมกีฬายิงปืนหัวหิน",                                               regionId:"N",  weaponId:"P-0036", qty:9500,   date:"2568-04-10", status:"อนุมัติ" },
  { id:29, companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"9", buyerUnit:"กองบัญชาการตำรวจปราบปรามยาเสพติด สำนักงานตำรวจแห่งชาติ",            regionId:"W",  weaponId:"P-0034", qty:5200,   date:"2568-06-14", status:"อนุมัติ" },
  { id:30, companyId:"6",  company:"บริษัท บุลเล็ท มาสเตอร์ จำกัด",               buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"S",  weaponId:"P-0035", qty:2400,   date:"2568-08-01", status:"อนุมัติ" },
  { id:31, companyId:"7",  company:"บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด",            buyerGroupId:"1", buyerUnit:"กองพลทหารม้าที่ 2 รักษาพระองค์",                                     regionId:"S",  weaponId:"P-0036", qty:95000,  date:"2568-02-05", status:"อนุมัติ" },
  { id:32, companyId:"7",  company:"บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด",            buyerGroupId:"2", buyerUnit:"ตำรวจภูธรจังหวัดชัยภูมิ ภายในศูนย์ราชการ",                          regionId:"E",  weaponId:"P-0035", qty:38000,  date:"2568-03-12", status:"อนุมัติ" },
  { id:33, companyId:"7",  company:"บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด",            buyerGroupId:"3", buyerUnit:"สมาคมยิงปืนเขาเขียวนครสวรรค์",                                        regionId:"C",  weaponId:"P-0034", qty:6800,   date:"2568-05-20", status:"กำลังดำเนินการ" },
  { id:34, companyId:"7",  company:"บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด",            buyerGroupId:"9", buyerUnit:"ศูนย์รักษาความปลอดภัย กองบัญชาการกองทัพไทย",                        regionId:"NE", weaponId:"P-0063", qty:3100,   date:"2568-07-08", status:"อนุมัติ" },
  { id:35, companyId:"7",  company:"บริษัท ใช้ เอ็กซ์โพลซีฟส์ จำกัด",            buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"N",  weaponId:"P-0033", qty:1500,   date:"2568-08-15", status:"อนุมัติ" },
  { id:36, companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"1", buyerUnit:"กรมสรรพาวุธทหารบก",                                                   regionId:"S",  weaponId:"P-0035", qty:410000, date:"2568-01-15", status:"อนุมัติ" },
  { id:37, companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"2", buyerUnit:"กองบังคับการตำรวจนครบาล 9",                                          regionId:"C",  weaponId:"P-0034", qty:92000,  date:"2568-02-20", status:"อนุมัติ" },
  { id:38, companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"3", buyerUnit:"สมาคมกีฬายิงปืนหัวหิน",                                               regionId:"N",  weaponId:"P-0036", qty:14000,  date:"2568-03-25", status:"อนุมัติ" },
  { id:39, companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"9", buyerUnit:"กรมการสารวัตรทหารบก",                                                 regionId:"NE", weaponId:"P-0060", qty:7500,   date:"2568-05-18", status:"อนุมัติ" },
  { id:40, companyId:"8",  company:"บริษัท ไทยอามส์ จำกัด",                        buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"E",  weaponId:"P-0034", qty:3800,   date:"2568-07-22", status:"กำลังดำเนินการ" },
  { id:41, companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"1", buyerUnit:"มณฑลทหารบกที่ 39 ค่ายสมเด็จพระนเรศวรมหาราช",                       regionId:"C",  weaponId:"P-0035", qty:125000, date:"2568-01-22", status:"อนุมัติ" },
  { id:42, companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"2", buyerUnit:"กองบัญชาการตำรวจนครบาล สำนักงานตำรวจแห่งชาติ",                     regionId:"E",  weaponId:"P-0034", qty:65000,  date:"2568-03-18", status:"กำลังดำเนินการ" },
  { id:43, companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"3", buyerUnit:"สมาคมยิงปืนเขาเขียวนครสวรรค์",                                        regionId:"W",  weaponId:"P-0036", qty:8200,   date:"2568-05-08", status:"อนุมัติ" },
  { id:44, companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"9", buyerUnit:"วิทยาลัยการตำรวจ กองบัญชาการศึกษา",                                  regionId:"S",  weaponId:"P-0034", qty:4100,   date:"2568-07-02", status:"อนุมัติ" },
  { id:45, companyId:"14", company:"บริษัท สยาม แอมมูนิชั่น จำกัด",               buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"N",  weaponId:"P-0035", qty:1900,   date:"2568-08-10", status:"อนุมัติ" },
  { id:46, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"1", buyerUnit:"กองพันทหารราบที่ 1 กรมทหารราบที่ 23 ค่ายสุรธรรมพิทักษ์",           regionId:"NE", weaponId:"P-0035", qty:88000,  date:"2568-02-08", status:"อนุมัติ" },
  { id:47, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"2", buyerUnit:"ตำรวจภูธรจังหวัดกาญจนบุรี",                                          regionId:"N",  weaponId:"P-0028", qty:22000,  date:"2568-04-14", status:"อนุมัติ" },
  { id:48, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"3", buyerUnit:"สมาคมยิงปืนเขาเขียวนครสวรรค์",                                        regionId:"C",  weaponId:"P-0031", qty:5500,   date:"2568-06-01", status:"อนุมัติ" },
  { id:49, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"9", buyerUnit:"กองบังคับการฝึกอบรมตำรวจกลาง",                                       regionId:"E",  weaponId:"P-0033", qty:2900,   date:"2568-07-18", status:"กำลังดำเนินการ" },
  { id:50, companyId:"15", company:"บริษัท ไทย ทรัพย์นคร จำกัด",                  buyerGroupId:"0", buyerUnit:"-",                                                                     regionId:"W",  weaponId:"P-0027", qty:1100,   date:"2568-08-25", status:"อนุมัติ" },
] as RawRow[]).map(enrichRow);

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

/* ─── Thai calendar constants ─────────────────────────── */
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_DAYS_SHORT = ["อา","จ","อ","พ","พฤ","ศ","ส"];

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
export function Page3Ammo() {
  const [f_dateFrom,    setDateFrom]    = useState("");
  const [f_dateTo,      setDateTo]      = useState("");
  const [f_companies,   setCompanies]   = useState<string[]>([]);
  const [f_weaponType,  setWeaponType]  = useState("");
  const [f_unit,        setUnit]        = useState("");
  const [f_weapons,     setWeapons]     = useState<string[]>([]);
  const [f_region,      setRegion]      = useState("");
  const [f_buyers,         setBuyers]         = useState<string[]>([]);
  const [f_buyerUnits,     setBuyerUnits]     = useState<string[]>([]);
  const [f_transportTypes, setTransportTypes] = useState<string[]>([]);
  const [a, setA] = useState({ dateFrom: "", dateTo: "", companies: [] as string[], unit: "", weapons: [] as string[] });
  const [searched, setSearched] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const handleSearch = () => { setA({ dateFrom: f_dateFrom, dateTo: f_dateTo, companies: f_companies, unit: f_unit, weapons: f_weapons }); setSearched(true); setTablePage(1); };
  const handleReset  = () => {
    setDateFrom(""); setDateTo(""); setCompanies([]); setWeaponType(""); setUnit(""); setWeapons([]);
    setRegion(""); setBuyers([]); setBuyerUnits([]); setTransportTypes([]);
    setA({ dateFrom: "", dateTo: "", companies: [], unit: "", weapons: [] });
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
  const countryChartRef = useRef<HTMLDivElement>(null);
  const [copiedBar, setCopiedBar] = useState(false);
  const [copiedPie, setCopiedPie] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedCountry, setCopiedCountry] = useState(false);
  const [activeCountryIndex, setActiveCountryIndex] = useState<number | undefined>(undefined);

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

  /* filtered rows — อิงข้อมูลจริงจาก import-sample.txt */
  const rows = !searched ? [] : IMPORT_ROWS.filter((r) => {
    if (a.unit && r.unit !== a.unit) return false;
    if (a.companies.length && !a.companies.includes(r.companyId)) return false;
    if (a.weapons.length && !a.weapons.includes(r.weaponCode)) return false;
    if (a.dateFrom && r.dateISO && r.dateISO < a.dateFrom) return false;
    if (a.dateTo && r.dateISO && r.dateISO > a.dateTo) return false;
    return true;
  });

  const filteredWeaponOptions = WEAPON_ITEMS
    .filter((w) => !f_unit || w.unit === f_unit)
    .map((w) => ({ id: w.id, label: w.name }));

  const buyerUnitOptions = BUYER_UNITS
    .filter((u) => f_buyers.length === 0 || f_buyers.includes(u.group))
    .map((u) => ({ id: u.name, label: u.name }));

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  /* Top 5 ประเทศผู้ผลิต (ตามจำนวนที่ได้รับอนุญาต) */
  const countryQtyMap: Record<string, number> = {};
  rows.forEach((r) => { const c = countryOf(r); countryQtyMap[c] = (countryQtyMap[c] ?? 0) + r.qty; });
  const top5Country = Object.entries(countryQtyMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const exportRawExcel = () => {
    const headers = [
      "#","เลขที่หนังสือ อ.8","วันที่อนุญาต","วันที่หมดอายุ","ผู้ประกอบการ",
      "รหัสวัตถุหรืออาวุธ","วัตถุหรืออาวุธ","ประเทศผู้ผลิต","จำนวนที่ได้รับอนุญาต","จำนวนที่นำเข้าจริง(ตามแจ้งกรมศุลฯ)","หน่วยนับ",
    ];
    const dataRows = rows.map((r, i) => [
      i + 1, r.docNo, r.dateTH, r.expireTH, r.company,
      r.weaponCode, r.weaponName, countryOf(r), r.qty, actualQtyOf(r), r.unit || "-",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws["!cols"] = headers.map((_, i) => ({ wch: [6,16,14,14,40,16,44,20,18,18,10][i] ?? 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลดิบ");
    const n = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    const ts = `${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}${p(n.getHours())}${p(n.getMinutes())}`;
    XLSX.writeFile(wb, `ยอดอนุญาตให้สั่งหรือนำเข้าวัตถุหรืออาวุธ_${ts}.xlsx`);
  };

  const tableData = rows.map((r) => ({
    ...r,
    key: r.id,
    date: r.dateISO,
    dateFormatted: r.dateTH,
    expireDate: r.expireTH,
    weaponLabel: r.weaponName,
    country: countryOf(r),
    actualQty: actualQtyOf(r),
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
    { title: "#",                 key: "no",            width: 52,  fixed: "left" as const, align: "center" as const, render: (_: unknown, __: TableRow, i: number) => (tablePage - 1) * tablePageSize + i + 1 },
    { title: "เลขที่หนังสือ อ.8", dataIndex: "docNo",       key: "docNo",      width: 130, ...getColSearchProps("docNo", "เลขที่หนังสือ อ.8") },
    { title: "วันที่อนุญาต",      dataIndex: "dateFormatted", key: "date",     width: 120, sorter: (a, b) => a.date.localeCompare(b.date) },
    { title: "วันที่หมดอายุ",     dataIndex: "expireDate",  key: "expireDate", width: 120 },
    { title: "ผู้ประกอบการ",      dataIndex: "company",     key: "company",    width: 240, sorter: (a, b) => a.company.localeCompare(b.company, "th"), ...getColSearchProps("company", "ผู้ประกอบการ") },
    { title: "รหัสวัตถุหรืออาวุธ", dataIndex: "weaponCode",  key: "weaponCode", width: 140, sorter: (a, b) => a.weaponCode.localeCompare(b.weaponCode), ...getColSearchProps("weaponCode", "รหัสวัตถุหรืออาวุธ"), render: (v: string) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
    { title: "วัตถุหรืออาวุธ",     dataIndex: "weaponLabel", key: "weapon",     width: 280, sorter: (a, b) => a.weaponLabel.localeCompare(b.weaponLabel, "th"), ...getColSearchProps("weaponLabel", "วัตถุหรืออาวุธ") },
    { title: "ประเทศผู้ผลิต",     dataIndex: "country",     key: "country",    width: 150, sorter: (a, b) => a.country.localeCompare(b.country, "th"), ...getColSearchProps("country", "ประเทศผู้ผลิต") },
    { title: "จำนวนที่ได้รับอนุญาต", dataIndex: "qty",       key: "qty",        width: 150, align: "right" as const, sorter: (a, b) => a.qty - b.qty, render: (v: number) => <span style={{ color: PRIMARY, fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "จำนวนที่นำเข้าจริง(ตามแจ้งกรมศุลฯ)", dataIndex: "actualQty",  key: "actualQty",  width: 220, align: "right" as const, sorter: (a, b) => a.actualQty - b.actualQty, render: (v: number) => <span style={{ color: "#059669", fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "หน่วยนับ",          key: "unit",              dataIndex: "unit", width: 100, align: "center" as const, render: (v: string) => <span style={{ color: "#374151" }}>{v || "-"}</span> },
  ];

  const antTableProps: TableProps<TableRow> = {
    columns: antColumns,
    dataSource: tableData,
    size: "middle",
    pagination: { current: tablePage, pageSize: tablePageSize, showSizeChanger: true, pageSizeOptions: ["10","20","50"], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, locale: { items_per_page: "/หน้า", jump_to: "ไปที่", page: "หน้า" }, onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); } },
    scroll: { x: 1830 },
  };

  /* bar chart — only companies present in filtered rows */
  const chartMap: Record<string, { id: string; name: string; qty: number }> = {};
  rows.forEach((r) => {
    if (!chartMap[r.companyId]) chartMap[r.companyId] = { id: r.companyId, name: r.company, qty: 0 };
    chartMap[r.companyId].qty += r.qty;
  });
  const chartData = Object.values(chartMap).filter((d) => !hiddenCompanies.has(d.id)).sort((a, b) => b.qty - a.qty);

  /* pie chart — จำนวนฉบับ (จำนวนรายการ) แยกตามผู้ประกอบการ */
  const PIE_COLORS = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#14B8A6", "#F97316"];
  const docCountMap: Record<string, { id: string; name: string; value: number }> = {};
  rows.forEach((r) => {
    if (!docCountMap[r.companyId]) docCountMap[r.companyId] = { id: r.companyId, name: r.company, value: 0 };
    docCountMap[r.companyId].value += 1;
  });
  const companyPieData = Object.values(docCountMap)
    .filter((d) => !hiddenCompanies.has(d.id))
    .sort((a, b) => b.value - a.value)
    .map((d, i) => ({ ...d, color: PIE_COLORS[i % PIE_COLORS.length] }));
  const totalDocs = companyPieData.reduce((s, d) => s + d.value, 0);
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

  /* active pie shape — สำหรับ pie จำนวนฉบับ (เฉพาะ sector ที่ขยาย ข้อความใช้ HTML overlay) */
  const renderActiveShapeDocs = (props: Record<string, number & string>) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    );
  };

  return (
    <div style={{ fontFamily: FF }}>

      {/* Header */}
      <div style={{ fontSize: 12, color: "#8B8E95", marginBottom: 4 }}>ระบบ Dashboard / Dashboard</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>ยอดอนุญาตให้สั่งหรือนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ</div>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 16 }}>ค้นหาข้อมูล</div>

        {/* Row 1: ช่วงวันที่อนุญาต (1/3) | ผู้ประกอบการ (2/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>ช่วงวันที่อนุญาต</label>
            <ThaiDateRangePicker from={f_dateFrom} to={f_dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to); }} />
          </div>
          <div>
            <label style={LBL}>ผู้ประกอบการ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={COMPANY_OPTIONS.map((c) => ({ id: c.id, label: c.name }))}
              selected={f_companies} onChange={setCompanies} showSearch />
          </div>
        </div>

        {/* Row 2: หน่วยนับ (1/3) | วัตถุหรืออาวุธ (2/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, alignItems: "end" }}>
          <div>
            <label style={LBL}>หน่วยนับ <span style={{ color: "#EF4444" }}>*</span></label>
            <SelectField value={f_unit} onChange={(v) => { setUnit(v); setWeapons([]); }} placeholder="เลือกหน่วยนับ"
              options={UNIT_OPTIONS.map((u) => ({ value: u.name, label: u.name }))} />
          </div>
          <div>
            <label style={LBL}>วัตถุหรืออาวุธ <span style={{ color: "#EF4444" }}>*</span></label>
            <MultiSelect placeholder="เลือกวัตถุหรืออาวุธ"
              options={filteredWeaponOptions} selected={f_weapons} onChange={setWeapons} showSearch />
          </div>
        </div>

        {/* Row 3: ปุ่ม รีเซ็ต / ค้นหา */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={handleReset}
            style={{ height: 44, padding: "0 20px", fontSize: 13, border: `1.5px solid ${PRIMARY}`, borderRadius: 10, background: "#fff", color: PRIMARY, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
            รีเซ็ต
          </button>
          <button onClick={handleSearch} disabled={!f_unit || !f_weapons.length}
            style={{ width: 44, height: 44, borderRadius: 10, background: (!f_unit || !f_weapons.length) ? "#D1D5DB" : PRIMARY, border: "none", cursor: (!f_unit || !f_weapons.length) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (f_unit && f_weapons.length) (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
            onMouseLeave={(e) => { if (f_unit && f_weapons.length) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
            <Search size={17} color="#fff" />
          </button>
        </div>
      </div>

      {/* Chart — Top 5 ประเทศผู้ผลิต (แท่งแนวตั้ง) */}
      <div ref={countryChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>ยอดอนุญาตให้สั่งหรือนำเข้าวัตถุหรืออาวุธ</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>Top 5 แยกตามประเทศผู้ผลิต{searched && a.unit ? ` (${a.unit})` : ""}</div>
          </div>
          <div data-capture-hide style={{ display: "flex", gap: 6 }}>
            <button onClick={() => copyPNG(countryChartRef, setCopiedCountry)}
              style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: copiedCountry ? "#059669" : "#6B7280", cursor: "pointer" }}>
              {copiedCountry ? <Check size={13} /> : <Copy size={13} />}{copiedCountry ? "คัดลอกแล้ว" : "Copy"}
            </button>
            <button onClick={() => downloadPNG(countryChartRef, "chart-top5-country.png")}
              style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#6B7280", cursor: "pointer" }}>
              <Download size={13} />PNG
            </button>
          </div>
        </div>
        {top5Country.length === 0 ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
            {searched ? "ไม่พบข้อมูล" : "กรุณาค้นหาข้อมูล"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top5Country} margin={{ left: 10, right: 20, top: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#4B5563" }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} interval={0} />
              <YAxis type="number" tick={{ fontSize: 11, fill: "#4B5563" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F5F3FF" }} />
              <Bar dataKey="qty" radius={[6, 6, 0, 0]} maxBarSize={72}
                label={{ position: "top", fontSize: 11, fill: "#374151", fontWeight: 600, formatter: (v: number) => v.toLocaleString() }}
                onMouseEnter={(_: unknown, index: number) => setActiveCountryIndex(index)}
                onMouseLeave={() => setActiveCountryIndex(undefined)}>
                {top5Country.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]}
                    opacity={activeCountryIndex === undefined || activeCountryIndex === i ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม Top 5</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{top5Country.reduce((s, d) => s + d.qty, 0).toLocaleString()}{a.unit ? ` ${a.unit}` : ""}</span>
        </div>
      </div>

      {/* Charts — bar (left) + pie (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: 16, marginBottom: 16 }}>

      {/* Bar chart — แยกตามผู้ประกอบการ (ตามหน่วยนับ) */}
      <div ref={barChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>ยอดอนุญาตให้สั่งหรือนำเข้าวัตถุหรืออาวุธ</div>
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

      {/* Pie chart — จำนวนฉบับ แยกตามผู้ประกอบการ */}
      <div ref={pieChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119", marginBottom: 2 }}>ยอดหนังสืออนุญาตให้สั่งหรือนำเข้าวัตถุหรืออาวุธ</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>แยกตามผู้ประกอบการ (ฉบับ)</div>
          </div>
          <div data-capture-hide style={{ display: "flex", gap: 6 }}>
            <button onClick={() => copyPNG(pieChartRef, setCopiedPie)}
              style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: copiedPie ? "#059669" : "#6B7280", cursor: "pointer" }}>
              {copiedPie ? <Check size={12} /> : <Copy size={12} />}{copiedPie ? "คัดลอกแล้ว" : "Copy"}
            </button>
            <button onClick={() => downloadPNG(pieChartRef, "chart-company-docs.png")}
              style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 9px", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#6B7280", cursor: "pointer" }}>
              <Download size={12} />PNG
            </button>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={companyPieData} cx="50%" cy="50%" innerRadius={72} outerRadius={120} paddingAngle={3} dataKey="value"
                activeIndex={lockedPieIndex ?? activePieIndex}
                activeShape={renderActiveShapeDocs as Parameters<typeof Pie>[0]["activeShape"]}
                onMouseEnter={(_: unknown, index: number) => { if (lockedPieIndex === undefined) setActivePieIndex(index); }}
                onMouseLeave={() => { if (lockedPieIndex === undefined) setActivePieIndex(undefined); }}
                onClick={(_: unknown, index: number) => {
                  setLockedPieIndex((prev) => prev === index ? undefined : index);
                  setActivePieIndex(undefined);
                }}
                cursor="pointer">
                {companyPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {(() => {
            const sel = lockedPieIndex ?? activePieIndex;
            const d = sel !== undefined ? companyPieData[sel] : undefined;
            if (!d) return null;
            const pct = totalDocs > 0 ? ((d.value / totalDocs) * 100).toFixed(1) : "0.0";
            return (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none", width: 150 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY, marginTop: 2 }}>{d.value.toLocaleString()} ฉบับ</div>
                <div style={{ fontSize: 11, color: "#8B8E95", marginTop: 1 }}>{pct}%</div>
              </div>
            );
          })()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {companyPieData.map((d) => {
            const pct = totalDocs > 0 ? ((d.value / totalDocs) * 100).toFixed(1) : "0.0";
            return (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1119" }}>{d.value.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: "#8B8E95", width: 44, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 0", borderTop: "1px solid #F3F4F6", marginTop: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1119", flex: 1 }}>ยอดรวม</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{totalDocs.toLocaleString()} ฉบับ</span>
          </div>
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
            {companyPieData.map((c, i) => {
              const hidden = hiddenCompanies.has(c.id);
              return (
                <button key={c.id} onClick={() => toggleCompany(c.id)}
                  style={{ height: 24, padding: "0 10px", fontSize: 11, borderRadius: 20, border: `1.5px solid ${hidden ? "#E5E7EB" : PIE_COLORS[i % PIE_COLORS.length]}`, background: hidden ? "#F9FAFB" : PIE_COLORS[i % PIE_COLORS.length] + "22", color: hidden ? "#9CA3AF" : PIE_COLORS[i % PIE_COLORS.length], cursor: "pointer", fontWeight: 500, textDecoration: hidden ? "line-through" : "none", transition: "all 0.15s" }}>
                  {c.name}
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
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0E1119" }}>รายการยอดอนุญาตให้สั่งหรือนำเข้าวัตถุหรืออาวุธ</span>
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
