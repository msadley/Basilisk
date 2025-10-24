import { Node, chatEvents } from "./node.js";
import { clearKeys } from "./keys.js";
import {
  setDb,
  createSchema,
  getMyProfile,
  databaseEvents,
  saveMessage,
  getMessages,
  setMyProfile,
  addChatToDb,
  getChatType,
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
    relayAddr: string,
    debug: boolean = false
  ) {
    if (debug) {
      await clearKeys();
    }
    console.log("INFO: Initializing Basilisk...");
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
      case "send-message":
        await this.sendMessage(event.payload.toPeerId, event.payload.text);
        break;

      case "get-self-profile":
        const profile = await getMyProfile();
        this.uiCallBack({
          type: "self-profile-sent",
          payload: { profile },
        });
        break;

      case "set-profile":
        await setMyProfile(
          event.payload.id,
          event.payload.name,
          event.payload.avatar
        );
        break;

      case "get-profile":
        const peerProfile = await this.getProfile(event.payload.peerId);
        this.uiCallBack({
          type: "profile-updated",
          payload: { profile: peerProfile },
        });
        break;

      case "get-messages":
        const messages = await this.getMessages(
          event.payload.peerId,
          event.payload.page
        );
        this.uiCallBack({
          type: "messages-retrieved",
          payload: { messages },
        });
        break;

      case "create-chat":
        const chat = await this.createChat(event.payload.id);
        this.uiCallBack({
          type: "chat-created",
          payload: { chat },
        });
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

  private async createChat(id: string): Promise<Chat> {
    const type = getChatType(id);
    if (type === "private") {
      const profile = await this.getProfile(id);
      const chat = {
        id: id,
        name: profile.name,
        avatar: profile.avatar,
        type: type,
      };
      await addChatToDb(chat);
      return chat;
    } else {
      console.log("Group chat not implemented yet...");
      return {
        id: id,
        name: "Group Chat",
        avatar: "",
        type: "group",
      };
    }
  }
}
