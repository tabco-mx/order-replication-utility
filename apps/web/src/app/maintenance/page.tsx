// import { logsRepo } from "@/lib/data";
// import {
//   clearLogs,
//   clearHistory,
//   clearDatabase,
//   restartWorker,
// } from "@/lib/actions";
//
// export const dynamic = "force-dynamic";
//
// function ActionButton({
//   action,
//   label,
//   danger = false,
// }: {
//   action: () => Promise<void>;
//   label: string;
//   danger?: boolean;
// }) {
//   return (
//     <form action={action} className="inline-block mr-2 mb-2">
//       <button
//         type="submit"
//         className={`px-4 py-2 ${danger ? "bg-red-600" : "bg-slate-900"} text-white rounded-md text-sm font-medium`}
//       >
//         {label}
//       </button>
//     </form>
//   );
// }
//
// export default async function MaintenancePage() {
//   const { dbSizeBytes } = logsRepo;
//   const dbSize = await dbSizeBytes();
//   const dbKb = (dbSize / 1024).toFixed(1);
//
//   return (
//     <main className="max-w-6xl mx-auto px-4 py-6 h-screen pt-16 flex flex-col">
//       <h1 className="text-xl font-semibold mb-4">Maintenance</h1>
//       <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-xl">
//         <p className="text-sm text-slate-500 mb-4">
//           Current DB size: <strong>{dbKb} KB</strong>
//         </p>
//         <ActionButton action={clearLogs} label="Clear logs" />
//         <ActionButton action={clearHistory} label="Clear replication history" />
//         <ActionButton action={clearDatabase} label="Clear all data" danger />
//         <hr className="my-4 border-slate-200" />
//         <ActionButton action={restartWorker} label="Restart worker" />
//         <p className="text-xs text-slate-400 mt-2">
//           Restart requests the worker to exit; the Windows Service restarts it
//           within one interval.
//         </p>
//       </div>
//     </main>
//   );
// }

export default function Page() {
  return null;
}
