import { randomUUID } from "crypto";
import EventEmitter from "../event/EventEmitter.js";
import MessageService from "../service/MessageService.js";
import ProfileService from "../service/ProfileService.js";
import NodeCore from "./NodeCore.js";
import { container, inject, singleton } from "tsyringe";
import PrivateChatCache from "../repository/PrivateChatCache.js";

@singleton()
class NodeOrchestrator {
  constructor(
    @inject(MessageService) private messageService: MessageService,
    @inject(ProfileService) private profileService: ProfileService,
    @inject("NodeCore") private nodeCore: NodeCore,
    @inject(EventEmitter) private eventEmitter: EventEmitter,
    @inject(PrivateChatCache) private PrivateChatCache: PrivateChatCache,
  ) {}

  registerHandlers() {
    this.nodeCore.registerProtocolHandler("/chat/1.0.0", async (stream) => {
      const savedMessage =
        await this.messageService.handleMessageReceived(stream);
      this.eventEmitter.emit(randomUUID(), "message-received", {
        message: savedMessage,
      });
    });

    this.nodeCore.registerProtocolHandler("/info/1.0.0", (stream) =>
      this.profileService.sendUserProfile(stream),
    );

    this.nodeCore.registerEventListener("peer:connect", (event) => {
      const peerId = event.detail.toString();
      if (this.PrivateChatCache.contains(peerId))
        this.eventEmitter.emit(randomUUID(), "peer-found", { peerId });
    });

    this.nodeCore.registerEventListener("peer:disconnect", (event) => {
      const peerId = event.detail.toString();
      if (this.PrivateChatCache.contains(peerId))
        this.eventEmitter.emit(randomUUID(), "peer-lost", { peerId });
    });
  }
}

container.afterResolution(
  NodeOrchestrator,
  (_, instance) => {
    (Array.isArray(instance) ? instance[0] : instance).registerHandlers();
  },
  { frequency: "Once" },
);

export default NodeOrchestrator;
