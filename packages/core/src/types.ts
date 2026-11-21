import type { BatchItem, BatchResponse } from "drizzle-orm/batch";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./database/databaseSchema.js";
import type { PushEvent } from "./models.js";

export type { PushEvent };

export interface WorkerEventSink {
  emit(event: PushEvent): void;
}

export type AppDatabase = BaseSQLiteDatabase<"async", any, typeof schema> & {
  batch<U extends BatchItem<"sqlite">, T extends Readonly<[U, ...U[]]>>(
    batch: T,
  ): Promise<BatchResponse<T>>;
};
