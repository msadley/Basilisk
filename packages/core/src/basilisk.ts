// packages/core/src/basilisk.ts

import { Node, chatEvents } from "./node.js";
import {
  setDb,
  createSchema,
  getMyProfile,
  databaseEvents,
  saveMessage,
  getMessages,
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

    databaseEvents.on("message:register", async (message: Message) => {
      this.uiCallBack({
        type: "message-registered",
        payload: { message },
      });
    });

    databaseEvents.on("profile:update", async (profile: Profile) => {
      this.uiCallBack({
        type: "profile-updated",
        payload: { profile },
      });
    });

    databaseEvents.on("chat:start", async (chat: Chat) => {
      this.uiCallBack({
        type: "chat-started",
        payload: { chat },
      });
    });
  }

  public static async init(
    database: Database,
    uiCallback: SendToUiCallback,
    bootstrapNodes: string[]
  ) {
    console.log("INFO: Initializing Basilisk...");
    const node = await Node.init({ mode: "CLIENT", bootstrapNodes });
    return new Basilisk(node, database, uiCallback);
  }

  public async startNode() {
    await this.node.start();
    this.uiCallBack({
      type: "node-started",
      payload: { peerId: this.node.getPeerId() },
    });
  }

  public async handleUiCommand(event: UIEvent) {
    switch (event.type) {
      case "send-message":
        await this.sendMessage(event.payload.toPeerId, event.payload.text);
        break;

      case "get-profile":
        await this.getProfile(event.payload.peerId);
        break;

      case "get-messages":
        await this.getMessages(event.payload.peerId, event.payload.page);
        break;

      default:
        break;
    }
  }

  private async sendMessage(peerId: string, content: string) {
    const from = await getMyProfile();
    const message: MessagePacket = {
      from: from,
      to: peerId,
      content: content,
      timestamp: Date.now(),
    };
    await this.node.sendMessage(message);
  }

  private async getMessages(peerId: string, page: number): Promise<Message[]> {
    return await getMessages(peerId, page);
  }

  private async getProfile(peerId: string): Promise<Profile> {
    return await this.node.getPeerProfile(peerId);
  }
}
