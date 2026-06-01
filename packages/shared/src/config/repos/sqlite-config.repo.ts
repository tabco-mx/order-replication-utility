import type Database from "better-sqlite3";
import type { Config } from "../types/config.type.js";
import type { ConfigRepo } from "../types/config-repo.type.js";

export function createSqliteConfigRepo({
  db,
}: {
  db: Database.Database;
}): ConfigRepo {
  return {
    async getOrCreateConfig(data) {
      const tx = db.transaction(() => {
        const row = db
          .prepare(`SELECT * FROM config WHERE id = 1`)
          .get() as Config | null;

        if (row) {
          if (!row?.wansoft_base_url && data?.wansoft_base_url !== undefined) {
            db.prepare(
              `UPDATE config SET wansoft_base_url = ? WHERE id = 1`,
            ).run(data.wansoft_base_url);
          }
          if (
            !row?.wansoft_user_code &&
            data?.wansoft_user_code !== undefined
          ) {
            db.prepare(
              `UPDATE config SET wansoft_user_code = ? WHERE id = 1`,
            ).run(data.wansoft_user_code);
          }
          if (
            !row?.remote_api_base_url &&
            data?.remote_api_base_url !== undefined
          ) {
            db.prepare(
              `UPDATE config SET remote_api_base_url = ? WHERE id = 1`,
            ).run(data.remote_api_base_url);
          }
          if (!row?.remote_api_token && data?.remote_api_token !== undefined) {
            db.prepare(
              `UPDATE config SET remote_api_token = ? WHERE id = 1`,
            ).run(data.remote_api_token);
          }
          if (
            !row?.replication_interval_ms &&
            data?.replication_interval_ms !== undefined
          ) {
            db.prepare(
              `UPDATE config SET replication_interval_ms = ? WHERE id = 1`,
            ).run(data.replication_interval_ms);
          }
          return db
            .prepare(`SELECT * FROM config WHERE id = 1`)
            .get() as Config;
        }

        db.prepare(
          `INSERT INTO config (id, wansoft_base_url, wansoft_user_code, remote_api_base_url, remote_api_token, replication_interval_ms)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(
          1,
          data?.wansoft_base_url ?? null,
          data?.wansoft_user_code ?? null,
          data?.remote_api_base_url ?? null,
          data?.remote_api_token ?? null,
          data?.replication_interval_ms ?? null,
        );

        return db.prepare(`SELECT * FROM config WHERE id = 1`).get() as Config;
      });

      return tx();
    },
    async updateConfig(data) {
      const fields = Object.entries(data).filter(([_, v]) => v !== undefined);
      db.prepare(
        `UPDATE config SET ${fields.map(([k, _v]) => `${k} = ?`).join(", ")} WHERE id = 1`,
      ).run(...fields.map(([_, v]) => v));
    },
  };
}
