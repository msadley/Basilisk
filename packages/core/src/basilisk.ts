// packages/core/src/basilisk.ts

import Database from "better-sqlite3";
import * as db from "./database.js";
import type { Chat, Message, MessagePacket, Profile } from "./types.js";

export interface BasiliskConfig {
  /**
   * Path to the SQLite database file.
   * @default ":memory:"
   */
  dbPath?: string;
  /**
   * The user's profile. If provided and no profile exists in the database,
   * this profile will be created as the primary user.
   */
  profile?: Profile;
}

export class Basilisk {
  private db: Database.Database;

  constructor(config: BasiliskConfig = {}) {
    const { dbPath = ":memory:", profile } = config;
    this.db = new Database(dbPath);
    console.log(`INFO: Database initialized at ${dbPath}`);

    // Provide the database instance to the internal database module
    db.setDb(this.db);

    // Initialize schema and potentially create the first profile
    this.init(profile);
  }

  /**
   * Initializes the database schema and runs any necessary migrations.
   * This must be called before using other Basilisk methods.
   */
  private init(profile?: Profile) {
    console.log("INFO: Initializing Basilisk...");
    db.createSchema();

    // If a profile is provided and none exist, create it.
    if (profile && !db.getMyProfile()) {
      db.upsertProfile(profile);
      console.log(`INFO: Created initial profile for ${profile.name}`);
    }

    console.log("INFO: Basilisk initialization complete.");
  }

  public saveMessage(message: MessagePacket): Promise<void> {
    return db.saveMessage(message);
  }

  public getMessages(peerId: string, limit: number, offset: number): Message[] {
    return db.getMessages(peerId, limit, offset);
  }

  public getChats(): Chat[] {
    return db.getChats();
  }

  public getMyProfile(): Profile | undefined {
    return db.getMyProfile();
  }

  public getId(): string {
    return db.getId();
  }
}
