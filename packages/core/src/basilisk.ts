import { Node, nodeEvents } from "./node.js";
import {
  setDb,
  createSchema,
  getMyProfile,
  databaseEvents,
  saveMessage,
  getMessages,
  setMyProfile,
  upsertChat,
  getChats,
  getDb,
} from "./database.js";
import type {
  Chat,
  Message,
  Profile,
  SendToUiCallback,
  UIEvent,
  Database,
  MessagePacket,
} from "./types.js";
import { v7 as uuidv7 } from "uuid";

export class Basilisk {
  private node: Node;
  private uiCallBack: SendToUiCallback;

  private constructor(
    nodeInstance: Node,
    database: Database,
    uiCallBack: SendToUiCallback
  ) {
    this.node = nodeInstance;
    this.uiCallBack = uiCallBack;
    setDb(database);
    createSchema();

    nodeEvents.on("message:receive", async (message: MessagePacket) => {
      await saveMessage(message);
      this.uiCallBack({
        type: "message-received",
        payload: {
          message,
        },
        id: uuidv7(),
      });
    });

    nodeEvents.on("relay:connect", () => {
      this.uiCallBack({
        type: "relay-found",
        id: uuidv7(),
      });
    });

    nodeEvents.on("relay:disconnect", () => {
      this.uiCallBack({
        type: "relay-lost",
        id: uuidv7(),
      });
    });

    databaseEvents.on("chat:spawn", async (chat: Chat) => {
      this.uiCallBack({
        type: "chat-spawned",
        payload: { chat },
        id: uuidv7(),
      });
    });
  }

  public static async init(
    database: Database,
    uiCallback: SendToUiCallback,
    relayAddr: string
  ) {
    const node = await Node.init({ mode: "CLIENT", relayAddr });
    return new Basilisk(node, database, uiCallback);
  }

  public async startNode() {
    await this.node.start();
    await setMyProfile(this.node.getPeerId());

    (await getChats())
      .filter((chat) => chat.type === "group")
      .map((chat) => chat.id)
      .forEach((chatId) => this.node.subscribe(chatId));

    this.uiCallBack({
      type: "node-started",
      payload: { profile: await getMyProfile() },
      id: uuidv7(),
    });
  }

  public async handleUiCommand(event: UIEvent) {
    switch (event.type) {
      case "ping-relay": {
        try {
          const latency = await this.node.pingRelay();
          this.uiCallBack({
            type: "pong-relay",
            payload: { latency },
            id: event.id,
          });
        } catch (e: any) {
          this.uiCallBack({
            type: "pong-relay",
            id: event.id,
            error: e.toString(),
          });
        }
        break;
      }

      case "send-message": {
        try {
          await this.sendMessage(event.payload.message);
          this.uiCallBack({
            type: "message-sent",
            id: event.id,
          });
        } catch (e: any) {
          this.uiCallBack({
            type: "message-sent",
            id: event.id,
            error: e.toString(),
          });
        }
        break;
      }

      case "get-profile-user": {
        const profile = await getMyProfile();
        this.uiCallBack({
          type: "profile-retrieved-user",
          payload: { profile },
          id: event.id,
        });
        break;
      }

      case "patch-profile-self": {
        await setMyProfile(
          this.node.getPeerId(),
          event.payload.name,
          event.payload.avatar
        );
        this.uiCallBack({
          type: "profile-updated-self",
          payload: { profile: await getMyProfile() },
          id: event.id,
        });
        break;
      }

      case "get-profile": {
        try {
          const profile = await this.getProfile(event.payload.peerId);
          this.uiCallBack({
            type: "profile-retrieved",
            payload: { profile },
            id: event.id,
          });
        } catch (e: any) {
          this.uiCallBack({
            type: "profile-retrieved",
            id: event.id,
            error: e.toString(),
          });
        }
        break;
      }

      case "get-messages": {
        const messages = await this.getMessages(
          event.payload.chatId,
          event.payload.page
        );
        this.uiCallBack({
          type: "messages-retrieved",
          payload: { messages },
          id: event.id,
        });
        break;
      }

      case "get-chats": {
        this.uiCallBack({
          type: "chats-retrieved",
          payload: { chats: await getChats() },
          id: event.id,
        });
        break;
      }

      case "create-chat": {
        await this.createChat(event.payload.chat);
        this.uiCallBack({
          type: "chat-created",
          payload: { chat: event.payload.chat },
          id: event.id,
        });
        break;
      }

      case "close-database": {
        await getDb().close();
        this.uiCallBack({
          type: "database-closed",
          id: uuidv7(),
        });
        break;
      }

      default: {
        break;
      }
    }
  }

  private async sendMessage(message: MessagePacket): Promise<void> {
    await this.node.sendMessage(message);
    await saveMessage(message);
  }

  private async getMessages(peerId: string, page: number): Promise<Message[]> {
    return await getMessages(peerId, page);
  }

  private async getProfile(peerId: string): Promise<Profile> {
    return await this.node.getPeerProfile(peerId);
  }

  private async createChat(chat: Chat): Promise<void> {
    await upsertChat(chat);
    if (chat.type === "group") this.node.subscribe(chat.id);
  }
}
