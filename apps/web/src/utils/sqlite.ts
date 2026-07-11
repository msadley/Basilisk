import type { Database as DatabaseAdapter, SqlValue } from "@basilisk/core";
import type { Database } from "@sqlite.org/sqlite-wasm";

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

export class sqlite implements DatabaseAdapter {
  private database: Database;

  private constructor(database: Database) {
    this.database = database;
  }

  public static async create(filename: string = "basilisk.db") {
    const sqlite3 = await sqlite3InitModule();

    let db: Database;

    try {
      await sqlite3.installOpfsSAHPoolVfs({ name: "opfs-sahpool" });
      db = new sqlite3.oo1.DB(`file:${filename}?vfs=opfs-sahpool`, "cw");
    } catch (e) {
      try {
        db = new sqlite3.oo1.DB(`file:${filename}?vfs=unix-dotfile`, "cw");
      } catch (e2) {
        try {
          db = new sqlite3.oo1.DB(`:${filename}:`, "c");
        } catch (e3) {
          db = new sqlite3.oo1.DB(":memory:", "c");
        }
      }
    }

    return new sqlite(db);
  }

  async run(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>,
  ): Promise<number> {
    this.database.exec(sql, { bind: params });

    return this.database.changes();
  }

  async get<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>,
  ): Promise<T | undefined> {
    const row = this.database.selectObject(sql, params) as T | undefined;
    return row;
  }

  async all<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>,
  ): Promise<T[]> {
    const rows = this.database.selectObjects(sql, params) as T[];
    return rows;
  }

  async close(): Promise<void> {
    this.database.close();
  }

  async wipe(tables: string[]) {
    tables.forEach((table: string) => {
      this.run(`DROP TABLE IF EXISTS ${table};`);
    });

    this.run("VACUUM;");
  }
}
