// The three marquee rows in the Technical Toolkit. `row` is what is stored on
// each skill record, so existing data keeps working.
export const SKILL_ROWS = [
  { row: 1, label: "AI Skills", short: "AI" },
  { row: 2, label: "Development", short: "Dev" },
  { row: 3, label: "General", short: "General" },
];

export function skillRowLabel(row) {
  return SKILL_ROWS.find((item) => item.row === Number(row))?.label || "AI Skills";
}
