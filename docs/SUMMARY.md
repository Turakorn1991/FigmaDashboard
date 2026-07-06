# สรุปโครงการ — DID Dashboard

> อัปเดตล่าสุด: 20 มิ.ย. 2569 · ระบบ Dashboard ข้อมูลการอนุญาต/ขนย้าย/นำเข้าอาวุธและวัตถุ
> เอกสารนี้เป็น context หลักสำหรับ session ใหม่ · ดู `docs/API-SPEC.md` สำหรับ API

---

## 1. Tech Stack & คำสั่ง

React + Vite + TypeScript · react-router (BrowserRouter + basename) · Recharts · Ant Design Table · xlsx · html-to-image · inline styles · Primary `#6574FF` · Font `'Noto Sans Thai', Inter`
**ข้อมูลเป็น mock ทั้งหมด** (ยังไม่มี backend) · TypeScript ไม่ได้ติดตั้ง → typecheck ด้วย esbuild เท่านั้น

```bash
npm run dev                        # dev → http://localhost:5173/pamfmockup/
npm run build                      # production → dist/
node scripts/parseMoveLicense.mjs  # regen ข้อมูลเมนู 1/4/5 (SAMPLE_SIZE=2000)
node scripts/parseImportData.mjs   # regen ข้อมูลเมนู 3
```

**Preview ตอน dev (สำหรับ AI):** สร้าง `.claude/launch.json` ที่ session root ชี้ `npm --prefix D:/FigmaMake/FigmaDashboard run dev -- --port 5180 --strictPort` → `preview_start` → เข้าถึงที่ base `/pamfmockup/`

---

## 2. Deploy แบบ Sub-path `/pamfmockup`

- `vite.config.ts` → `base: "/pamfmockup/"`
- `src/main.tsx` → `<BrowserRouter basename={import.meta.env.BASE_URL ตัด /}>`
- `public/web.config` → IIS SPA rewrite `/pamfmockup/index.html` + `<remove>` ก่อน `<mimeMap>` (กัน 500.19)
- Deploy: `npm run build` → ก๊อป `dist/` ลงโฟลเดอร์ `pamfmockup` (ตั้งเป็น IIS Application) + ต้องมี URL Rewrite Module

---

## 3. เมนู Dashboard (1–5)

| # | ชื่อ | Route | ข้อมูล | ไฟล์ |
|---|---|---|---|---|
| 1 | ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ | `/dashboard/1` | จริง moveLicense | `Page1Overview.tsx` |
| 2 | ยอดการขนย้าย/ส่งมอบฯ ตามแบบ อ.10 | `/dashboard/2` | **mock 50 แถว (เดิม)** | `Page2Company.tsx` |
| 3 | ยอดอนุญาตให้สั่งหรือนำเข้าฯ | `/dashboard/3` | จริง weaponItems | `Page3Ammo.tsx` |
| 4 | ติดตามสถานะการขนย้ายฯ ที่ยังไม่หมดอายุ | `/dashboard/4` | จริง moveLicense | `Page4Recipients.tsx` |
| 5 | จำนวนหนังสืออนุญาตให้ สั่ง ขาย ขนย้ายฯ | `/dashboard/5` | จริง moveLicense | `Page5Permits.tsx` |

### Filter เมนู 1 = เมนู 2 (โครงเดียวกัน 4 บรรทัด)
1. **ช่วงวันที่** (ThaiDateRangePicker ปฏิทิน 2 เดือน) · ประเภทขนย้าย · **ประเภทการขนย้าย** — `1fr 1fr 1fr`
2. ผู้ประกอบการ · **ภาค(ผู้รับปลายทาง)** · **จังหวัด(ผู้รับปลายทาง)** — `1fr 1fr 1fr`
3. **กลุ่มหน่วยผู้ซื้อ(ผู้รับปลายทาง)** · **หน่วยผู้ซื้อ(ผู้รับปลายทาง)** — `1fr 2fr`
4. ประเภทอาวุธ\* · หน่วยนับ\* · อาวุธ — `1fr 1fr 1fr` (\* บังคับ)

**relate:** ภาค→จังหวัด (กรอง `dstProvince`) · กลุ่ม→หน่วยผู้ซื้อ
**DDL กลุ่มหน่วยผู้ซื้อ 9 กลุ่ม (ทั้งเมนู 1 และ 2):** ทหาร · สนามยิงปืนทหาร · ตำรวจ · สนามยิงปืนตำรวจ · ส่วนราชการตามกฎกระทรวง · รัฐวิสาหกิจตามกฎกระทรวง · ภาคเอกชน (สมาคม บริษัทฯ) · อื่น ๆ · ไม่ระบุ (map จากหน่วยผู้ซื้อแบบ deterministic ด้วย `buyerUnitGroupId`)
**DDL ประเภทการขนย้าย 5 ค่า:** ให้หน่วยงานตามมาตรา 7 · ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7 · เพื่อทดสอบ · เพื่อจัดแสดง · กลับโรงงาน
**Trick map:** ประเภทขนย้าย = "ขายขนย้ายใน/นอกราชอาณาจักร" → ประเภทการขนย้าย = "ขายและขนย้ายให้บุคคลอื่นนอกมาตรา 7" เท่านั้น (ที่เหลือ "ขนย้าย" → 4 ค่าอื่น)

### เมนู 1 — เฉพาะ
- ข้อมูล moveLicense (2,000 แถว) · `dstProvince` = จังหวัดปลายทาง
- ฟิลด์ mock: `moveCategory`, `actualQty` (=qty×0.72–1.0), `purchaseDoc`
- กราฟ: เอกสารการซื้อ (แท่งตั้ง) + กลุ่มหน่วยผู้ซื้อ (วงกลม 9 สี) + ผู้ประกอบการ (แท่งนอน) — ยอดรวมทุกกราฟ
- ตาราง 13 คอลัมน์: # · เลขที่หนังสือ อ.10 · วันที่อนุญาต · วันที่หมดอายุ · ประเภทขนย้าย · ประเภทการขนย้าย · ผู้ประกอบการ · กลุ่มหน่วยผู้ซื้อ · หน่วยผู้ซื้อ · อาวุธ · จำนวนที่ได้รับอนุญาต · จำนวนขนย้ายจริง · หน่วยนับ
- Export 35 คอลัมน์ (ต้นทาง+ปลายทาง+เอกสารการซื้อ+ภาคปลายทาง+จำนวนขนย้ายจริง)

### เมนู 2 — เฉพาะ (⚠️ ยังใช้ mock 50 แถวเดิม + กราฟ/ตาราง/Export เดิม)
- **แก้เฉพาะ Filter** ให้เหมือนเมนู 1 (ข้างบน) — เพิ่มฟิลด์ `moveCategory` ในข้อมูล mock, re-map `buyerGroupId` เป็น 9 กลุ่ม
- ⚠️ ช่วงวันที่เป็น **UI เท่านั้น ยังไม่กรองตามวันที่** (พฤติกรรมเดิม + วันที่ mock เป็น พ.ศ. คนละ format กับ range picker)
- ฟิลด์เดิม: `transportQty` (จำนวนที่ขนย้าย), `transportDate` (วันที่ขนย้าย), `transportRound` (ครั้งที่ขนย้าย)
- กราฟเดิม 3 ตัว: Top5 แยกตามหน่วยผู้ซื้อ (แท่ง) · ผู้ประกอบการ (แท่ง) · กลุ่มหน่วยผู้ซื้อ (วงกลม) — ทั้งหมดใช้ transportQty
- ตารางเดิม: มี วันที่ขนย้าย/ครั้งที่ขนย้าย/จำนวนที่ขนย้าย · Export เดิม

### เมนู 3
- `weaponItems.ts` (2,551 แถว) — **เฉพาะเมนูนี้** · Filter: วันที่ · ผู้ประกอบการ · หน่วยนับ\* · วัตถุหรืออาวุธ\* (3/4) · กราฟ แท่งซ้าย(8fr)/วงกลมขวา(4fr)

### เมนู 4
- moveLicense → กลุ่มเป็น **ฉบับ** + สถานะ 3 แบบ (รอ/กำลัง/เสร็จ ~40/30/30) · กราฟ grouped-bar + แท่ง + วงกลม

### เมนู 5
- moveLicense → **ฉบับ** + ประเภทหนังสือ 4 แบบ (อ.8/อ.10/อ.16/อ.17) · ตารางแสดงชื่อประเภทเต็ม (ข้อความล้วน)

### มาตรฐานกราฟร่วม
hover-dim · active pie + center text · toggle chips · ยอดรวมทุกกราฟ · Copy/PNG · หัวข้อขึ้น 2 บรรทัดตรง "แยกตาม..."

---

## 4. Data Layer

| ไฟล์ | ใช้ที่ | จำนวน |
|---|---|---|
| `public/moveLicense.rows.json` (1.5MB, **runtime fetch**) | เมนู 1,4,5 | 2,000 แถว (sample จาก 12,749) |
| `src/app/data/moveLicense.ts` (79KB) | เมนู 1,4,5 | DDL + `loadMoveRows()` |
| `src/app/data/weaponItems.ts` | **เมนู 3 เท่านั้น** | 2,551 แถว |
| `src/app/data/buyerUnits.ts` | เมนู 1, 2 | 375 หน่วย |

> **บทเรียน:** ฝังข้อมูลใหญ่ใน JS bundle → dev module 27MB → จอขาว · แก้โดยย้ายเป็น JSON runtime fetch + sample 2,000 แถว

---

## 5. API Layer (`src/app/api/` + `docs/API-SPEC.md`)

- 1 endpoint/เมนู (`POST /dashboard/{menu}/query`) คืนกราฟทุกตัว + ตาราง · Unified Chart Object 4 ประเภท (`bar-vertical`/`bar-horizontal`/`pie`/`grouped-bar`)
- `api/types.ts` · `api/client.ts` (`api.*.query()`, `api.lookups.*`, `setAuthToken`) · `api/adapters.ts` (`toSimpleData`/`toGroupedData`) · `api/index.ts`
- สี/toggle/pagination/sort = FE ทำ client-side
- Backend ต้องเตรียม: `purchaseDoc`/`moveCategory`/`actualQty` (เมนู1/2) · `status`+expire (เมนู4) · `permitType` (เมนู5)

---

## 6. งานที่ค้าง / อาจทำต่อ
- เมนู 2 ยังไม่ได้พอร์ตข้อมูลเป็น moveLicense (ยังเป็น mock 50 แถว) — ถ้าอยากให้ charts/table ใช้ข้อมูลจริงต้องพอร์ตเพิ่ม
- เมนู 2 range picker ยังไม่กรองตามวันที่
- API ยังเป็นแค่ spec/stub (backend ยังไม่ทำ)
