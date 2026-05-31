import { getConfig, CONFIG_KEYS, type ConfigKey } from "@/lib/data";
import { saveConfig } from "@/lib/actions";

export const dynamic = "force-dynamic";

const FIELDS: Record<
  ConfigKey,
  { label: string; type: string; hint?: string }
> = {
  WANSOFT_BASE_URL: { label: "Wansoft base URL", type: "text" },
  WANSOFT_USER_CODE: { label: "Wansoft user code", type: "text" },
  REMOTE_API_BASE_URL: { label: "Remote API base URL", type: "text" },
  REMOTE_API_TOKEN: {
    label: "Remote API token",
    type: "password",
    hint: "Leave blank to keep the current token",
  },
  REPLICATION_INTERVAL_MS: {
    label: "Replication interval (ms)",
    type: "number",
    hint: "Default 30000",
  },
};

export default function ConfigPage() {
  const raw = getConfig();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Config</h1>
      <form
        action={saveConfig}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-xl"
      >
        {CONFIG_KEYS.map((key) => {
          const f = FIELDS[key];
          // Never render the stored token; the field stays blank unless a new value is typed.
          const value = key === "REMOTE_API_TOKEN" ? "" : raw[key];
          return (
            <label key={key} className="block mb-4">
              <span className="block text-sm font-medium text-slate-700">
                {f.label}
              </span>
              <input
                name={key}
                type={f.type}
                defaultValue={value}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
    </div>
  );
}
