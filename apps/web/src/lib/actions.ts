"use server";

// Server Actions for all mutations. Each writes to SQLite via @app/shared, then revalidates
// the affected page. No REST API, no client-side fetching.

import { revalidatePath } from "next/cache";
import {
  setConfig,
  requestRestart,
  clearLogs as clearLogsDb,
  clearReplications,
  clearAll,
  CONFIG_KEYS,
  type ConfigKey,
} from "@app/shared";

export async function saveConfig(formData: FormData): Promise<void> {
  const partial: Partial<Record<ConfigKey, string>> = {};
  for (const key of CONFIG_KEYS) {
    const value = formData.get(key);
    if (typeof value !== "string") continue;
    // The token field is blank in the form unless the admin types a new one; don't
    // overwrite the stored token with an empty string.
    if (key === "REMOTE_API_TOKEN" && value.trim() === "") continue;
    partial[key] = value;
  }
  setConfig(partial);
  revalidatePath("/config");
}

export async function clearLogs(): Promise<void> {
  clearLogsDb();
  revalidatePath("/logs");
  revalidatePath("/maintenance");
}

export async function clearHistory(): Promise<void> {
  clearReplications();
  revalidatePath("/");
  revalidatePath("/maintenance");
}

export async function clearDatabase(): Promise<void> {
  clearAll();
  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/maintenance");
}

export async function restartWorker(): Promise<void> {
  requestRestart();
  revalidatePath("/maintenance");
}
