import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  databaseSchema,
  initializeDatabase,
  type AppDatabase,
} from "../src/index.js";

function toSqlParams(params: unknown[]): SQLInputValue[] {
  return params.map((param) => {
    if (
      param === null ||
      typeof param === "number" ||
      typeof param === "bigint" ||
      typeof param === "string" ||
      param instanceof Uint8Array
    ) {
      return param;
    }
    if (typeof param === "boolean") {
      return param ? 1 : 0;
    }
    if (ArrayBuffer.isView(param)) {
      return new Uint8Array(param.buffer, param.byteOffset, param.byteLength);
    }
    if (param instanceof ArrayBuffer) {
      return new Uint8Array(param);
    }
    throw new TypeError(`Unsupported SQL parameter type: ${typeof param}`);
  });
}

function executeQuery(
  sqlite: DatabaseSync,
  sqlText: string,
  params: unknown[],
  method: "run" | "all" | "values" | "get",
): { rows: any } {
  const trimmed = sqlText.trim();
  const normalizedMethod =
    method === "run" && /\bRETURNING\b/i.test(trimmed) ? "all" : method;

  if (params.length === 0 && normalizedMethod === "run") {
    sqlite.exec(sqlText);
    return { rows: [] };
  }

  const stmt = sqlite.prepare(sqlText);
  const sqlParams = toSqlParams(params);

  if (normalizedMethod === "run") {
    stmt.run(...sqlParams);
    return { rows: [] };
  }

  stmt.setReturnArrays(true);

  if (normalizedMethod === "get") {
    const row = stmt.get(...sqlParams);
    return { rows: row === undefined ? undefined : (row as unknown[]) };
  }

  const rows = stmt.all(...sqlParams) as unknown as unknown[][];
  return { rows };
}

export async function createInMemoryTestDatabase(): Promise<{
  db: AppDatabase;
  sqlite: DatabaseSync;
}> {
  const sqlite = new DatabaseSync(":memory:");

  const driver = async (
    sqlText: string,
    params: any[],
    method: "run" | "all" | "values" | "get",
  ) => {
    return executeQuery(sqlite, sqlText, params, method);
  };

  const batchDriver = async (
    queries: {
      sql: string;
      params: any[];
      method: "run" | "all" | "values" | "get";
    }[],
  ) => {
    sqlite.exec("BEGIN");
    try {
      const results = queries.map((q) =>
        executeQuery(sqlite, q.sql, q.params, q.method),
      );
      sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  };

  const db = drizzle(driver, batchDriver, {
    schema: databaseSchema,
  });

  await initializeDatabase(db);
  return { db, sqlite };
}
