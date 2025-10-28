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
  /** The sender's profile. */
  from: Profile;
  /** The recipient's peer ID or the group ID. */
  to: string;
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
  /** The ID of the sender's profile. */
  from: string;
  /** The Id of the chat the message was sent. */
  chat: string;
}

/**
 * Represents a chat session, which can be either private or group.
 */
export interface Chat {
  /** The unique identifier for the chat. */
  id?: string;
  /** The name of the chat. */
  name?: string;
  /** A URL or data URI for the chat's avatar. */
  avatar?: string;
  /** The type of chat. */
  type: "private" | "group";
}

/** Represents a one-to-one private chat. */
export interface PrivateChat extends Chat {
  type: "private";
}

/** Represents a group chat with multiple members. */
export interface GroupChat extends Chat {
  type: "group";
  /** A list of profiles of the group members. */
  members: Profile[];
}

/**
 * Represents an event or command originating from the UI to the core logic.
 */
export type UIEvent =
  | {
      type: "get-messages";
      payload: { peerId: string; page: number };
    }
  | { type: "send-message"; payload: { toPeerId: string; text: string } }
  | { type: "get-profile"; payload: { peerId: string } }
  | { type: "get-self-profile" }
  | { type: "create-chat"; payload: { id: string } }
  | {
      type: "set-profile";
      payload: { id: string; name?: string; avatar?: string };
    };

/**
 * Represents an event sent from the core logic to the UI.
 */
export type SystemEvent =
  | { type: "node-started"; payload: { profile: Profile } }
  | { type: "chat-started"; payload: { chat: Chat } }
  | { type: "chat-created"; payload: { chat: Chat } }
  | { type: "profile-updated"; payload: { profile: Profile } }
  | { type: "self-profile-sent"; payload: { profile: Profile } }
  | { type: "message-registered"; payload: { message: Message } }
  | { type: "messages-retrieved"; payload: { messages: Message[] } };

/**
 * Defines the signature for the callback function that sends events to the UI.
 */
export type SendToUiCallback = (event: SystemEvent) => void;
