import type { Database, SqlValue } from "@basilisk/core";

// --- Imports changed from 'sql.js' to '@sqlite.org/sqlite-wasm' ---
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
// ---

export class dbAdapter implements Database {
  // The db type is now the 'DB' (OO1) interface from the official package
  private db;

  private constructor(db: any) {
    this.db = db;
  }

  public static async create(dbName: string = "basilisk.db") {
    // Initialize the sqlite3 WASM module
    const sqlite3 = await sqlite3InitModule();

    console.log("Creating database...");

    // Use the Object-Oriented API (OO1)
    // This will create a persistent database named 'basilisk.db'
    // using the default VFS (likely IndexedDB).
    // To use an in-memory database (like sql.js), pass ":memory:"
    const db = new sqlite3.oo1.DB(dbName, "c"); // 'c' = create if not exists

    return new dbAdapter(db);
  }

  async run(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<number> {
    // The OO1 API methods are synchronous.
    // The 'async' wrapper on this method handles the Promise.
    console.log("Executing SQL:", sql);
    this.db.exec(sql, { bind: params });

    // Return the number of rows modified
    return this.db.changes();
  }

  async get<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T | undefined> {
    // 'selectObject' is the direct equivalent for 'get'
    const row = this.db.selectObject(sql, params) as T | undefined;
    return row;
  }

  async all<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T[]> {
    // 'selectObjects' is the direct equivalent for 'all'
    const rows = this.db.selectObjects(sql, params) as T[];
    return rows;
  }
}
