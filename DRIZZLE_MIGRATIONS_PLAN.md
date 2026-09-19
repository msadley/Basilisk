# Drizzle migration plan: test, relay, web

This file describes how migrations should work once they are automatic. Nothing here is implemented yet. It records the current state, the layout we want, and how day to day development and production should behave.

## Where things stand

The app schema lives in `packages/core/src/database/databaseSchema.ts`. It defines `identity`, `profiles`, `chats`, `messages` and `chat_participants`. `packages/core/src/types.ts` defines `AppDatabase` from that schema.

The relay keeps its own copy of one table in `apps/relay/src/DatabaseSchema.ts`. It defines `identity` with the same table name and columns as core. Relay already depends on `@basilisk/core` through `workspace:*` and has a TypeScript project reference to it, so it can import from core without new wiring.

Current behavior per app:

* `apps/test` has `drizzle.config.ts` and `drizzle/0000_long_felicia_hardy.sql`, but `src/index.ts` only calls `drizzle(client, { schema })` and never migrates. A fresh checkout has no tables until someone runs a manual command.
* `apps/relay` has `drizzle.config.ts` with no `drizzle/` folder. Its `start` script runs `drizzle-kit push --force` before `node dist/index.js`. Push is meant for local prototyping. It needs the CLI at runtime, it is not versioned, and it can sync destructively. The Docker `CMD ["pnpm", "start"]` therefore runs push in production. The config also hardcodes `url: "basilisk.db"` while `DatabaseAdapter.ts` reads `DATABASE_URL ?? "file:basilisk.db"`, and neither points at the compose volume `./data:/home/basilisk/.basilisk`.
* `apps/web` has no drizzle config and no migrations. `src/worker/worker.ts` builds `drizzle(driver, batchDriver, { schema: databaseSchema })` over `SQLocalDrizzle("basilisk.sqlite3")` and never runs DDL. A fresh browser profile has an empty OPFS database.

We use `drizzle-orm 0.45.2`. For Node/libsql, `drizzle-orm/libsql/migrator` exposes `migrate(db, { migrationsFolder })` and reads from the file system, which fits test and relay. For the browser, `drizzle-orm/sqlite-proxy/migrator` exposes `migrate(db, callback, config)` but reads migration files with `readMigrationFiles`, which needs `fs` and does not work inside the Vite worker. Web therefore needs its migrations bundled at build time.

## The identity table: option A

We keep one definition in core and reuse it in relay.

Relay deletes `apps/relay/src/DatabaseSchema.ts` and adds a small shim, for example `apps/relay/src/relaySchema.ts`, that re-exports only the table relay needs:

```ts
export { identity } from "@basilisk/core";
// resolved through databaseSchema.identity in packages/core/src/index.ts
```

`DatabaseAdapter.ts` changes from `drizzle(database)` to `drizzle(database, { schema: { identity } })` using that import. `IdentityManager.ts` keeps its queries unchanged and only changes the import from `"./DatabaseSchema.js"` to the shim. The table definition comes from `drizzle-orm/sqlite-core`, which is driver agnostic, so the libsql driver code stays as is. The generated `CREATE TABLE "identity"` SQL matches the old relay output, with core using explicit `"id"` and `"seed"` column names.

Relay keeps its own `drizzle.config.ts` pointed at the shim. This matters because pointing relay directly at `packages/core/src/database/databaseSchema.ts` would make `generate` emit all five app tables into `apps/relay/drizzle/`. With the shim, relay migrations contain only `identity`, while `packages/core/drizzle/` contains the full app schema for test and web. That gives two journals and two database files sharing one table definition. A change to `identity` columns is edited once in core, then generated in both `packages/core` and `apps/relay`.

Replacing relay `IdentityManager` with core `IdentityRepository` and `IdentityService` is left as a later cleanup. The table reuse does not require it.

## Target layout

```text
packages/core/
  drizzle.config.ts
  drizzle/
    0000_*.sql
    meta/_journal.json
    meta/*_snapshot.json
  src/database/
    databaseSchema.ts
    migrateNode.ts
    migrationsWeb.ts
    migrateWeb.ts

apps/test/
  src/index.ts
  src/db.ts

apps/relay/
  drizzle.config.ts
  drizzle/
  src/relaySchema.ts
  src/DatabaseAdapter.ts
  src/migrate.ts

apps/web/
  src/worker/worker.ts
  vite.config.ts
```

`apps/test/drizzle/` is removed once core owns the app migrations. `apps/test/drizzle.config.ts` is removed for the same reason unless we keep it as a pointer for studio use.

## Packages/core

Add `packages/core/drizzle.config.ts` with schema `./src/database/databaseSchema.ts`, output `./drizzle`, dialect `sqlite`. Run `drizzle-kit generate` once to create the committed baseline. Check it against the existing `apps/test/drizzle/0000_long_felicia_hardy.sql`, which should be equivalent.

Add three helpers:

* `migrateNode.ts` wraps `migrate` from `drizzle-orm/libsql/migrator` for Node consumers.
* `migrationsWeb.ts` imports `../drizzle/meta/_journal.json` and each `../drizzle/*.sql` with `?raw` and exports them ordered by tag. Explicit imports are preferred over a glob so the order is visible.
* `migrateWeb.ts` applies the bundled list through the `SQLocalDrizzle` driver and batch driver. It keeps a `__drizzle_migrations` table with `hash` and `created_at`, skips entries at or below the stored watermark, splits statements on the `-->` breakpoint marker the same way the CLI does, and records each applied hash. This mirrors the sqlite-proxy migrator without touching `fs`.

Add `db:generate`, `db:check` and `db:studio` scripts to `packages/core/package.json`.

One spike is needed before implementation: confirm how SQLocal executes raw multi statement SQL through the drizzle proxy callback, and confirm that two tabs opening at once cannot interleave the journal writes.

## Apps/test

Test consumes core migrations from the file system. At startup it creates the libsql client, builds `drizzle(client, { schema: databaseSchema })`, awaits `migrate(orm, { migrationsFolder })` resolved to `packages/core/drizzle`, then calls `services(orm, ...)`. The folder path must resolve from source and from `dist`, so it should use `import.meta.dirname` or `fileURLToPath` rather than the current working directory.

The client and the migrator must open the same file. Keep the local default `file:basilisk.db` and allow the existing env override. Extract this into `src/db.ts` if `src/index.ts` gets crowded. Add a `db:migrate` script that runs the same entrypoint used at boot.

## Apps/relay

Generate the baseline with `drizzle-kit generate` using the shim as schema, and commit `apps/relay/drizzle/`. At boot, `DatabaseAdapter.ts` (or a new `src/migrate.ts` called from `src/index.ts`) builds the client from `DATABASE_URL` with a dev fallback, creates `drizzle`, awaits `migrate(db, { migrationsFolder })` with a path that resolves under `WORKDIR /Basilisk/apps/relay` in Docker, and returns the handle. `src/index.ts` awaits this before `IdentityManager` and `BasiliskRelay.init`.

Change `package.json` `start` to `node dist/index.js` only. Move migration to code or to a `node dist/migrate.js` step so `drizzle-kit` stays a dev dependency and the image does not need the CLI. Add `db:generate` and `db:migrate` scripts. Fix `drizzle.config.ts` credentials to match runtime resolution instead of bare `"basilisk.db"`.

Docker and compose: set `DATABASE_URL` to the volume file, for example `file:/home/basilisk/.basilisk/basilisk.db`, and confirm the image copies `apps/relay/drizzle`. Decide boot order as migrate in code before libp2p start, which keeps the entrypoint as one command.

Remove `better-sqlite3` if nothing uses it after this change, since all relay database code goes through `@libsql/client`. Update `.gitignore` with `*.db`, `*.db-journal` and `*.sqlite3`, and untrack `apps/relay/basilisk.db` and `apps/test/basilisk.db`, which are local artifacts.

## Apps/web

Web consumes the same core migrations, bundled. No `drizzle.config.ts` is added in `apps/web`. In `worker.ts`, `init()` keeps `new SQLocalDrizzle("basilisk.sqlite3")`, then awaits `migrateWeb(db)` from core before `services(db, ...)`. Every call runs the journal check, so repeat loads are a no-op after the first.

The `.sql` and `_journal.json` imports must be inlined by `vite build`, since the worker can be offline. Confirm the Comlink worker bundling accepts `?raw` imports, adjusting `vite.config.ts` only if needed. Log the applied count to the console to keep this debuggable.

Existing browser profiles need one backfill rule. They may have app tables but no `__drizzle_migrations` row, and plain `CREATE TABLE` would throw on the second run. If the journal table is empty and the app tables already exist in `sqlite_master`, `migrateWeb` should insert the baseline journal row without re-running its DDL. That is the only backfill logic planned.

## Scripts

```json
// packages/core
"db:generate": "drizzle-kit generate",
"db:check": "drizzle-kit check",
"db:studio": "drizzle-kit studio"

// apps/test
"db:migrate": "node dist/db.js"

// apps/relay
"db:generate": "drizzle-kit generate --config=./drizzle.config.ts",
"db:migrate": "node dist/migrate.js"
```

Root scripts stay as they are. Web gets its migration through the core bundle, so it needs no `db:migrate`.

## Local development loop

Edit the schema in `packages/core/src/database/databaseSchema.ts`, or in the relay shim path for relay only. Run the generate command for the affected stream and read the produced SQL before committing. Start the app and let `migrate` apply it. Commit the schema file, the `drizzle/*.sql` file and the `meta/` journal update together. A schema change without its migration should fail CI.

Push remains available for throwaway experiments against a local file only. It should not point at shared or production databases.

## Production behavior

Relay in Docker: the image ships `dist/` and `drizzle/`. On container start, in code migrate runs against `DATABASE_URL` on the persisted volume before libp2p boots. A fresh volume gets the baseline. A redeploy with a new migration applies only entries above the stored watermark. Rollbacks are forward migrations, since SQLite DDL does not down migrate safely. This is policy, not tooling.

Web as a static build: migrations ship inside the JS bundle, and each browser migrates its own OPFS database on worker init. No server step is involved. Schema changes should stay compatible with data synced from older app versions, or wait until clients have updated.

Test and CI: migrate runs against a file database before `services()`, which exercises the same chain relay uses.

## Existing databases

The two `basilisk.db` files in the tree look like dev artifacts, and no production data to preserve was reported. The plan assumes delete and recreate for local databases at cutover. If a relay volume or a browser profile holds data worth keeping, the baseline stamp rule in the web section covers browsers, and relay keeps its `identity` row because the baseline `CREATE TABLE IF NOT EXISTS` path plus journal insert leaves existing rows alone.

## Verification

* Core generate output matches the semantics of the current `apps/test/drizzle/0000_long_felicia_hardy.sql`.
* Test with the database file deleted: first run creates tables and one journal row, second run changes nothing.
* Relay with the database file deleted: same check locally, then a Docker build with an empty `./data` directory boots without `drizzle-kit` at runtime.
* Web with cleared OPFS: first load migrates and boots, reload is a no-op, and a seeded old database with tables but no journal row gets stamped instead of failing.
* CI: a pull request that edits the schema without a new migration fails, and a fresh database migrates clean for each consumer.

## Build order

1. Core config, baseline generate, web bundle helpers, scripts, SQLocal spike.
2. Test runtime migrate, removal of the duplicate `drizzle/` folder.
3. Relay baseline generate, runtime migrate, removal of push from start, Docker and env fixes, gitignore cleanup.
4. Web worker wiring and baseline stamp rule.
5. CI check and a short README section describing the loop above.
