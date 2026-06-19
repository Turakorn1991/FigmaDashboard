# สรุปงาน — Session 4

**วันที่:** 19 มิถุนายน 2569

---

## 1. Deploy บน IIS

### กรณีมี Sub-path (เช่น `/pamfmockup`)
| ไฟล์ | แก้ |
|---|---|
| `vite.config.ts` | `base: "./"` (relative path ใช้ได้กับ sub-path) |
| `src/main.tsx` | `<BrowserRouter basename="/pamfmockup">` |
| `public/web.config` | rewrite `^pamfmockup/(.*)` → `/pamfmockup/index.html` |

### กรณีไม่มี Sub-path (วาง root)
| ไฟล์ | แก้ |
|---|---|
| `src/main.tsx` | `<BrowserRouter>` (ไม่มี basename) |
| `public/web.config` | rewrite `.*` → `/index.html` |

> IIS ต้องติดตั้ง **URL Rewrite module** ก่อน
> Application Pool → .NET CLR = **No Managed Code**
> `web.config` วางใน `public/` → Vite copy ไป `dist/` อัตโนมัติ

---

## 2. Filter ประเภทขนย้าย (Multi-select) — ทั้ง 2 เมนู

- เพิ่ม `MultiSelect` "ประเภทขนย้าย" ใน **บรรทัดแรก** ก่อน "ผู้ประกอบการ"
- Row 1: `วันที่ เริ่ม | วันที่ สิ้นสุด | ประเภทขนย้าย | ผู้ประกอบการ` (grid `1fr 1fr 1fr 1fr`)
- Row 2: `ภาค | กลุ่มหน่วยผู้ซื้อ | หน่วยผู้ซื้อ` (grid `1fr 1fr 2fr`)
- เลือกได้หลายค่า: `ขนย้าย` / `ขายขนย้ายในราชอาณาจักร` / `ขายขนย้ายนอกราชอาณาจักร`
- กรองตอนกด Search (ผ่าน `a.transportTypes`)

---

## 3. กราฟหน้า ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ (Page1)

ปรับ layout กราฟใหม่:

**บรรทัดแรก** (2 กราฟ, grid `1fr 1fr`)
- ซ้าย: **แยกตามเอกสารการซื้อ** → กราฟ**แท่งแนวตั้ง** (columns)
  - ข้อมูล `PURCHASE_DOCS`: หนังสือขอซื้อ / ใบสั่งซื้อ / สัญญาซื้อขายรัฐ / ไม่ระบุ
  - field `purchaseDoc: PURCHASE_DOCS[r.id % 4]`
- ขวา: **แยกตามกลุ่มหน่วยผู้ซื้อ** → กราฟวงกลม (เหมือนเดิม)

**บรรทัด 2** (เต็มความกว้าง)
- **แยกตามผู้ประกอบการ** → กราฟแท่งแนวนอน (เหมือนเดิม)

---

## 4. ยอดรวมในทุกกราฟ (Page1 + Page2)

- เพิ่มแถว **"ยอดรวม"** (ตัวหนาสีน้ำเงิน + หน่วยนับ) ในทุกกราฟ
- คำนวณจากเฉพาะรายการที่แสดง (ปรับตาม toggle chips)
- **Pattern:**
  - กราฟแท่ง → `<div>ยอดรวม</div>` หลัง `})()}` ก่อน toggle chips
  - กราฟวงกลม → แถวท้าย legend list
  - ใช้ `.reduce((s,d)=>s+d.value,0)` หรือ `s+d.qty`

Page2 ครบ 3 กราฟ: Top5 หน่วยผู้ซื้อ / กลุ่มหน่วยผู้ซื้อ / ผู้ประกอบการ

---

## 5. ปรับคำ (ทุกจุด)

`ยอดการขนย้าย/ส่งมอบอาวุธหรือวัตถุ`
→ `ยอดการขนย้าย/ส่งมอบอาวุธหรือวัตถุ ตามแบบ อ.10`

แก้ที่: หัวข้อหน้า Page2 · ชื่อตาราง Page2 · เมนู Sidebar

---

## 6. Export Page1 — เพิ่มคอลัมน์ เอกสารการซื้อ

- เพิ่มคอลัมน์ **เอกสารการซื้อ** (`r.purchaseDoc`) หลัง **วันที่หมดอายุ** ก่อน **ประเภทขนย้าย**
- ปรับ `!cols` width array ตาม

---

## ไฟล์ที่แก้ไขในเซสชันนี้

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `vite.config.ts` | base path (sub-path deployment) |
| `src/main.tsx` | BrowserRouter basename |
| `public/web.config` | IIS URL rewrite |
| `src/app/components/pages/Page1Overview.tsx` | Filter ประเภทขนย้าย, กราฟแท่งเอกสารการซื้อ, ยอดรวมทุกกราฟ, Export คอลัมน์เอกสารการซื้อ |
| `src/app/components/pages/Page2Company.tsx` | Filter ประเภทขนย้าย, ยอดรวม 3 กราฟ, ปรับคำ อ.10 |
| `src/app/components/Sidebar.tsx` | ปรับคำเมนู อ.10 |
