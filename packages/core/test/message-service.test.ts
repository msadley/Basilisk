import type { Connection, Stream } from "@libp2p/interface";
import { describe, expect, it, vi } from "vitest";
import { messageSchema } from "../src/index.js";
import { uint8ArrayToBase64 } from "../src/node/stream.js";
import { GroupChatRepository } from "../src/repository/GroupChatRepository.js";
import { MessageRepository } from "../src/repository/MessageRepository.js";
import { PrivateChatCache } from "../src/repository/PrivateChatCache.js";
import { PrivateChatRepository } from "../src/repository/PrivateChatRepository.js";
import { ProfileRepository } from "../src/repository/ProfileRepository.js";
import { ChatService } from "../src/service/ChatService.js";
import { GroupChatService } from "../src/service/GroupChatService.js";
import { MessageService } from "../src/service/MessageService.js";
import type { NodeService } from "../src/service/NodeService.js";
import { PrivateChatService } from "../src/service/PrivateChatService.js";
import { ProfileService } from "../src/service/ProfileService.js";
import { MockLibp2pStream } from "./mockStream.js";
import { createInMemoryTestDatabase } from "./testDb.js";

function createStreamWithPayload(payload: unknown): Stream {
  const stream = new MockLibp2pStream();
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  queueMicrotask(() => {
    stream.emitChunk(encoded);
    stream.emitRemoteCloseWrite();
  });
  return stream as unknown as Stream;
}

function createMockConnection(remotePeerId: string): Connection {
  return {
    remotePeer: {
      toString: () => remotePeerId,
    },
  } as unknown as Connection;
}

async function setupMessageServiceTestContext() {
  const { db } = await createInMemoryTestDatabase();
  const localUserId = "12D3KooWLocalUserPeer";

  const profileRepo = new ProfileRepository(db);
  await profileRepo.createIfNotExists({
    id: localUserId,
    name: "Local User",
    avatar: null,
  });

  const privateChatRepo = new PrivateChatRepository(db);
  const privateChatCache = new PrivateChatCache(privateChatRepo);
  await privateChatCache.init();

  const groupChatRepo = new GroupChatRepository(db);
  const messageRepo = new MessageRepository(db);

  const stubNodeService = {} as unknown as NodeService;
  const profileService = new ProfileService(
    profileRepo,
    stubNodeService,
    localUserId,
  );
  const groupChatService = new GroupChatService(groupChatRepo, profileService);
  const privateChatService = new PrivateChatService(
    privateChatRepo,
    profileService,
    privateChatCache,
  );
  const chatService = new ChatService(groupChatService, privateChatService);
  const messageService = new MessageService(
    messageRepo,
    chatService,
    profileService,
    stubNodeService,
  );

  return {
    db,
    localUserId,
    messageService,
    chatService,
    messageRepo,
    privateChatRepo,
    privateChatCache,
    profileRepo,
  };
}

describe("MessageService.handleMessageReceived validation and concurrency", () => {
  it("rejects incoming messages when connection.remotePeer does not match messagePacket.senderId", async () => {
    const { messageService } = await setupMessageServiceTestContext();

    const spoofedPacket = {
      senderId: "12D3KooWSpoofedSender",
      chatId: "12D3KooWLocalUserPeer",
      timestamp: new Date().toISOString(),
      contentType: "text",
      content: "Spoofed message",
    };

    const stream = createStreamWithPayload(spoofedPacket);
    const connection = createMockConnection("12D3KooWActualRemotePeer");

    await expect(
      messageService.handleMessageReceived(stream, connection),
    ).rejects.toThrow("Sender ID does not match remote peer ID");
  });

  it("decodes base64 binary 'image' and 'file' payloads and re-keys chatId to senderId", async () => {
    const { messageService, messageRepo, localUserId } =
      await setupMessageServiceTestContext();
    const remotePeerId = "12D3KooWRemoteSender1";
    const connection = createMockConnection(remotePeerId);

    const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const imageStream = createStreamWithPayload({
      senderId: remotePeerId,
      // On the wire, the remote sender sets chatId to the recipient's peerId
      chatId: localUserId,
      timestamp: new Date(1_710_000_000_000).toISOString(),
      contentType: "image",
      content: uint8ArrayToBase64(imageBytes),
    });

    const savedImageMsg = await messageService.handleMessageReceived(
      imageStream,
      connection,
    );
    expect(messageSchema.assert(savedImageMsg)).toMatchObject({
      chatId: remotePeerId,
      senderId: remotePeerId,
      contentType: "image",
      content: imageBytes,
      received: true,
    });

    const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const fileStream = createStreamWithPayload({
      senderId: remotePeerId,
      chatId: localUserId,
      timestamp: new Date(1_710_000_001_000).toISOString(),
      contentType: "file",
      content: uint8ArrayToBase64(fileBytes),
    });

    const savedFileMsg = await messageService.handleMessageReceived(
      fileStream,
      connection,
    );
    expect(messageSchema.assert(savedFileMsg)).toMatchObject({
      chatId: remotePeerId,
      senderId: remotePeerId,
      contentType: "file",
      content: fileBytes,
      received: true,
    });

    const stored = await messageRepo.list(remotePeerId);
    expect(stored).toHaveLength(2);
  });

  it("deduplicates concurrent createPrivateChat calls when two first messages arrive simultaneously from an unknown peer", async () => {
    const {
      messageService,
      chatService,
      messageRepo,
      privateChatCache,
      localUserId,
    } = await setupMessageServiceTestContext();

    const unknownPeerId = "12D3KooWConcurrentSender";
    const connection = createMockConnection(unknownPeerId);

    const createPrivateChatSpy = vi.spyOn(chatService, "createPrivateChat");

    const stream1 = createStreamWithPayload({
      senderId: unknownPeerId,
      chatId: localUserId,
      timestamp: new Date(1_720_000_000_000).toISOString(),
      contentType: "text",
      content: "Concurrent message 1",
    });

    const stream2 = createStreamWithPayload({
      senderId: unknownPeerId,
      chatId: localUserId,
      timestamp: new Date(1_720_000_000_100).toISOString(),
      contentType: "text",
      content: "Concurrent message 2",
    });

    const [saved1, saved2] = await Promise.all([
      messageService.handleMessageReceived(stream1, connection),
      messageService.handleMessageReceived(stream2, connection),
    ]);

    expect(createPrivateChatSpy).toHaveBeenCalledTimes(1);
    expect(privateChatCache.contains(unknownPeerId)).toBe(true);
    expect(saved1.chatId).toBe(unknownPeerId);
    expect(saved2.chatId).toBe(unknownPeerId);

    const storedMessages = await messageRepo.list(unknownPeerId);
    expect(storedMessages).toHaveLength(2);
    expect(storedMessages.map((m) => m.content).sort()).toEqual([
      "Concurrent message 1",
      "Concurrent message 2",
    ]);
  });
});
