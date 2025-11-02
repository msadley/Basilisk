import type { Database, SqlValue } from "@basilisk/core";

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

export class sqlite implements Database {
  private db;

  private constructor(db: any) {
    this.db = db;
  }

  public static async create(dbName: string = "basilisk.db") {
    const sqlite3 = await sqlite3InitModule();

    console.debug("Creating database...");

    const db = new sqlite3.oo1.DB(dbName, "c");

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
}
