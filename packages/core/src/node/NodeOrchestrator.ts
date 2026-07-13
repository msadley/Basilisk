import { randomUUID } from "crypto";
import EventEmitter from "../event/EventEmitter.js";
import type KnownPeersRepository from "../repository/KnownPeersRepository.js";
import type MessageService from "../service/MessageService.js";
import type ProfileService from "../service/ProfileService.js";
import type NodeCore from "./NodeCore.js";

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
      if (this.knownPeersStore.isKnown(peerId))
        this.eventEmitter.emit(randomUUID(), "peer-found", { peerId });
    });

    this.nodeCore.registerEventListener("peer:disconnect", (event) => {
      const peerId = event.detail.toString();
      if (this.knownPeersStore.isKnown(peerId))
        this.eventEmitter.emit(randomUUID(), "peer-lost", { peerId });
    });
  }
}

export default NodeOrchestrator;
