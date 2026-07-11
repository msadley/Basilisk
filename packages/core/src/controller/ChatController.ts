import type PrivateChatService from "../service/PrivateChatService.js";
import type { UIPayload } from "../types.js";

class ChatController {
  private privateChatService: PrivateChatService;

  constructor(privateChatService: PrivateChatService) {
    this.privateChatService = privateChatService;
  }

  // TODO: Later implement pagination
  async list() {
    return this.privateChatService.list();
  }

  async createPrivateChat(payload: UIPayload<"create-private-chat">) {
    return this.privateChatService.createPrivateChat(payload.peerId);
  }
}

export default ChatController;
