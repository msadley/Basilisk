import type { Database, SqlValue } from "@basilisk/core";
import initSqlJs, { type Database as SQLDatabase } from "sql.js";

export class dbAdapter implements Database {
  private db: SQLDatabase;

  private constructor(db: SQLDatabase) {
    this.db = db;
  }

  public static async create() {
    const SQL = await initSqlJs({
      locateFile: (_) => "/sql-wasm.wasm",
    });
    const db = new SQL.Database();
    return new dbAdapter(db);
  }

  async run(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<number> {
    this.db.run(sql, params);
    return this.db.getRowsModified();
  }

  async get<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T | undefined> {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const hasRow = stmt.step();
    if (!hasRow) {
      stmt.free();
      return undefined;
    }
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }

  async all<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T[]> {
    const results: T[] = [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }
}
