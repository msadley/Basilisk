import ChatService from "../service/ChatService.js";
import MessageService from "../service/MessageService.js";
import NodeService from "../service/NodeService.js";
import PrivateChatService from "../service/PrivateChatService.js";
import ProfileService from "../service/ProfileService.js";
import type { UIEvent } from "../types.js";
import { inject, singleton } from "tsyringe";

@singleton()
class EventRouter {
  constructor(
    @inject(ChatService) private chatService: ChatService,
    @inject(PrivateChatService) private privateChatService: PrivateChatService,
    @inject(MessageService) private messageService: MessageService,
    @inject(ProfileService) private profileService: ProfileService,
    @inject(NodeService) private nodeService: NodeService,
  ) {}

  async route(event: UIEvent) {
    switch (event.type) {
      case "list-messages":
        return await this.messageService.list(
          event.payload.chatId,
          event.payload.limit,
          event.payload.page,
        );

      case "send-message":
        return this.messageService.send(
          event.payload.chatId,
          event.payload.content,
        );

      case "get-profile":
        return await this.profileService.getById(event.payload.peerId);

      case "get-user-profile":
        return await this.profileService.getUserProfile();

      case "update-profile":
        return this.profileService.update(
          event.payload.avatar,
          event.payload.name,
        );

      case "list-chats":
        return await this.chatService.list();

      case "create-private-chat":
        return await this.privateChatService.createPrivateChat(
          event.payload.peerId,
        );

      case "ping-relay":
        return await this.nodeService.pingRelay();

      default:
        throw new Error(`Unknown event type received`);
    }
  }
}

export default EventRouter;
