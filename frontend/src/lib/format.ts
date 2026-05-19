export function fmtRwf(value: number) {
  return `${Number(value).toLocaleString("en-RW", { maximumFractionDigits: 2 })} RWF`;
}

export function fmtCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return String(value);
}
