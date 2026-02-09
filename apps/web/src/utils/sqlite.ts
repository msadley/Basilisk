import type { Database as DatabaseAdapter, SqlValue } from "@basilisk/core";
import type { Database } from "@sqlite.org/sqlite-wasm";

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

export class sqlite implements DatabaseAdapter {
  private db: Database;

  private constructor(db: any) {
    this.db = db;
  }

  public static async create(dbName: string = "basilisk.db") {
    const sqlite3 = await sqlite3InitModule();

    console.debug("[database] Initializing database...");

    let db: Database;
    let storageType = "unknown";

    try {
      console.debug("[database] Trying OPFS SAH...");
      await sqlite3.installOpfsSAHPoolVfs({ name: "opfs-sahpool" });
      db = new sqlite3.oo1.DB(`file:${dbName}?vfs=opfs-sahpool`, "cw");
      storageType = "[database] OPFS SAH (SharedArrayBuffer)";
    } catch (e) {
      console.debug("[database] OPFS SAH not available:", e);

      try {
        console.debug("[database] Trying default OPFS...");
        db = new sqlite3.oo1.DB(`file:${dbName}?vfs=unix-dotfile`, "cw");
        storageType = "[database] OPFS (unix-dotfile)";
      } catch (e2) {
        console.debug("[database] unix-dotfile failed, trying IndexedDB...");

        try {
          db = new sqlite3.oo1.DB(`:${dbName}:`, "c");
          storageType = "[database] IndexedDB (kvvfs)";
        } catch (e3) {
          console.error("[database] All storage methods failed:", e3);
          db = new sqlite3.oo1.DB(":memory:", "c");
          storageType = "[database] Memory (volatile)";
          console.warn(
            "[database] ⚠️ Using in-memory database - data will NOT persist!"
          );
        }
      }
    }

    console.debug("[database] Database initialized");
    console.debug("[database] Storage type:", storageType);
    console.debug("[database] Database path:", db.filename);

    return new sqlite(db);
  }

  async run(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<number> {
    this.db.exec(sql, { bind: params });

    return this.db.changes();
  }

  async get<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T | undefined> {
    const row = this.db.selectObject(sql, params) as T | undefined;
    return row;
  }

  async all<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T[]> {
    const rows = this.db.selectObjects(sql, params) as T[];
    return rows;
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
