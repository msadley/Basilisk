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
      await saveMessage(message);
    });

    databaseEvents.on("chat:create", async (chat: Chat) => {
      this.uiCallBack({
        type: "chat-created",
        payload: { chat },
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
    this.uiCallBack({
      type: "node-started",
      payload: { profile: await getMyProfile() },
    });
  }

  public async handleUiCommand(event: UIEvent) {
    switch (event.type) {
      case "send-message": {
        await this.sendMessage(event.payload.chatId, event.payload.content);
        break;
      }

      case "get-profile-self": {
        const profile = await getMyProfile();
        this.uiCallBack({
          type: "profile-retrieved-self",
          payload: { profile },
        });
        break;
      }

      case "patch-profile-self": {
        await setMyProfile(event.payload.name, event.payload.avatar);
        this.uiCallBack({
          type: "profile-updated-self",
          payload: { profile: await getMyProfile() },
        });
        break;
      }

      case "get-profile": {
        const profile = await this.getProfile(event.payload.peerId);
        this.uiCallBack({
          type: "profile-retrieved",
          payload: { profile },
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
        });
        break;
      }

      case "get-chats": {
        this.uiCallBack({
          type: "chats-retrieved",
          payload: { chats: await getChats() },
        });
        break;
      }

      case "create-chat": {
        await this.createChat(event.payload.chat);
        this.uiCallBack({
          type: "chat-created",
          payload: { chat: event.payload.chat },
        });
        break;
      }

      default: {
        break;
      }
    }
  }

  private async sendMessage(chatId: string, content: string) {
    const from = await getId();
    const message: MessagePacket = {
      from,
      chatId,
      content,
      timestamp: Date.now(),
    };
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
    if (chat.type === "group") await this.node.subscribe(chat.id);
  }
}
