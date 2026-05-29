// Small presentational helpers shared across pages. Pure/no DB — safe anywhere.

import type { ReactNode } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-200 text-slate-700",
  replicating: "bg-blue-200 text-blue-800",
  success: "bg-emerald-200 text-emerald-800",
  noop: "bg-amber-200 text-amber-800",
  failed: "bg-red-200 text-red-800",
  info: "bg-slate-200 text-slate-700",
  warn: "bg-amber-200 text-amber-800",
  error: "bg-red-200 text-red-800",
};

export function Badge({ value }: { value: string }) {
  const cls = STATUS_COLORS[value] ?? "bg-slate-200 text-slate-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
}

export function Card({ title, children, sub }: { title: string; children: ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{children}</div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

export function fmtTime(ts: number | null | undefined): string {
  return ts ? new Date(ts).toLocaleString() : "—";
}
