import type ChatController from "../controller/ChatController.js";
import type MessageController from "../controller/MessageController.js";
import type NodeController from "../controller/NodeController.js";
import type ProfileController from "../controller/ProfileController.js";
import type { UIEvent } from "../types.js";

class EventRouter {
  private chatController: ChatController;
  private messageController: MessageController;
  private profileController: ProfileController;
  private nodeController: NodeController;

  constructor(
    chatController: ChatController,
    messageController: MessageController,
    profileController: ProfileController,
    nodeController: NodeController,
  ) {
    this.chatController = chatController;
    this.messageController = messageController;
    this.profileController = profileController;
    this.nodeController = nodeController;
  }

  async route(event: UIEvent) {
    switch (event.type) {
      case "list-messages":
        return await this.messageController.list(event.payload);

      case "send-message":
        return this.messageController.send(event.payload);

      case "get-profile":
        return await this.profileController.getById(event.payload);

      case "get-user-profile":
        return await this.profileController.getUserProfile();

      case "update-profile":
        return this.profileController.update(event.payload);

      case "list-chats":
        return await this.chatController.list();

      case "create-private-chat":
        return await this.chatController.createPrivateChat(event.payload);

      case "ping-relay":
        return await this.nodeController.pingRelay();

      default:
        break;
    }
  }
}

export default EventRouter;
