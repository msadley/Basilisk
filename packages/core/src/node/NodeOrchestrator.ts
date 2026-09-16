import { randomUUID } from "crypto";
import { EventEmitter } from "../event/EventEmitter.js";
import { MessageService } from "../service/MessageService.js";
import { ProfileService } from "../service/ProfileService.js";
import { NodeCore } from "./NodeCore.js";
import { PrivateChatCache } from "../repository/PrivateChatCache.js";

export class NodeOrchestrator {
  constructor(
    private messageService: MessageService,
    private profileService: ProfileService,
    private nodeCore: NodeCore,
    private eventEmitter: EventEmitter,
    private PrivateChatCache: PrivateChatCache,
  ) {}

  registerHandlers() {
    this.nodeCore.registerProtocolHandler(
      "/chat/1.0.0",
      async (stream, connection) => {
        const savedMessage = await this.messageService.handleMessageReceived(
          stream,
          connection,
        );
        this.eventEmitter.emit(randomUUID(), "message-received", {
          message: savedMessage,
        });
      },
    );

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
