import { EventEmitter } from "./event/EventEmitter.js";
import { NodeCore } from "./node/NodeCore.js";
import { NodeOrchestrator } from "./node/NodeOrchestrator.js";
import { GroupChatRepository } from "./repository/GroupChatRepository.js";
import { IdentityRepository } from "./repository/IdentityRepository.js";
import { MessageRepository } from "./repository/MessageRepository.js";
import { PrivateChatCache } from "./repository/PrivateChatCache.js";
import { PrivateChatRepository } from "./repository/PrivateChatRepository.js";
import { ProfileRepository } from "./repository/ProfileRepository.js";
import { ChatService } from "./service/ChatService.js";
import { GroupChatService } from "./service/GroupChatService.js";
import { IdentityService } from "./service/IdentityService.js";
import { MessageService } from "./service/MessageService.js";
import { NodeService } from "./service/NodeService.js";
import { PrivateChatService } from "./service/PrivateChatService.js";
import { ProfileService } from "./service/ProfileService.js";
import { AppDatabase, uiCallbackFn } from "./types.js";

export * as databaseSchema from "./database/databaseSchema.js";
export type { Chat } from "./model/Chat.js";
export { groupChatSchema, type GroupChat } from "./model/GroupChat.js";
export { messageSchema, type Message } from "./model/Message.js";
export {
  messagePacketSchema,
  type MessagePacket,
} from "./model/MessagePacket.js";
export { privateChatSchema, type PrivateChat } from "./model/PrivateChat.js";
export { profileSchema, type Profile } from "./model/Profile.js";
export type {
  ResponseMap,
  SystemEvent,
  SystemEventMap,
  SystemEventSchema,
  uiCallbackFn,
  UIEvent,
  UIEventMap,
  UIEventSchema,
} from "./types.js";

export const services = async (
  db: AppDatabase,
  relayAddress: string,
  callback: uiCallbackFn,
) => {
  const messageRepository = new MessageRepository(db);
  const privateChatRepository = new PrivateChatRepository(db);
  const privateChatCache = new PrivateChatCache(privateChatRepository);
  const groupChatRepository = new GroupChatRepository(db);
  const profileRepository = new ProfileRepository(db);

  const identityRepository = new IdentityRepository(db);
  const identityService = new IdentityService(identityRepository);

  const privateKey = await identityService.getPrivateKey();
  const nodeCore = await NodeCore.init(relayAddress, privateKey);

  const groupChatService = new GroupChatService(groupChatRepository);
  const profileService = new ProfileService(profileRepository);
  const privateChatService = new PrivateChatService(
    privateChatRepository,
    profileService,
    privateChatCache,
  );
  const nodeService = new NodeService(nodeCore);
  const chatService = new ChatService(groupChatService, privateChatService);
  const messageService = new MessageService(
    messageRepository,
    chatService,
    profileService,
    nodeService,
  );

  const eventEmitter = new EventEmitter(callback);
  const nodeOrchestrator = new NodeOrchestrator(
    messageService,
    profileService,
    nodeCore,
    eventEmitter,
    privateChatCache,
  );

  nodeOrchestrator.registerHandlers();
  nodeCore.start();

  return {
    messageService,
    chatService,
    profileService,
    nodeService,
    identityService,
    eventEmitter,
  };
};
