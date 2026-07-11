import { randomUUID } from "crypto";
import EventEmitter from "../event/EventEmitter.js";
import type KnownPeersRepository from "../repository/KnownPeersRepository.js";
import type MessageService from "../service/MessageService.js";
import type ProfileService from "../service/ProfileService.js";
import { forwardSchemaValidatedStream } from "../utils.js";
import type NodeCore from "./NodeCore.js";
import { messagePacketSchema } from "../model/MessagePacket.js";

class NodeOrchestrator {
  private messageService: MessageService;
  private profileService: ProfileService;
  private nodeCore: NodeCore;
  private eventEmitter: EventEmitter;
  private knownPeersStore: KnownPeersRepository;

  constructor(
    messageService: MessageService,
    profileService: ProfileService,
    nodeCore: NodeCore,
    eventEmitter: EventEmitter,
    knownPeersStore: KnownPeersRepository,
  ) {
    this.messageService = messageService;
    this.profileService = profileService;
    this.nodeCore = nodeCore;
    this.eventEmitter = eventEmitter;
    this.knownPeersStore = knownPeersStore;
  }

  registerHandlers() {
    this.nodeCore.registerProtocolHandler("/chat/1.0.0", async (event) => {
      const savedMessage = await forwardSchemaValidatedStream(
        event,
        messagePacketSchema,
        this.messageService.handleMessageReceived,
      );
      this.eventEmitter.emit(randomUUID(), "message-received", {
        message: savedMessage,
      });
    });

    this.nodeCore.registerProtocolHandler("/info/1.0.0", (event) =>
      this.profileService.sendUserProfile(event.stream),
    );

    this.nodeCore.registerEventHandler("peer:connect", (event) => {
      const peerId = event.detail.toString();
      if (this.knownPeersStore.isKnown(peerId))
        this.eventEmitter.emit(randomUUID(), "peer-found", { peerId });
    });

    this.nodeCore.registerEventHandler("peer:disconnect", (event) => {
      const peerId = event.detail.toString();
      if (this.knownPeersStore.isKnown(peerId))
        this.eventEmitter.emit(randomUUID(), "peer-lost", { peerId });
    });
  }
}

export default NodeOrchestrator;
