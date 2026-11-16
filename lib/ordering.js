// Display order for portfolio lists. Each record may carry a numeric `order`
// (set by drag-and-drop in the admin panel). Collections that have dates are
// shown newest-first until they are reordered by hand.

export const DATE_FIELDS = {
  experience: "duration",
  education: "dates",
  publications: "year",
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SEASONS = { spring: 3, summer: 6, fall: 9, autumn: 9, winter: 12 };
const PRESENT = /\b(present|current|now|ongoing|today)\b/i;

/** "Oct 2025", "2023", "Summer 2024", "Present" → sortable number (or null). */
function pointValue(text) {
  if (PRESENT.test(text)) return Number.POSITIVE_INFINITY;
  const year = text.match(/\b(19|20)\d{2}\b/);
  if (!year) return null;
  const lower = text.toLowerCase();
  let month = 0;
  const monthIndex = MONTHS.findIndex((name) => new RegExp(`\\b${name}`).test(lower));
  if (monthIndex >= 0) month = monthIndex + 1;
  else {
    const season = Object.keys(SEASONS).find((name) => lower.includes(name));
    if (season) month = SEASONS[season];
  }
  return Number(year[0]) * 12 + month;
}

/** "Oct 2025 — Nov 2025", "2020 - 2022", "2023 to Present" → { start, end } or null. */
export function dateRange(text) {
  if (!text || typeof text !== "string") return null;
  const parts = text.split(/\s*(?:—|–|−|\s-\s|\bto\b|\buntil\b)\s*|(?<=\d)-(?=\d)/i).filter((part) => part && part.trim());
  const values = parts.map(pointValue).filter((value) => value !== null);
  if (!values.length) return null;
  return { start: values[0], end: values[values.length - 1] };
}

/** Newest first: by end date, then start date. Undated items go last. */
export function sortByDate(items, collection) {
  const field = DATE_FIELDS[collection];
  if (!field) return items.slice();
  return items
    .map((item, index) => ({ item, index, range: dateRange(String(item[field] ?? "")) }))
    .sort((a, b) => {
      if (!a.range || !b.range) return (a.range ? -1 : b.range ? 1 : 0) || a.index - b.index;
      return b.range.end - a.range.end || b.range.start - a.range.start || a.index - b.index;
    })
    .map(({ item }) => item);
}

const hasOrder = (item) => Number.isFinite(item?.order);

/** Saved manual order wins; otherwise dated collections are newest first. */
export function applyOrder(items, collection) {
  if (!Array.isArray(items)) return [];
  if (items.some(hasOrder)) {
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        if (hasOrder(a.item) && hasOrder(b.item)) return a.item.order - b.item.order || a.index - b.index;
        if (hasOrder(a.item)) return -1;
        if (hasOrder(b.item)) return 1;
        return a.index - b.index;
      })
      .map(({ item }) => item);
  }
  return DATE_FIELDS[collection] ? sortByDate(items, collection) : items.slice();
}
