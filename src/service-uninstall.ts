// Uninstalls the order-worker Windows Service. Run from an elevated prompt:
// `npm run worker:uninstall`.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pkg from "node-windows";

const { Service } = pkg;

const here = dirname(fileURLToPath(import.meta.url)); // apps/worker/dist
const scriptPath = resolve(here, "index.js");

const name = "orderreplicationutility.exe";

const svc = new Service({
  name,
  script: scriptPath,
});

svc.on("uninstall", () => console.log(`${name} uninstalled.`));
svc.on("error", (err: unknown) => console.error("Service error:", err));

svc.uninstall();
