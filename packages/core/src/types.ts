/**
 * Represents the possible value types for SQL parameters.
 * Can be a string, number, null, or a byte array.
 */
export type SqlValue = string | number | null | Uint8Array | undefined;

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Defines the interface for database operations.
 * This acts as an abstraction layer, allowing different database implementations
 * to be used with the core logic (e.g., `wa-sqlite` on the web, `better-sqlite3` in Node).
 */
export interface Database {
  /**
   * Executes an SQL statement that does not return any rows.
   * @param sql The SQL query to execute.
   * @param params The parameters to bind to the query.
   * @returns A promise that resolves with the number of changed rows.
   */
  run(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<number>;
  /**
   * Executes an SQL statement and returns the first row.
   * @param sql The SQL query to execute.
   * @param params The parameters to bind to the query.
   * @returns A promise that resolves with the first row found, or `undefined` if no rows are found.
   */
  get<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T | undefined>;
  /**
   * Executes an SQL statement and returns all resulting rows.
   * @param sql The SQL query to execute.
   * @param params The parameters to bind to the query.
   * @returns A promise that resolves with an array of all found rows.
   */
  all<T>(
    sql: string,
    params?: SqlValue[] | Record<string, SqlValue>
  ): Promise<T[]>;
}

export interface NodeConfig {
  mode: "CLIENT" | "RELAY";
  relayAddr?: string;
  publicDns?: string;
}

/**
 * Represents a user profile.
 */
export interface Profile {
  /** The unique identifier for the profile, typically a peer ID. */
  id: string;
  /** The user's display name. Optional. */
  name?: string;
  /** A URL or data URI for the user's avatar. Optional. */
  avatar?: string;
}

/**
 * Represents a message packet as it is transmitted over the network.
 * It contains the full profile of the sender.
 */
export interface MessagePacket {
  /** The content of the message. */
  content: string;
  /** The timestamp of when the message was sent, in milliseconds since the epoch. */
  timestamp: number;
  /** The sender's peer ID. */
  from: string;
  /** The recipient's peer ID or the group ID. */
  chatId: string;
}

/**
 * Represents a message as it is stored in the local database.
 * To save space, it stores only the sender's ID instead of the full profile.
 */
export interface Message {
  /** The unique identifier for the message in the database. */
  id: number;
  /** The content of the message. */
  content: string;
  /** The timestamp of when the message was sent, in milliseconds since the epoch. */
  timestamp: number;
  /** The sender's peer ID. */
  from: string;
  /** The Id of the chat the message was sent. */
  chatId: string;
}

/**
 * Represents a chat session, which can be either private or group.
 */
export interface Chat {
  /** The unique identifier for the chat. */
  id: string;
  /** The name of the chat. */
  name?: string;
  /** A URL or data URI for the chat's avatar. */
  avatar?: string;
  /** A list of profiles of the group members. */
  members?: Profile[];
  /** The type of chat. */
  type: "private" | "group";
}

type EventsFromMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends void
    ? {
        type: K;
        id: `${string}-${string}-${string}-${string}-${string}`;
        error?: string;
      }
    : {
        type: K;
        payload: T[K];
        id: `${string}-${string}-${string}-${string}-${string}`;
        error?: string;
      };
}[keyof T];

/**
 * Represents an event or command originating from the UI to the core logic.
 */
export interface UIEventMap {
  // Message events
  "get-messages": { chatId: string; page: number };
  "send-message": { chatId: string; content: string };

  // Profile events
  "get-profile": { peerId: string };
  "get-profile-self": void;
  "patch-profile-self": { name?: string; avatar?: string };

  // Chat events
  "get-chats": void;
  "create-chat": { chat: Chat };
}

export interface SystemEventMap {
  // Node events
  "node-started": { profile: Profile };

  // Chat events
  "chat-created": { chat: Chat };
  "chats-retrieved": { chats: Chat[] };

  // Profile events
  "profile-updated": { profile: Profile };
  "profile-updated-self": { profile: Profile };
  "profile-retrieved": { profile: Profile };
  "profile-retrieved-self": { profile: Profile };

  // Message events
  "message-received": { message: Message };
  "messages-retrieved": { messages: Message[] };
}

export type UIEvent = EventsFromMap<UIEventMap>;
export type SystemEvent = EventsFromMap<SystemEventMap>;

/**
 * Defines the signature for the callback function that sends events to the UI.
 */
export type SendToUiCallback = (event: SystemEvent) => void;
