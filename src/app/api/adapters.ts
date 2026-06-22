// ─────────────────────────────────────────────────────────────────────────
// Adapters — แปลง Unified ChartObject → รูปแบบที่ Recharts/หน้าจอใช้อยู่
// ทำให้ FE เอา response มาวางใน <BarChart>/<PieChart> ได้เลย ไม่ต้อง map เอง
// ─────────────────────────────────────────────────────────────────────────
import type { ChartObject } from "./types";

/** จุดข้อมูลกราฟ single-series (bar-vertical / bar-horizontal / pie)
 *  → ใช้กับ chartData / docPieData / buyerPieData / companyPieData / statusPieData / typePieData */
export interface SimplePoint { id: string; name: string; label: string; value: number; }

/** แถวกราฟ grouped-bar → ตรงกับ companyStatusData ของ Page4/Page5
 *  เช่น { id:"6", name:"บริษัท ...", "อ.8":270, "อ.10":269, ..., total:899 } */
export type GroupedRow = { id: string; name: string; total: number } & Record<string, number | string>;

/** single-series → SimplePoint[] (value = series[0].values[i]) */
export function toSimpleData(c: ChartObject): SimplePoint[] {
  const s = c.series[0];
  return c.categories.map((cat, i) => ({ id: cat.id, name: cat.label, label: cat.label, value: s ? s.values[i] : 0 }));
}

/** grouped-bar → GroupedRow[] (คีย์ย่อย = series.id, ค่า = values[i]) + total ต่อแถว */
export function toGroupedData(c: ChartObject): GroupedRow[] {
  return c.categories.map((cat, i) => {
    const row: GroupedRow = { id: cat.id, name: cat.label, total: 0 };
    let total = 0;
    for (const s of c.series) { const v = s.values[i] ?? 0; row[s.id] = v; total += v; }
    row.total = total;
    return row;
  });
}

/** meta ของ series (ไว้ render <Bar dataKey> ของ grouped-bar / legend) */
export function seriesKeys(c: ChartObject): { id: string; label: string }[] {
  return c.series.map((s) => ({ id: s.id, label: s.label }));
}

/** สูตร % ของชิ้นวงกลม (FE ใช้กับ legend/center text) */
export function percent(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
}
