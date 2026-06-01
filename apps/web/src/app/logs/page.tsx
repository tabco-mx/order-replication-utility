import Link from "next/link";
import { logsRepo } from "@/lib/data";
import { Badge, fmtTime } from "../components/ui";

export const dynamic = "force-dynamic";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const sp = await searchParams;
  const pageSize = Math.min(Math.max(Number(sp.pageSize) || 100, 1), 500);
  const page = Math.max(Number(sp.page) || 1, 1);
  const offset = (page - 1) * pageSize;

  const { listLogs, countLogs } = logsRepo;

  const rows = await listLogs({ limit: pageSize, offset });
  const total = await countLogs();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 h-screen pt-16 flex flex-col">
      <h1 className="text-xl font-semibold mb-4">
        Logs <span className="text-sm text-slate-500">({total} total)</span>
      </h1>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-400 px-3 py-4">No logs.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                    {fmtTime(r.ts)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge value={r.level} />
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {r.order_number ?? ""}
                  </td>
                  <td className="px-3 py-2">{r.status ?? ""}</td>
                  <td className="px-3 py-2">
                    {r.message}
                    {r.error ? (
                      <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap">
                        {r.error}
                      </pre>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 text-sm">
        {page > 1 ? (
          <Link
            className="px-3 py-1 bg-white border rounded"
            href={`/logs?page=${page - 1}&pageSize=${pageSize}`}
          >
            ← Newer
          </Link>
        ) : null}
        <span className="text-slate-500">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            className="px-3 py-1 bg-white border rounded"
            href={`/logs?page=${page + 1}&pageSize=${pageSize}`}
          >
            Older →
          </Link>
        ) : null}
      </div>
    </main>
  );
}
