import type { PrivateKey } from "@libp2p/interface";
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

class Basilisk {
  private eventRouter: EventRouter;
  private eventEmitter: EventEmitter;

  private constructor(eventRouter: EventRouter, eventEmitter: EventEmitter) {
    this.eventRouter = eventRouter;
    this.eventEmitter = eventEmitter;
  }

  static async init(
    databaseDriver: AppDatabase,
    callbackFn: uiCallbackFn,
    relayAddress: string,
    privateKey: PrivateKey,
  ) {
    const nodeCore = await NodeCore.init(relayAddress, privateKey);
    const eventEmitter = new EventEmitter(callbackFn);

    const privateChatRepository = new PrivateChatRepository(databaseDriver);
    const groupChatRepository = new GroupChatRepository(databaseDriver);
    const messageRepository = new MessageRepository(databaseDriver);
    const profileRepository = new ProfileRepository(databaseDriver);
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
