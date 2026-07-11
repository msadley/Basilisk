import type ChatService from "../service/ChatService.js";
import type MessageService from "../service/MessageService.js";
import type NodeService from "../service/NodeService.js";
import type PrivateChatService from "../service/PrivateChatService.js";
import type ProfileService from "../service/ProfileService.js";
import type { UIEvent } from "../types.js";

class EventRouter {
  private chatService: ChatService;
  private messageService: MessageService;
  private profileService: ProfileService;
  private nodeService: NodeService;
  private privateChatService: PrivateChatService;

  constructor(
    chatService: ChatService,
    privateChatService: PrivateChatService,
    messageService: MessageService,
    profileService: ProfileService,
    nodeService: NodeService,
  ) {
    this.chatService = chatService;
    this.messageService = messageService;
    this.profileService = profileService;
    this.nodeService = nodeService;
    this.privateChatService = privateChatService;
  }

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
