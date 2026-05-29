// Registers the worker as a Windows Service via node-windows. Run once from an elevated
// prompt: `npm run worker:install`. node-windows handles start-on-boot + restart-on-exit.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pkg from "node-windows";

const { Service } = pkg;

const here = dirname(fileURLToPath(import.meta.url)); // apps/worker/dist
const scriptPath = resolve(here, "index.js");

const svc = new Service({
  name: "order-worker",
  description: "Replicates Wansoft orders to the remote API.",
  script: scriptPath,
  env: [{ name: "NODE_ENV", value: "production" }],
});

svc.on("install", () => {
  console.log("order-worker installed. Starting…");
  svc.start();
});
svc.on("alreadyinstalled", () => console.log("order-worker is already installed."));
svc.on("start", () => console.log("order-worker started."));
svc.on("error", (err: unknown) => console.error("Service error:", err));

svc.install();
