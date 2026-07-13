import EventEmitter from "./event/EventEmitter.js";
import EventRouter from "./event/EventRouter.js";
import NodeCore from "./node/NodeCore.js";
import NodeOrchestrator from "./node/NodeOrchestrator.js";
import GroupChatRepository from "./repository/GroupChatRepository.js";
import KnownPeersRepository from "./repository/KnownPeersRepository.js";
import MessageRepository from "./repository/MessageRepository.js";
import PrivateChatRepository from "./repository/PrivateChatRepository.js";
import ProfileRepository from "./repository/ProfileRepository.js";
import ChatService from "./service/ChatService.js";
import GroupChatService from "./service/GroupChatService.js";
import MessageService from "./service/MessageService.js";
import NodeService from "./service/NodeService.js";
import PrivateChatService from "./service/PrivateChatService.js";
import ProfileService from "./service/ProfileService.js";
import { responseMap, type uiCallbackFn, type UIEvent } from "./types.js";
import type { AppDatabase } from "./index.js";
import IdentityRepository from "./repository/IdentityRepository.js";
import IdentityService from "./service/IdentityService.js";

export class Basilisk {
  private eventRouter: EventRouter;
  private eventEmitter: EventEmitter;

  private constructor(eventRouter: EventRouter, eventEmitter: EventEmitter) {
    this.eventRouter = eventRouter;
    this.eventEmitter = eventEmitter;
  }

  static async init(
    drizzleDriver: AppDatabase,
    callbackFn: uiCallbackFn,
    relayAddress: string,
  ) {
    const identityRepository = new IdentityRepository(drizzleDriver);
    const privateChatRepository = new PrivateChatRepository(drizzleDriver);
    const groupChatRepository = new GroupChatRepository(drizzleDriver);
    const messageRepository = new MessageRepository(drizzleDriver);
    const profileRepository = new ProfileRepository(drizzleDriver);
    const knownPeers = (await privateChatRepository.list()).map(({ id }) => id);
    const knownPeersRepository = new KnownPeersRepository(knownPeers);

    const identityService = new IdentityService(identityRepository);
    const privateKey = await identityService.getPrivateKey();
    const nodeCore = await NodeCore.init(relayAddress, privateKey);

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

    const eventEmitter = new EventEmitter(callbackFn);

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
