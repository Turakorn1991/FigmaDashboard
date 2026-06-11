Create a professional Thai government web dashboard application for tracking 
military ammunition and explosives transportation permits.

=== SYSTEM INFO ===
System name: "ระบบจัดการข้อมูลโรงงานผลิตอาวุธของเอกชน สำหรับเจ้าหน้าที่"
Subtitle: "Private Arms Manufacturing Factory system"
User role: Administrator
Version: 1.0.0

=== GLOBAL LAYOUT ===
Shell: Full-height flex layout — Sidebar (200px fixed left) + Main (flex-grow)

SIDEBAR:
- Background: #1a1a2e (dark navy)
- Top: Shield logo icon + system name (white, bold 11px) + subtitle (gray 9px)
- Menu section label: "ระบบรายงาน" (uppercase gray, 9px)
- Menu item "รายงาน" with expand arrow, sub-items: รายงาน#1 through รายงาน#5
- Active sub-item: left border 3px #7C3AED, background rgba(124,58,237,0.18), text #a78bfa
- Inactive items: text rgba(255,255,255,0.65), hover background rgba(255,255,255,0.06)

TOP NAVBAR:
- Background: #1a1a2e, height 52px
- Left: system full name (white 12px bold) + subtitle (gray 10px)
- Right: 🔔 bell icon with red badge "99+", "Administrator ▾" text, "Version 1.0.0"

CONTENT AREA:
- Background: #F4F6FB
- Padding: 18px 22px
- Top: breadcrumb (gray 11px) → page title (bold 20px #111827) + purple action button (right)
- Action button style: background #7C3AED, white text, border-radius 8px, height 36px

=== REPEATING PAGE STRUCTURE (all 5 pages) ===

BLOCK 1 — FILTER CARD
- White card, border-radius 10px, border 1px #E5E7EB, padding 14px 16px
- Title: "ค้นหาข้อมูล" bold 12px
- Row 1: Three date range pickers side by side
  Each picker: label (uppercase gray 10px) + two date inputs with "→" arrow between
  Input style: height 34px, border 1px #E5E7EB, border-radius 7px, background #F9FAFB
- Row 2: Dropdown "ค้นหาโดย" + Search input with 🔍 icon inside (left padding 30px) + 
  Status dropdown + Category dropdown + Reset button + Purple search icon button
- Reset button: white background, border 1px #E5E7EB, border-radius 8px
- Search icon button: background #7C3AED, white 🔍, border-radius 8px, 34×34px

BLOCK 2 — KPI CARDS ROW
- Grid of 4–5 cards, white background, border-radius 10px, border 1px #E5E7EB
- Each card: label (gray 10px bold) + large number (20–22px bold, colored) + sub-text (gray 10px)
- Card accent colors: purple #7C3AED / blue #2563EB / green #16A34A / orange #EA580C / red #DC2626

BLOCK 3 — CHARTS ROW  
- Two chart cards side by side (or 3 for some pages), white background, border-radius 10px
- Each chart card header: chart title (bold 12px left) + export buttons right
  Export buttons: height 26px, border 1px #E5E7EB, border-radius 6px, gray text 10px
  Export options: "🖼 PNG" and "📄 PDF"
- Chart area: dashed border placeholder, background #F9FAFB, border-radius 8px, height 150–160px
  Show chart type label centered (e.g., "Bar Chart", "Pie Chart", "Line Chart")

BLOCK 4 — DATA TABLE CARD
- White card, border-radius 10px, overflow hidden
- Table header row: title bold 12px (left) + export buttons (right)
  Three export buttons: "📥 Export ดิบ (Excel)" / "📊 Export สรุป (Excel)" / "📄 Export PDF"
- Table: full width, thead background #FAFAFA
  th: uppercase gray 10px bold, with sort icon ⇅ (light gray)
  td: 12px, color #374151, padding 8px 10px
  Row hover: background #F9FAFB
  Alternating border-bottom: 1px solid #F9FAFB
- Monospace IDs: font-family monospace, font-size 11px (for reference numbers)

STATUS BADGES (pill style):
- อนุมัติ: background #DCFCE7, color #16A34A
- สร้างคำขอ: background #EDE9FE, color #7C3AED  
- ค้นคว้า / ยื่นคำขอ: background #FFEDD5, color #EA580C
- รอดำเนินการ / รอบังคับเกณฑ์: background #DBEAFE, color #2563EB
- กำลังดำเนินการ: background #FEF9C3, color #CA8A04
- ยกเลิก / ปฏิเสธ: background #FEE2E2, color #DC2626
Badge style: inline-flex, padding 2px 9px, border-radius 20px, font-size 10px, font-weight 600

=== 5 DASHBOARD PAGES ===

PAGE 1 — "ภาพรวมการขนย้ายยุทธภัณฑ์" (Overview)
Breadcrumb: ระบบรายงาน / รายงาน#1 ภาพรวม
KPI (5 cards): กระสุนรวม (นัด) purple | วัตถุระเบิด (กก.) blue | ใบอนุญาตทั้งหมด green | บริษัท (แห่ง) orange | หน่วยงานผู้รับ red
Charts: [2/3 width] Bar+Line Chart "แนวโน้มการขนย้ายรายเดือน" + [1/3 width] Donut Chart "สัดส่วนรายบริษัท"
Table columns: # | เดือน | กระสุน (นัด) ⇅ | ระเบิด (กก.) ⇅ | ใบอนุญาต ⇅ | บริษัท | สถานะ

PAGE 2 — "ข้อมูลแยกรายบริษัท" (Company Breakdown)
Breadcrumb: ระบบรายงาน / รายงาน#2 รายบริษัท
Filter extras: dropdown "บริษัท" + dropdown "ผู้ประกอบการ"
KPI: hidden (charts replace KPI)
Charts (3 equal columns): Horizontal Bar "Top 5 บริษัทขนย้ายสูงสุด" | Pie "Market Share รายบริษัท" | Stacked Bar "สถานะใบอนุญาตแยกบริษัท"
Table columns: # | เลขที่อ้างอิง | บริษัท | กระสุน (นัด) ⇅ | ระเบิด (กก.) ⇅ | ใบอนุญาต ⇅ | % ส่วนแบ่ง (mini progress bar) | สถานะ

PAGE 3 — "ประเภทและขนาดกระสุน/วัตถุระเบิด" (Ammunition & Explosives)
Breadcrumb: ระบบรายงาน / รายงาน#3 ประเภทกระสุน
Filter extras: dropdown "ขนาดกระสุน" (9มม./5.56มม./.45/.50) + dropdown "ประเภทระเบิด"
KPI (4 cards): กระสุนรวม (นัด) | ดินระเบิด (กก.) | เชื้อปะทุ (ชิ้น) | ขนาดที่มีการขนย้าย
Charts (2 equal): Grouped Bar "ปริมาณกระสุนแยกตามขนาด" + Bar "วัตถุระเบิดแยกตามประเภท"
Table columns: # | เลขที่อ้างอิง | บริษัท | 9มม. | 5.56มม. | .45 | .50 | ดินระเบิด(กก.) | เชื้อปะทุ(ชิ้น) | สถานะ

PAGE 4 — "ปลายทางหน่วยงานผู้รับกระสุน" (Recipients / Destinations)
Breadcrumb: ระบบรายงาน / รายงาน#4 ปลายทาง
Filter extras: dropdown "ประเภทหน่วยงาน ม.7" (ทหาร/ตำรวจ/อื่นๆ/สนามยิงปืน) + dropdown "ภูมิภาค"
KPI (4 cards): ทหาร (นัด) blue | ตำรวจ (นัด) orange | อื่นๆ ใน ม.7 purple | สนามยิงปืน green
Charts (2 equal): Stacked Bar "ส่งมอบตามประเภทหน่วยงาน ม.7 แยกบริษัท" + Bar "สนามยิงปืน ทหาร/ตำรวจ"
Table columns: # | เลขที่อ้างอิง | วันที่รับเรื่อง | หน่วยงานผู้รับ | ประเภท ม.7 (badge) | ภูมิภาค | กระสุน (นัด) | บริษัทผู้ผลิต | เลขสัญญา | สถานะ

PAGE 5 — "ติดตามใบอนุญาตขนย้ายยุทธภัณฑ์" (Permit Tracking)
Breadcrumb: ระบบรายงาน / รายงาน#5 ใบอนุญาต
Filter: replace 3rd date picker with "วันหมดอายุ" date range
KPI (4 cards): รอดำเนินการ orange | กำลังขนย้าย blue | เสร็จสิ้นแล้ว green | ใกล้หมดอายุ (30วัน) red
Charts (2 equal): Stacked Bar "สถานะใบอนุญาตแยกรายบริษัท" + Line Chart "แนวโน้มการออกใบอนุญาตรายเดือน"
Table columns: # | เลขที่อ้างอิง | เลขที่รับเรื่อง | วันที่รับเรื่อง | เลขที่คำขอ | ประเภทขอรับอนุญาต | ผู้ประกอบการ | สถานะ | เลขใบอนุญาต | จำนวนอนุญาต | วันหมดอายุ

=== DESIGN TOKENS ===
Font: Inter, Noto Sans Thai, sans-serif
Primary: #7C3AED (purple)
Dark BG: #1a1a2e
Page BG: #F4F6FB
Card BG: #FFFFFF
Border: #E5E7EB
Text primary: #111827
Text secondary: #6B7280
Card radius: 10px
Card shadow: 0 1px 4px rgba(0,0,0,0.06)