import { useState, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, FileText, ChevronDown, X, Download, Copy, Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
import { Table, ConfigProvider } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";

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

type MockRow = RawRow & {
  docNo: string; expireDate: string; transportType: TransportType;
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
  const [f_buyers,      setBuyers]      = useState<string[]>([]);
  const [f_buyerUnits,  setBuyerUnits]  = useState<string[]>([]);
  const [a, setA] = useState({ companies: [] as string[], weaponType: "", unit: "", region: "", buyers: [] as string[], buyerUnits: [] as string[], weapons: [] as string[] });
  const [searched, setSearched] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const handleSearch = () => { setA({ companies: f_companies, weaponType: f_weaponType, unit: f_unit, region: f_region, buyers: f_buyers, buyerUnits: f_buyerUnits, weapons: f_weapons }); setSearched(true); setTablePage(1); };
  const handleReset  = () => {
    setDateFrom(""); setDateTo(""); setCompanies([]); setWeaponType(""); setUnit(""); setWeapons([]);
    setRegion(""); setBuyers([]); setBuyerUnits([]);
    setA({ companies: [], weaponType: "", unit: "", region: "", buyers: [], buyerUnits: [], weapons: [] });
    setSearched(false);
  };

  /* chart interaction */
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [lockedPieIndex, setLockedPieIndex] = useState<number | undefined>(undefined);
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
    if (a.region   && r.regionId !== a.region)                    return false;
    if (a.buyers.length    && !a.buyers.includes(r.buyerGroupId)) return false;
    if (a.buyerUnits.length && !a.buyerUnits.includes(r.buyerUnit)) return false;
    if (a.weapons.length) {
      if (!a.weapons.includes(r.weaponId)) return false;
    } else if (a.weaponType) {
      const fn = WEAPON_TYPE_FILTER[a.weaponType];
      if (fn) {
        const weapon = WEAPONS.find((w) => w.id === r.weaponId);
        if (!weapon || !fn(weapon)) return false;
      }
    }
    return true;
  });

  const filteredWeaponOptions = f_weaponType
    ? WEAPONS.filter((w) => WEAPON_TYPE_FILTER[f_weaponType]?.(w) ?? true)
    : [];

  const buyerUnitOptions = [
    ...new Set(
      MOCK_ROWS
        .filter((r) => f_buyers.length === 0 || f_buyers.includes(r.buyerGroupId))
        .map((r) => r.buyerUnit)
    )
  ].sort((a, b) => a.localeCompare(b, "th")).map((u) => ({ id: u, label: u }));

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
      "เลขที่หนังสือ","วันที่อนุญาต","วันที่หมดอายุ","ประเภทขนย้าย","ผู้ประกอบการ",
      "กลุ่มหน่วยผู้ซื้อ","หน่วยผู้ซื้อ",
      "สถานที่ต้นทาง","บ้านเลขที่สถานที่ต้นทาง","อาคารสถานที่ต้นทาง","หมู่ที่สถานที่ต้นทาง",
      "ซอยสถานที่ต้นทาง","ถนนสถานที่ต้นทาง","ตำบลสถานที่ต้นทาง","อำเภอสถานที่ต้นทาง",
      "จังหวัดสถานที่ต้นทาง","รหัสไปรษณีย์สถานที่ต้นทาง",
      "สถานที่ปลายทาง","บ้านเลขที่สถานที่ปลายทาง","อาคารสถานที่ปลายทาง","หมู่ที่สถานที่ปลายทาง",
      "ซอยสถานที่ปลายทาง","ถนนสถานที่ปลายทาง","ตำบลสถานที่ปลายทาง","อำเภอสถานที่ปลายทาง",
      "จังหวัดสถานที่ปลายทาง","รหัสไปรษณีย์สถานที่ปลายทาง",
      "รหัสอาวุธ","ชื่ออาวุธ","จำนวน","หน่วยนับ",
    ];
    const dataRows = rows.map((r) => [
      r.docNo, formatThaiDate(r.date), r.expireDate, r.transportType, r.company,
      BUYER_GROUPS.find((b) => b.id === r.buyerGroupId)?.label ?? "", r.buyerUnit,
      r.company, r.srcBaan, r.srcAkhan, r.srcMoo, r.srcSoi, r.srcRoad, r.srcTambon, r.srcAmphoe, r.srcProvince, r.srcZip,
      r.buyerUnit, r.dstBaan, r.dstAkhan, r.dstMoo, r.dstSoi, r.dstRoad, r.dstTambon, r.dstAmphoe, r.dstProvince, r.dstZip,
      r.weaponCode, r.weaponName, r.qty, a.unit || "-",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws["!cols"] = headers.map((_, i) => ({ wch: [18,14,14,24,40,20,60,40,10,10,6,14,20,14,16,20,8,60,10,10,6,14,20,14,16,20,8,12,40,10,8][i] ?? 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลดิบ");
    XLSX.writeFile(wb, "ข้อมูลดิบยอดอนุญาตให้ขายขนย้ายอาวุธ.xlsx");
  };

  const exportSummaryExcel = () => {
    const exportData = rows.map((r, i) => ({
      "#": i + 1,
      "ผู้ประกอบการ": r.company,
      "กลุ่มหน่วยผู้ซื้อ": BUYER_GROUPS.find((b) => b.id === r.buyerGroupId)?.label ?? "",
      "อาวุธ": WEAPONS.find((w) => w.id === r.weaponId)?.label ?? r.weaponId,
      "จำนวน": r.qty,
      "หน่วยนับ": a.unit,
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
    dateFormatted: formatThaiDate(r.date),
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
    { title: "วันที่อนุญาต",    dataIndex: "dateFormatted", key: "date",          width: 120, sorter: (a, b) => a.date.localeCompare(b.date) },
    { title: "วันที่หมดอายุ",   dataIndex: "expireDate",    key: "expireDate",    width: 120 },
    { title: "ประเภทขนย้าย",   dataIndex: "transportType", key: "transportType", width: 210,
      filters: TRANSPORT_TYPES.map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.transportType === value,
      render: (v: TransportType) => <span>{v}</span>,
    },
    { title: "ผู้ประกอบการ",    dataIndex: "company",       key: "company",       width: 220, sorter: (a, b) => a.company.localeCompare(b.company, "th"), ...getColSearchProps("company", "ผู้ประกอบการ") },
    { title: "กลุ่มหน่วยผู้ซื้อ", dataIndex: "buyerGroupLabel", key: "buyerGroup", width: 170, sorter: (a, b) => a.buyerGroupLabel.localeCompare(b.buyerGroupLabel, "th"), ...getColSearchProps("buyerGroupLabel", "กลุ่มหน่วยผู้ซื้อ") },
    { title: "หน่วยผู้ซื้อ",    dataIndex: "buyerUnit",     key: "buyerUnit",     width: 220, sorter: (a, b) => a.buyerUnit.localeCompare(b.buyerUnit, "th"), ...getColSearchProps("buyerUnit", "หน่วยผู้ซื้อ") },
    { title: "อาวุธ",           dataIndex: "weaponLabel",   key: "weapon",        width: 200, sorter: (a, b) => a.weaponLabel.localeCompare(b.weaponLabel, "th"), ...getColSearchProps("weaponLabel", "อาวุธ") },
    { title: "จำนวน",           dataIndex: "qty",           key: "qty",           width: 120, align: "right" as const, sorter: (a, b) => a.qty - b.qty, render: (v: number) => <span style={{ color: PRIMARY, fontWeight: 600 }}>{v.toLocaleString()}</span> },
    { title: "หน่วยนับ",        key: "unit",                                       width: 90,  align: "center" as const, render: () => <span style={{ color: "#374151" }}>{a.unit || "-"}</span> },
  ];

  const antTableProps: TableProps<TableRow> = {
    columns: antColumns,
    dataSource: tableData,
    size: "middle",
    pagination: { current: tablePage, pageSize: tablePageSize, showSizeChanger: true, pageSizeOptions: ["10","20","50"], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`, locale: { items_per_page: "/หน้า", jump_to: "ไปที่", page: "หน้า" }, onChange: (p, ps) => { setTablePage(p); setTablePageSize(ps); } },
    scroll: { x: 1670 },
  };

  /* bar chart — only companies present in filtered rows */
  const chartMap: Record<string, { id: string; name: string; qty: number }> = {};
  rows.forEach((r) => {
    if (!chartMap[r.companyId]) chartMap[r.companyId] = { id: r.companyId, name: r.company, qty: 0 };
    chartMap[r.companyId].qty += r.qty;
  });
  const chartData = Object.values(chartMap).filter((d) => !hiddenCompanies.has(d.id)).sort((a, b) => b.qty - a.qty);

  /* pie chart — only buyer groups present in filtered rows */
  const PIE_COLORS = ["#6574FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
  const activeBuyerGroupIds = [...new Set(rows.map((r) => r.buyerGroupId))];
  const buyerPieData = BUYER_GROUPS
    .filter((bg) => activeBuyerGroupIds.includes(bg.id))
    .map((bg, i) => ({
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
      <div style={{ fontSize: 12, color: "#8B8E95", marginBottom: 4 }}>ระบบ Dashboard / Dashboard</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0E1119" }}>ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ</div>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.08)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E1119", marginBottom: 16 }}>ค้นหาข้อมูล</div>

        {/* Row 1: วันที่อนุญาต เริ่มเริ่ม 1/4 | วันที่อนุญาต เริ่มสิ้นสุด 1/4 | ผู้ประกอบการ 2/4 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>วันที่อนุญาต เริ่ม</label>
            <ThaiDatePicker value={f_dateFrom} onChange={setDateFrom} />
          </div>
          <div>
            <label style={LBL}>วันที่อนุญาต สิ้นสุด</label>
            <ThaiDatePicker value={f_dateTo} onChange={setDateTo} />
          </div>
          <div>
            <label style={LBL}>ผู้ประกอบการ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={COMPANIES.map((c) => ({ id: c.id, label: c.name }))}
              selected={f_companies} onChange={setCompanies} showSearch />
          </div>
        </div>

        {/* Row 2: ภาค 1/4 | กลุ่มหน่วยผู้ซื้อ 1/4 | หน่วยผู้ซื้อ 2/4 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={LBL}>ภาค</label>
            <SelectField value={f_region} onChange={setRegion} placeholder="ทั้งหมด"
              options={REGIONS.map((r) => ({ value: r.id, label: r.label }))} />
          </div>
          <div>
            <label style={LBL}>กลุ่มหน่วยผู้ซื้อ</label>
            <MultiSelect placeholder="ทั้งหมด"
              options={BUYER_GROUPS.map((b) => ({ id: b.id, label: b.label }))}
              selected={f_buyers} onChange={(v) => { setBuyers(v); setBuyerUnits([]); }} showSearch />
          </div>
          <div>
            <label style={LBL}>หน่วยผู้ซื้อ</label>
            <MultiSelect placeholder="ทั้งหมด" options={buyerUnitOptions} selected={f_buyerUnits} onChange={setBuyerUnits} showSearch />
          </div>
        </div>

        {/* Row 3: ประเภทอาวุธ 1/4 | หน่วยนับ 1/4 | อาวุธ 2/4 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, alignItems: "end" }}>
          <div>
            <label style={LBL}>ประเภทอาวุธ <span style={{ color: "#EF4444" }}>*</span></label>
            <SelectField value={f_weaponType} onChange={(v) => { setWeaponType(v); setWeapons([]); if (v === "กระสุน") setUnit("นัด"); }} placeholder="เลือกประเภท"
              options={[{ value: "กระสุน", label: "กระสุน" }, { value: "ระเบิด", label: "ระเบิด" }, { value: "อาวุธปืน", label: "อาวุธปืน" }]} />
          </div>
          <div>
            <label style={LBL}>หน่วยนับ <span style={{ color: "#EF4444" }}>*</span></label>
            <SelectField value={f_unit} onChange={(v) => { setUnit(v); setWeapons([]); }} placeholder="เลือกหน่วยนับ"
              options={[
                { value: "อัน", label: "อัน" }, { value: "กระบอก", label: "กระบอก" }, { value: "เครื่อง", label: "เครื่อง" },
                { value: "ชิ้น", label: "ชิ้น" }, { value: "ชุด", label: "ชุด" }, { value: "กรัม", label: "กรัม" },
                { value: "กิโลกรัม", label: "กิโลกรัม" }, { value: "หม้อ", label: "หม้อ" }, { value: "หัว", label: "หัว" },
                { value: "ปลอก", label: "ปลอก" }, { value: "นัด", label: "นัด" }, { value: "เมตร", label: "เมตร" },
                { value: "แท่ง", label: "แท่ง" }, { value: "ดอก", label: "ดอก" }, { value: "ตลับ", label: "ตลับ" },
                { value: "ปอนด์", label: "ปอนด์" }, { value: "หลอด", label: "หลอด" }, { value: "แผ่น", label: "แผ่น" },
                { value: "ใบ", label: "ใบ" },
              ]} />
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
          <button onClick={handleSearch} disabled={!f_weaponType || !f_unit}
            style={{ width: 40, height: 40, borderRadius: 8, background: (!f_weaponType || !f_unit) ? "#D1D5DB" : PRIMARY, border: "none", cursor: (!f_weaponType || !f_unit) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (f_weaponType && f_unit) (e.currentTarget as HTMLButtonElement).style.background = "#515ed8"; }}
            onMouseLeave={(e) => { if (f_weaponType && f_unit) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}>
            <Search size={17} color="#fff" />
          </button>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Bar chart */}
        <div ref={barChartRef} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
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
