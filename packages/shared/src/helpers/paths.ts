// Resolves filesystem paths relative to the repo root, independent of which app
// (worker or ui) is running. The repo root is two levels up from packages/shared/dist.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)); // packages/shared/dist/helpers
export const repoRoot = resolve(here, "..", "..", "..", "..");
export const dataDir = resolve(repoRoot, "data");
export const dbPath = process.env.APP_DB_PATH ?? resolve(dataDir, "app.db");
