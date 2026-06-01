import {
  type ReplicationRow,
  configRepo,
  replicationsRepo,
  logsRepo,
  workerStateRepo,
} from "@/lib/data";
import { AutoRefresh } from "./components/AutoRefresh";
import { Badge, Card, fmtTime } from "./components/ui";

// Always render fresh from the DB; never cache.
export const dynamic = "force-dynamic";

function ReplTable({ rows, empty }: { rows: ReplicationRow[]; empty: string }) {
  if (rows.length === 0) {
    return <div className="text-sm text-slate-400 px-3 py-4">{empty}</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-500">
          <th className="px-3 py-2">Order</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Action</th>
          <th className="px-3 py-2">Remote ID</th>
          <th className="px-3 py-2">Error</th>
          <th className="px-3 py-2">Updated</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={`${r.order_number}-${r.operation_date}`}
            className="border-t border-slate-100"
          >
            <td className="px-3 py-2 font-mono">{r.order_number}</td>
            <td className="px-3 py-2">
              <Badge value={r.status} />
            </td>
            <td className="px-3 py-2 text-slate-500">{r.action ?? "—"}</td>
            <td className="px-3 py-2 font-mono text-slate-500">
              {r.remote_id ?? "—"}
            </td>
            <td className="px-3 py-2 text-red-600 text-xs">{r.error ?? ""}</td>
            <td className="px-3 py-2 text-slate-400 text-xs">
              {fmtTime(r.updated_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Dashboard() {
  const { getConfig } = configRepo;
  const { listRecent, listActive, counts } = replicationsRepo;
  const { dbSizeBytes } = logsRepo;
  const { getWorkerState } = workerStateRepo;

  const worker = await getWorkerState();
  const c = await counts();
  const dbSize = await dbSizeBytes();
  const active = await listActive();
  const recent = await listRecent(20);
  const config = await getConfig();
  const intervalMs = config.REPLICATION_INTERVAL_MS;

  const fresh =
    worker.last_cycle_at !== null &&
    Date.now() - worker.last_cycle_at < intervalMs * 2;
  const dbKb = (dbSize / 1024).toFixed(1);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 h-screen pt-16 flex flex-col">
      <AutoRefresh intervalMs={2000} />
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          title="Worker"
          sub={`last cycle ${fmtTime(worker.last_cycle_at)}`}
        >
          {fresh ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              running
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              stopped / stale
            </span>
          )}
        </Card>
        <Card title="Replicated" sub="success + noop">
          {c.totalReplicated}
        </Card>
        <Card title="Failures">{c.failures}</Card>
        <Card title="DB size">{dbKb} KB</Card>
      </div>

      {worker.last_error ? (
        <div className="mb-4 text-sm text-red-700">
          Last cycle error: {worker.last_error}
        </div>
      ) : null}

      <section className="mb-6">
        <h2 className="font-semibold mb-2">
          Active replications ({active.length})
        </h2>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
          <ReplTable rows={active} empty="No active replications right now." />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Recent replications</h2>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
          <ReplTable rows={recent} empty="No completed replications yet." />
        </div>
      </section>
    </main>
  );
}
