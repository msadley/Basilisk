import type MessageService from "../service/MessageService.js";
import type { UIPayload } from "../types.js";

class MessageController {
  private messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  async list(payload: UIPayload<"list-messages">) {
    const messages = await this.messageService.list(
      payload.chatId,
      payload.limit,
      payload.page,
    );
    return { messages };
  }

  send(payload: UIPayload<"send-message">) {
    this.messageService.send(payload.chatId, payload.content);
  }
}
export default MessageController;
