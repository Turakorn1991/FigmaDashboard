# API Specification — DID Dashboard (เมนู 1–5)

REST API ออกแบบให้ **ล้อกับการใช้งานจริงของ Frontend** — กราฟทุกตัวใช้ response schema เดียวกัน (รองรับกราฟ 4 ประเภท)

> เวอร์ชัน: 1.2 · อัปเดต: 20 มิ.ย. 2569

---

## 0. หลักการให้ "ล้อกับ Front" (อ่านก่อน)

พฤติกรรมจริงของแต่ละหน้า Dashboard:

1. ผู้ใช้ตั้งค่าตัวกรอง → กด **"ค้นหา"** → เรียก API **ครั้งเดียว**
2. ผลลัพธ์ชุดเดียวถูกใช้คำนวณ **กราฟทุกตัว + ตาราง** พร้อมกัน
3. การกระทำต่อไปนี้ทำ **ฝั่ง Client ล้วน — ไม่เรียก API ซ้ำ:**
   - toggle chips (ซ่อน/แสดง สถานะ/ประเภท/ผู้ประกอบการ ในกราฟ)
   - เปลี่ยนหน้า / เปลี่ยนจำนวนแถว (pagination) ของตาราง
   - sort คอลัมน์ / ค้นหาในคอลัมน์ (filter dropdown ของตาราง)
   - hover ไฮไลต์กราฟ, คลิกล็อกชิ้นวงกลม
4. ก่อนกดค้นหา หน้าจอแสดง "กดค้นหาเพื่อแสดงข้อมูล" (ยังไม่เรียก API)

**ผลต่อการออกแบบ:**
- ➜ ใช้ **1 endpoint ต่อเมนู** (`/query`) คืน **กราฟทุกตัว + แถวตารางทั้งหมดที่ผ่านตัวกรอง** ในครั้งเดียว
- ➜ Backend ทำ aggregate ของกราฟ + คืน `total` (ยอดรวม) มาให้
- ➜ Backend **ไม่ต้อง** ทำ endpoint แยกสำหรับ toggle / paginate / sort / column-search (FE จัดการเอง)
- ➜ Backend **ไม่ต้อง** ส่งสี (FE ลงสีเองตาม palette) แต่ต้องเรียง `categories` ตามที่กำหนด (ข้อ 2.2)

---

## 1. Conventions

| หัวข้อ | รายละเอียด |
|---|---|
| Base URL | `/api/v1` |
| Auth | `Authorization: Bearer <token>` |
| Method | `POST` (body = filter; รองรับ array สะอาดกว่า GET) |
| Content-Type | `application/json; charset=utf-8` |
| วันที่ | ISO `YYYY-MM-DD` (ค.ศ.) — FE แปลง พ.ศ. เอง |
| ตัวเลข | จำนวนเต็ม ไม่มีตัวคั่นหลักพัน (FE format เอง) |
| Envelope | `{ "data": <payload>, "error": null }` |

---

## 2. Unified Chart Object (ใช้กับทุกกราฟ)

ทุกกราฟใน response ใช้โครงนี้:

```jsonc
{
  "chartType": "bar-horizontal",   // 1 ใน 4 ประเภท (ข้อ 2.1)
  "valueUnit": "ฉบับ",             // หน่วย value เช่น "นัด"/"ฉบับ" (โชว์ต่อท้ายยอดรวม)
  "categories": [                  // แท่ง/ชิ้นวงกลม — เรียงตามลำดับแสดงผล (ข้อ 2.2)
    { "id": "6", "label": "บริษัท บุลเล็ท มาสเตอร์ จำกัด" }
  ],
  "series": [                      // values[i] คู่กับ categories[i]
    { "id": "value", "label": "จำนวน", "values": [899] }
  ],
  "total": 1647                    // ยอดรวมทุก value (ก่อน toggle) — FE โชว์ "ยอดรวม"
}
```

- `series[].values.length === categories.length` เสมอ
- **ไม่ต้องมี field `color`** — FE ลงสีเอง (map ตาม `id`/ลำดับ)
- `total` = ผลรวมเต็มก่อนผู้ใช้กด toggle (FE จะลบ/บวกเองเมื่อ toggle ฝั่ง client)

### 2.1 chartType — 4 ประเภท
| chartType | ลักษณะ | series | ใช้ที่ |
|---|---|---|---|
| `bar-vertical` | แท่งแนวตั้ง | 1 | เมนู1/2 "เอกสารการซื้อ" |
| `bar-horizontal` | แท่งแนวนอน | 1 | เมนู1/2/3/4/5 (ตามผู้ประกอบการ) |
| `pie` | วงกลม/โดนัท | 1 | ทุกเมนูที่มีวงกลม |
| `grouped-bar` | แท่งแนวนอนหลายชุดต่อหมวด | ≥2 | เมนู4 (สถานะ) · เมนู5 (ประเภทหนังสือ) |

### 2.2 การเรียง categories (สำคัญ — FE ลงสีตามลำดับนี้)
| categories คือ | ต้องเรียงแบบ |
|---|---|
| ผู้ประกอบการ | **มาก→น้อย** ตาม `total` ของแต่ละบริษัท (FE ลง palette ตาม index) |
| สถานะการขนย้าย | คงที่: `รอดำเนินการ, กำลังขนย้าย, เสร็จสิ้นแล้ว` |
| ประเภทหนังสือ | คงที่: `อ.8, อ.10, อ.16, อ.17` |
| กลุ่มหน่วยผู้ซื้อ | คงที่: `ทหาร(1), ตำรวจ(2), สมาคม(3), อื่น ๆ(9), ไม่ระบุ(0)` |
| เอกสารการซื้อ | คงที่: `หนังสือขอซื้อ, ใบสั่งซื้อ, สัญญาซื้อขายรัฐ, ไม่ระบุ` |

> `grouped-bar`: `categories` = ผู้ประกอบการ (เรียง total มาก→น้อย) · `series` = สถานะ/ประเภท (ลำดับคงที่)

### 2.3 ตัวอย่าง grouped-bar
```json
{ "chartType": "grouped-bar", "valueUnit": "ฉบับ",
  "categories": [ { "id": "6", "label": "บริษัท บุลเล็ท มาสเตอร์ จำกัด" },
                  { "id": "8", "label": "บริษัท ไทยอามส์ จำกัด" } ],
  "series": [
    { "id": "อ.8",  "label": "อ.8",  "values": [270, 124] },
    { "id": "อ.10", "label": "อ.10", "values": [269, 124] },
    { "id": "อ.16", "label": "อ.16", "values": [180, 83] },
    { "id": "อ.17", "label": "อ.17", "values": [180, 83] }
  ],
  "total": 1647 }
```

---

## 3. DDL / Lookup (โหลดครั้งเดียวตอนเปิดหน้า เติม dropdown)

| Endpoint | คืนค่า | เมนู |
|---|---|---|
| `GET /lookups/companies` | `[{ "id","name" }]` | 1–5 |
| `GET /lookups/units` | `["นัด", ...]` | 1,2,3 |
| `GET /lookups/weapon-categories` | `["กระสุน","ระเบิด","อาวุธปืน"]` | 1,2 |
| `GET /lookups/weapons?category=&unit=` | `[{ "code","name","category","unit" }]` | 1,2,3 |
| `GET /lookups/transport-types` | `["ขนย้าย", ...]` | 1,2 |
| `GET /lookups/regions` | `["ภาคกลาง", ...]` | 1,2 |
| `GET /lookups/provinces?region=` | `["กรุงเทพมหานคร", ...]` (relate กับ region) | 1,2 |
| `GET /lookups/buyer-groups` | `[{ "id","label" }]` | 1,2 |
| `GET /lookups/buyer-units?groupIds=` | `[{ "name","groupId" }]` | 1,2 |
| `GET /lookups/permit-types` | `[{ "code":"อ.8","name":"...(แบบ อ.8)" }]` | 5 |
| `GET /lookups/move-statuses` | `["รอดำเนินการ","กำลังขนย้าย","เสร็จสิ้นแล้ว"]` | 4 |

---

## 4. Query Endpoints (1 ตัว/เมนู) — request = state ตัวกรองของ FE

ทุกเมนูใช้ pattern เดียวกัน:
`POST /dashboard/{menu}/query` · body = ตัวกรองที่กด "ค้นหา" · response = `{ charts: {...}, table: {...} }`

> `table.rows` = **ทุกแถวที่ผ่านตัวกรอง** (FE แบ่งหน้า/sort/ค้นหาคอลัมน์ฝั่ง client) ·
> ถ้าชุดข้อมูลใหญ่มาก รองรับ server-side ได้ภายหลังด้วย `page/pageSize` (optional)

### 4.1 เมนู 1 — ยอดอนุญาตให้ขาย/ขนย้ายอาวุธ → `POST /dashboard/sale-move/query`
**Request** (ตรงกับ filter state ของ Page1)
```json
{ "dateFrom": "2018-01-01", "dateTo": "2019-12-31",
  "transportTypes": ["ขนย้าย"], "companies": ["1","6"],
  "region": "ภาคกลาง", "provinces": ["กรุงเทพมหานคร","ปทุมธานี"],
  "buyers": ["1","2"], "buyerUnits": [], "weaponCategory": "กระสุน",
  "unit": "นัด", "weapons": ["P-0034","P-0035"] }
```
> `weaponCategory` + `unit` บังคับ (FE disable ปุ่มค้นหาจนกว่าจะเลือก)
> `provinces` = จังหวัดปลายทาง (relate กับ `region`: ถ้าส่ง `region` มา จังหวัดที่เลือกจะอยู่ในภาคนั้น) · aggregate/filter ใช้ **จังหวัดปลายทาง**
> Lookup จังหวัดตามภาค: `GET /lookups/provinces?region=ภาคกลาง` → `["กรุงเทพมหานคร","ปทุมธานี", ...]` (ไม่ส่ง region = ทุกจังหวัด)

**Response.charts** (3 กราฟ · ทุกตัว `valueUnit = unit` · aggregate = `sum(qty)`)
| key | chartType | categories | FE variable |
|---|---|---|---|
| `purchaseDoc` | `bar-vertical` | เอกสารการซื้อ | `docPieData` |
| `buyerGroup` | `pie` | กลุ่มหน่วยผู้ซื้อ | `buyerPieData` |
| `company` | `bar-horizontal` | ผู้ประกอบการ (เรียง total) | `chartData` |

**Response.table.rows[]** (ตรงกับ `tableData`)
```json
{ "docNo":"384/2561","date":"2018-12-28","expireDate":"2019-03-27","purchaseDoc":"หนังสือขอซื้อ",
  "transportType":"ขนย้าย","company":"บริษัท ...","buyerGroup":"ทหาร","buyerUnit":"...",
  "weaponCode":"P-0040","weaponName":"กระสุนปืน ลูกซอง","qty":50000,"unit":"นัด" }
```
**Export** `POST /dashboard/sale-move/export?format=xlsx` (body = filter เดียวกัน) → เพิ่ม `src*`/`dst*` (place,baan,akhan,moo,soi,road,tambon,amphoe,province,zip)

### 4.2 เมนู 2 — ตามแบบ อ.10 → `POST /dashboard/move-a10/query`
**เหมือนเมนู 1 ทุกอย่าง** (request, charts 3 ตัว key เดิม, table, export) — เปลี่ยน path เป็น `move-a10`

### 4.3 เมนู 3 — สั่ง/นำเข้าฯ → `POST /dashboard/import/query`
**Request** (Page3) — `unit` + `weapons` บังคับ
```json
{ "dateFrom":"", "dateTo":"", "companies":[], "unit":"นัด", "weapons":["P-0034"] }
```
**Response.charts**
| key | chartType | categories | valueUnit | aggregate | FE variable |
|---|---|---|---|---|---|
| `companyQty` | `bar-horizontal` | ผู้ประกอบการ (เรียง total) | `unit` | sum(qty) | `chartData` |
| `companyDocs` | `pie` | ผู้ประกอบการ | `ฉบับ` | count(distinct docNo) | `companyPieData` |

**Response.table.rows[]**
```json
{ "docNo":"...","date":"2018-06-19","expireDate":"2019-06-18","company":"บริษัท ...",
  "weaponCode":"P-0034","weaponName":"...","qty":50000,"unit":"นัด" }
```
Export: `POST /dashboard/import/export?format=xlsx`

### 4.4 เมนู 4 — ติดตามสถานะการขนย้ายฯ → `POST /dashboard/move-status/query`
**Request** (Page4)
```json
{ "dateFrom":"", "dateTo":"", "companies":[] }
```
> Backend กรอง `expireDate >= วันปัจจุบัน` (server-side) · ส่ง `status` จริงต่อหนังสือ · ทุกกราฟ `valueUnit="ฉบับ"` · aggregate = `count(distinct docNo)`

**Response.charts**
| key | chartType | categories | series | FE variable |
|---|---|---|---|---|
| `byCompany` | `grouped-bar` | ผู้ประกอบการ (เรียง total) | สถานะ 3 ชุด | `companyStatusData` |
| `companyTotal` | `bar-horizontal` | ผู้ประกอบการ (เรียง total) | 1 | `companyTotalData` |
| `statusTotal` | `pie` | สถานะ (ลำดับคงที่) | 1 | `statusPieData` |

**Response.table.rows[]**
```json
{ "docNo":"384/2561","date":"2018-12-28","expireDate":"2019-03-27","company":"บริษัท ...","status":"เสร็จสิ้นแล้ว" }
```

### 4.5 เมนู 5 — จำนวนหนังสืออนุญาตฯ → `POST /dashboard/permits/query`
**Request** เหมือนเมนู 4 · Backend ส่ง `permitType` (อ.8/อ.10/อ.16/อ.17) ต่อหนังสือ · `valueUnit="ฉบับ"`

**Response.charts**
| key | chartType | categories | series | FE variable |
|---|---|---|---|---|
| `byCompany` | `grouped-bar` | ผู้ประกอบการ (เรียง total) | ประเภทหนังสือ 4 ชุด | `companyStatusData` |
| `companyTotal` | `bar-horizontal` | ผู้ประกอบการ (เรียง total) | 1 | `companyTotalData` |
| `typeTotal` | `pie` | ประเภทหนังสือ (ลำดับคงที่) | 1 | `typePieData` |

**Response.table.rows[]** (คอลัมน์ ประเภทหนังสือ แสดง `permitTypeName` ชื่อเต็ม; `permitType` ใช้ filter)
```json
{ "docNo":"...","date":"2018-12-28","expireDate":"2019-03-27","permitType":"อ.8",
  "permitTypeName":"หนังสืออนุญาตให้สั่งหรือนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ เพื่อใช้ในการผลิตอาวุธ ฯ (แบบ อ.8)",
  "company":"บริษัท ..." }
```

---

## 5. ตัวอย่าง Response เต็ม (เมนู 5)

`POST /dashboard/permits/query`  body `{ "dateFrom":"", "dateTo":"", "companies":[] }`
```json
{ "data": {
  "filter": { "dateFrom": "", "dateTo": "", "companies": [] },
  "charts": {
    "byCompany": {
      "chartType": "grouped-bar", "valueUnit": "ฉบับ",
      "categories": [ { "id":"6","label":"บริษัท บุลเล็ท มาสเตอร์ จำกัด" }, { "id":"8","label":"บริษัท ไทยอามส์ จำกัด" } ],
      "series": [
        { "id":"อ.8","label":"อ.8","values":[270,124] },
        { "id":"อ.10","label":"อ.10","values":[269,124] },
        { "id":"อ.16","label":"อ.16","values":[180,83] },
        { "id":"อ.17","label":"อ.17","values":[180,83] }
      ],
      "total": 1647
    },
    "companyTotal": {
      "chartType": "bar-horizontal", "valueUnit": "ฉบับ",
      "categories": [ { "id":"6","label":"บริษัท บุลเล็ท มาสเตอร์ จำกัด" }, { "id":"8","label":"บริษัท ไทยอามส์ จำกัด" } ],
      "series": [ { "id":"value","label":"จำนวน","values":[899,414] } ],
      "total": 1647
    },
    "typeTotal": {
      "chartType": "pie", "valueUnit": "ฉบับ",
      "categories": [ { "id":"อ.8","label":"อ.8" }, { "id":"อ.10","label":"อ.10" }, { "id":"อ.16","label":"อ.16" }, { "id":"อ.17","label":"อ.17" } ],
      "series": [ { "id":"value","label":"จำนวนฉบับ","values":[494,494,330,329] } ],
      "total": 1647
    }
  },
  "table": {
    "rows": [
      { "docNo":"384/2561","date":"2018-12-28","expireDate":"2019-03-27","permitType":"อ.8",
        "permitTypeName":"หนังสืออนุญาตให้สั่งหรือนำเข้ามาในราชอาณาจักรซึ่งวัตถุหรืออาวุธ เพื่อใช้ในการผลิตอาวุธ ฯ (แบบ อ.8)",
        "company":"บริษัท เนแรค อาร์มส อินดัสตรี จำกัด" }
    ],
    "total": 1647
  }
}}
```

---

## 6. สรุป

| เมนู | Endpoint | charts keys | table |
|---|---|---|---|
| 1 | `POST /dashboard/sale-move/query` | purchaseDoc, buyerGroup, company | ✓ + export |
| 2 | `POST /dashboard/move-a10/query` | purchaseDoc, buyerGroup, company | ✓ + export |
| 3 | `POST /dashboard/import/query` | companyQty, companyDocs | ✓ + export |
| 4 | `POST /dashboard/move-status/query` | byCompany, companyTotal, statusTotal | ✓ |
| 5 | `POST /dashboard/permits/query` | byCompany, companyTotal, typeTotal | ✓ |

**กราฟ 4 ประเภท:** `bar-vertical` · `bar-horizontal` · `pie` · `grouped-bar` — ทุกตัวคืน Unified Chart Object (ข้อ 2)

**Backend ต้องเตรียมฟิลด์ (ปัจจุบัน FE simulate):** `purchaseDoc` (เมนู1/2) · `status`+เงื่อนไข expire (เมนู4) · `permitType` (เมนู5)

**สิ่งที่ Backend ไม่ต้องทำ (FE จัดการ client-side):** สีกราฟ · toggle ซ่อน/แสดง · pagination/sort/column-search ของตาราง · การคำนวณ % และ "ยอดรวม" หลัง toggle

---

## 7. Frontend Integration (พร้อมใช้)

มี TypeScript layer ให้ FE import ใช้ได้ทันทีที่ [`src/app/api/`](../src/app/api/):

| ไฟล์ | หน้าที่ |
|---|---|
| `api/types.ts` | types ของ request/response/chart/table (ตรงกับเอกสารนี้) |
| `api/client.ts` | `api.{saleMove,moveA10,importPermit,moveStatus,permits}.query(...)` + `api.lookups.*` + `setAuthToken()` |
| `api/adapters.ts` | แปลง `ChartObject` → ข้อมูลที่ Recharts ใช้ (`toSimpleData`, `toGroupedData`, `seriesKeys`, `percent`) |
| `api/index.ts` | barrel — `import { api, toGroupedData } from "@/app/api"` |

**ตั้งค่า base URL:** ใส่ใน `.env` → `VITE_API_BASE_URL=https://host/api/v1` (ไม่ใส่ = `/api/v1`)

### ตัวอย่าง: หน้าเมนู 5 เปลี่ยนจาก local data → API
```tsx
import { api, toGroupedData, toSimpleData, seriesKeys } from "@/app/api";

const [resp, setResp] = useState<PermitsQueryResponse | null>(null);

const handleSearch = async () => {
  const data = await api.permits.query({ dateFrom: f_dateFrom, dateTo: f_dateTo, companies: f_companies });
  setResp(data);
};

// กราฟ grouped-bar (เดิม = companyStatusData)
const companyStatusData = resp ? toGroupedData(resp.charts.byCompany) : [];
const TYPE_KEYS        = resp ? seriesKeys(resp.charts.byCompany).map(s => s.id) : [];
// กราฟแท่ง/วงกลม (เดิม = companyTotalData / typePieData)
const companyTotalData = resp ? toSimpleData(resp.charts.companyTotal) : [];
const typePieData      = resp ? toSimpleData(resp.charts.typeTotal) : [];
// ตาราง
const tableData        = resp ? resp.table.rows : [];
// ยอดรวม
const groupBarTotal    = resp?.charts.byCompany.total ?? 0;
```
> รูปร่างที่ adapter คืนมา (`{ id, name, "อ.8":n, ..., total }` / `{ id, name, value }`) **ตรงกับตัวแปรเดิมในหน้าจอ** จึงเปลี่ยนเฉพาะแหล่งข้อมูล ส่วน JSX กราฟ/ตาราง/ลูกเล่น (toggle, hover, สี) เดิมใช้ต่อได้เลย

> ปัจจุบันหน้าจอยังใช้ mock จาก `loadMoveRows()` — เมื่อ Backend พร้อม สลับมาเรียก `api.*.query()` ตามตัวอย่างนี้ได้ทันที
