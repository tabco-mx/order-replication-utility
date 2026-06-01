import { Config, configRepo } from "@/lib/shared";
import { saveConfig } from "./_actions/save-config";

export const dynamic = "force-dynamic";

const FIELDS = [
  { key: "wansoft_base_url", label: "Wansoft base URL", required: true },
  {
    key: "wansoft_user_code",
    label: "Wansoft user code",
    isSecret: true,
    hint: "Leave blank to keep the current user code",
  },
  { key: "remote_api_base_url", label: "Remote API base URL", required: true },
  {
    key: "remote_api_token",
    label: "Remote API token",
    isSecret: true,
    hint: "Leave blank to keep the current token",
  },
  {
    key: "replication_interval_ms",
    label: "Replication interval (ms)",
    type: "number",
    required: true,
  },
];

export default async function ConfigPage() {
  const config = await configRepo.getOrCreateConfig();

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 h-screen pt-16 flex flex-col">
      <h1 className="text-xl font-semibold mb-4">Config</h1>
      <form
        action={saveConfig}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-xl"
      >
        {FIELDS.map((f) => {
          const value = f.isSecret ? "" : (config[f.key as keyof Config] ?? "");

          return (
            <label key={f.key} className="block mb-4">
              <span className="block text-sm font-medium text-slate-700">
                {f.label}
                {f.required ? "*" : null}
              </span>
              <input
                name={f.key}
                type={f.isSecret ? "password" : (f.type ?? "text")}
                defaultValue={value}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required={f.required}
              />
              {f.hint ? (
                <span className="text-xs text-slate-400">{f.hint}</span>
              ) : null}
            </label>
          );
        })}

        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium"
        >
          Save
        </button>
        <p className="text-xs text-slate-400 mt-2">
          Changes apply on the worker&apos;s next poll cycle — no restart
          needed.
        </p>
      </form>
    </main>
  );
}
