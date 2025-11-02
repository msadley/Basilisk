import { Node, chatEvents } from "./node.js";
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
  getId,
  getDb,
} from "./database.js";
import type {
  Chat,
  Message,
  Profile,
  SendToUiCallback,
  UIEvent,
} from "./types.js";
import { type Database, type MessagePacket } from "./types.js";

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

    chatEvents.on("message:receive", async (message: MessagePacket) => {
      const id = await saveMessage(message);
      this.uiCallBack({
        type: "message-received",
        payload: {
          message: {
            id,
            ...message,
          },
        },
        id: crypto.randomUUID(),
      });
    });

    databaseEvents.on("chat:spawn", async (chat: Chat) => {
      this.uiCallBack({
        type: "chat-spawned",
        payload: { chat },
        id: crypto.randomUUID(), // XXX placeholder
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
      id: crypto.randomUUID(), // XXX placeholder
    });
  }

  public async handleUiCommand(event: UIEvent) {
    switch (event.type) {
      case "send-message": {
        const msgId = await this.sendMessage(
          event.payload.chatId,
          event.payload.content
        );
        this.uiCallBack({
          type: "message-sent",
          payload: { msgId },
          id: event.id,
        });
        break;
      }

      case "get-profile-self": {
        const profile = await getMyProfile();
        this.uiCallBack({
          type: "profile-retrieved-self",
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
        const profile = await this.getProfile(event.payload.peerId);
        this.uiCallBack({
          type: "profile-retrieved",
          payload: { profile },
          id: event.id,
        });
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
          id: crypto.randomUUID(),
        });
        break;
      }

      default: {
        break;
      }
    }
  }

  private async sendMessage(chatId: string, content: string): Promise<number> {
    const from = await getId();
    const message: MessagePacket = {
      from,
      chatId,
      content,
      timestamp: Date.now(),
    };
    await this.node.sendMessage(message);
    return await saveMessage(message);
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
