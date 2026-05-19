import Link from "next/link";
import { fmtCount } from "@/lib/format";

const accents: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50/80 hover:border-blue-400",
  emerald: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-400",
  amber: "border-amber-200 bg-amber-50/80 hover:border-amber-400",
  indigo: "border-indigo-200 bg-indigo-50/80 hover:border-indigo-400",
  violet: "border-violet-200 bg-violet-50/80 hover:border-violet-400",
  rose: "border-rose-200 bg-rose-50/80 hover:border-rose-400",
  slate: "border-slate-200 bg-slate-50/80 hover:border-slate-400",
  cyan: "border-cyan-200 bg-cyan-50/80 hover:border-cyan-400",
};

export type DepartmentTileProps = {
  id?: string;
  title: string;
  count: number;
  subtitle: string;
  href: string;
  accent?: string;
};

export function DepartmentTile({ title, count, subtitle, href, accent = "slate" }: DepartmentTileProps) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border-2 p-5 shadow-sm transition hover:shadow-md ${accents[accent] ?? accents.slate}`}
    >
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-4xl font-bold text-gray-900 mt-2 tabular-nums">{fmtCount(count)}</p>
      <p className="text-xs text-gray-600 mt-3 leading-relaxed">{subtitle}</p>
      <p className="text-xs font-medium text-gray-800 mt-4">Open →</p>
    </Link>
  );
}

