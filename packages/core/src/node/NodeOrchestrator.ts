import { PrivateChatCache } from "../repository/PrivateChatCache.js";
import { MessageService } from "../service/MessageService.js";
import { ProfileService } from "../service/ProfileService.js";
import { WorkerEventSink } from "../types.js";
import { NodeCore } from "./NodeCore.js";

export class NodeOrchestrator {
  constructor(
    private messageService: MessageService,
    private profileService: ProfileService,
    private nodeCore: NodeCore,
    private privateChatCache: PrivateChatCache,
    private sink: WorkerEventSink,
  ) {}

  registerHandlers() {
    this.nodeCore.registerProtocolHandler(
      "/chat/1.0.0",
      async (stream, connection) => {
        const savedMessage = await this.messageService.handleMessageReceived(
          stream,
          connection,
        );
        this.sink.emit({
          type: "message-received",
          payload: {
            message: savedMessage,
          },
        });
      },
    );

    this.nodeCore.registerProtocolHandler("/info/1.0.0", (stream) =>
      this.profileService.sendUserProfile(stream),
    );

    this.nodeCore.registerEventListener("peer:connect", (event) => {
      const peerId = event.detail.toString();
      if (this.privateChatCache.contains(peerId))
        this.sink.emit({
          type: "peer-found",
          payload: { peerId },
        });
    });

    this.nodeCore.registerEventListener("peer:disconnect", (event) => {
      const peerId = event.detail.toString();
      if (this.privateChatCache.contains(peerId))
        this.sink.emit({
          type: "peer-lost",
          payload: { peerId },
        });
    });
  }
}
