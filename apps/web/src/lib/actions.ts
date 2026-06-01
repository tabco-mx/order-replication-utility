"use server";

// Server Actions for all mutations. Each writes to SQLite via @app/shared, then revalidates
// the affected page. No REST API, no client-side fetching.

import { revalidatePath } from "next/cache";
import {
  CONFIG_KEYS,
  ConfigKey,
  configRepo,
  logsRepo,
  replicationsRepo,
  workerStateRepo,
} from "./data";

export async function saveConfig(formData: FormData): Promise<void> {
  const { setConfig } = configRepo;

  const partial: Partial<Record<ConfigKey, string>> = {};
  for (const key of CONFIG_KEYS) {
    const value = formData.get(key);
    if (typeof value !== "string") continue;
    // The token field is blank in the form unless the admin types a new one; don't
    // overwrite the stored token with an empty string.
    if (key === "REMOTE_API_TOKEN" && value.trim() === "") continue;
    partial[key] = value;
  }
  await setConfig(partial);
  revalidatePath("/config");
}

export async function clearLogs(): Promise<void> {
  const { clearLogs } = logsRepo;

  await clearLogs();
  revalidatePath("/logs");
  revalidatePath("/maintenance");
}

export async function clearHistory(): Promise<void> {
  const { clearReplications } = replicationsRepo;

  await clearReplications();
  revalidatePath("/");
  revalidatePath("/maintenance");
}

export async function clearDatabase(): Promise<void> {
  const { clearAll } = workerStateRepo;

  await clearAll();
  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/maintenance");
}

export async function restartWorker(): Promise<void> {
  const { requestRestart } = workerStateRepo;

  await requestRestart();
  revalidatePath("/maintenance");
}
