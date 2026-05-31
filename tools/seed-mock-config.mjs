// Point the app config at the local mock servers (tools/mock-server.mjs) with a fast
// 3s interval, so you can watch the dashboard update without the real systems.
//
//   node tools/seed-mock-config.mjs
//
// Writes into the same DB the apps use (data/app.db, or APP_DB_PATH if set).

import { setConfig, getConfig } from "@app/shared";

setConfig({
  WANSOFT_BASE_URL: `http://localhost:${process.env.WANSOFT_PORT || 8080}`,
  WANSOFT_USER_CODE: "005",
  REMOTE_API_BASE_URL: `http://localhost:${process.env.REMOTE_PORT || 8888}`,
  REMOTE_API_TOKEN: "mock-token",
  REPLICATION_INTERVAL_MS: "3000",
});

console.log("Mock config written:");
console.log(getConfig());
