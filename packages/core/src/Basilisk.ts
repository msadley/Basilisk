import MessageRepository from "./repository/MessageRepository.js";
import ProfileRepository from "./repository/ProfileRepository.js";
import ChatService from "./service/ChatService.js";
import MessageService from "./service/MessageService.js";
import ProfileService from "./service/ProfileService.js";
import { setupDatabaseAdapter } from "./database/databaseAdapter.js";
import { responseMap, type uiCallbackFn, type UIEvent } from "./types.js";
import EventRouter from "./event/EventRouter.js";
import EventEmitter from "./event/EventEmitter.js";
import NodeService from "./service/NodeService.js";
import NodeCore from "./node/NodeCore.js";
import KnownPeersRepository from "./repository/KnownPeersRepository.js";
import NodeOrchestrator from "./node/NodeOrchestrator.js";
import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import type { PrivateKey } from "@libp2p/interface";
import GroupChatRepository from "./repository/GroupChatRepository.js";
import PrivateChatRepository from "./repository/PrivateChatRepository.js";
import GroupChatService from "./service/GroupChatService.js";
import PrivateChatService from "./service/PrivateChatService.js";

class Basilisk {
  private eventRouter: EventRouter;
  private eventEmitter: EventEmitter;

  private constructor(eventRouter: EventRouter, eventEmitter: EventEmitter) {
    this.eventRouter = eventRouter;
    this.eventEmitter = eventEmitter;
  }

  static async init(
    databaseDriver: AsyncRemoteCallback,
    callbackFn: uiCallbackFn,
    relayAddress: string,
    privateKey: PrivateKey,
  ) {
    const databaseAdapter = setupDatabaseAdapter(databaseDriver);
    const nodeCore = await NodeCore.init(relayAddress, privateKey);
    const eventEmitter = new EventEmitter(callbackFn);

    const privateChatRepository = new PrivateChatRepository(databaseAdapter);
    const groupChatRepository = new GroupChatRepository(databaseAdapter);
    const messageRepository = new MessageRepository(databaseAdapter);
    const profileRepository = new ProfileRepository(databaseAdapter);
    const knownPeers: string[] = (await privateChatRepository.list()).map(
      (chat) => {
        return chat.id;
      },
    );
    const knownPeersRepository = new KnownPeersRepository(knownPeers);

    const profileService = new ProfileService(profileRepository);
    const nodeService = new NodeService(knownPeersRepository, nodeCore);
    const privateChatService = new PrivateChatService(
      privateChatRepository,
      profileService,
      nodeService,
    );
    const groupChatService = new GroupChatService(groupChatRepository);
    const chatService = new ChatService(groupChatService, privateChatService);
    const messageService = new MessageService(
      messageRepository,
      chatService,
      profileService,
      nodeService,
    );

    const eventRouter = new EventRouter(
      chatService,
      privateChatService,
      messageService,
      profileService,
      nodeService,
    );

    const nodeOrchestrator = new NodeOrchestrator(
      messageService,
      profileService,
      nodeCore,
      eventEmitter,
      knownPeersRepository,
    );

    // Initialize the user profile
    await profileRepository.save({
      id: "user",
      name: "",
      avatar: null,
    });

    nodeOrchestrator.registerHandlers();
    nodeCore.start();

    return new Basilisk(eventRouter, eventEmitter);
  }

  async handleEvent(event: UIEvent) {
    const result = await this.eventRouter.route(event);
    const responseType = responseMap[event.type];
    if (responseType) {
      this.eventEmitter.emit(event.id, responseType, result);
    }
    return result;
  }
}

export default Basilisk;
