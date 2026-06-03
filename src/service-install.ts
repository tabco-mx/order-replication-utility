// Registers the worker as a Windows Service via node-windows. Run once from an elevated
// prompt: `npm run worker:install`. node-windows handles start-on-boot + restart-on-exit.

import * as env from "./env.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pkg from "node-windows";

const { Service } = pkg;

const here = dirname(fileURLToPath(import.meta.url)); // apps/worker/dist
const scriptPath = resolve(here, "index.js");

const name = "order-replication-utility";

const svc = new Service({
  name,
  description: "Replicates Wansoft orders to the remote API.",
  script: scriptPath,
  env: [
    {
      name: "REPLICATION_INTERVAL_MS",
      value: env.REPLICATION_INTERVAL_MS.toString(),
    },
    { name: "WANSOFT_BASE_URL", value: env.WANSOFT_BASE_URL },
    { name: "WANSOFT_USER_CODE", value: env.WANSOFT_USER_CODE },
    { name: "REMOTE_API_BASE_URL", value: env.REMOTE_API_BASE_URL },
    { name: "REMOTE_API_TOKEN", value: env.REMOTE_API_TOKEN },
    { name: "LOG_LEVEL", value: env.LOG_LEVEL },
    { name: "NODE_ENV", value: "production" },
  ],
});

svc.on("install", () => {
  console.log(`Installing ${name}...`);
  svc.start();
});
svc.on("alreadyinstalled", () => console.log(`${name} is already installed.`));
svc.on("start", () => console.log(`${name} started.`));
svc.on("error", (err: unknown) => console.error("Service error:", err));

svc.install();
