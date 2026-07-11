import type { GroupChat } from "../model/GroupChat.js";
import type { PrivateChat } from "../model/PrivateChat.js";
import GroupChatService from "./GroupChatService.js";
import PrivateChatService from "./PrivateChatService.js";

class ChatService {
  private groupChatService: GroupChatService;
  private privateChatService: PrivateChatService;

  constructor(
    groupChatService: GroupChatService,
    privateChatService: PrivateChatService,
  ) {
    this.groupChatService = groupChatService;
    this.privateChatService = privateChatService;
  }

  async getById(chatId: string): Promise<GroupChat | PrivateChat | undefined> {
    const groupChat = await this.groupChatService.getById(chatId);

    if (groupChat) {
      return groupChat;
    }

    const privateChat = await this.privateChatService.getById(chatId);
    return privateChat;
  }
  async list() {
    const groupChats = await this.groupChatService.list();
    const privateChats = await this.privateChatService.list();
    return [...groupChats, ...privateChats];
  }
}

export default ChatService;
