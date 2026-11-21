import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  databaseSchema,
  groupChatSchema,
  initializeDatabase,
  messageSchema,
  privateChatSchema,
  profileSchema,
} from "../src/index.js";
import { GroupChatRepository } from "../src/repository/GroupChatRepository.js";
import { IdentityRepository } from "../src/repository/IdentityRepository.js";
import { MessageRepository } from "../src/repository/MessageRepository.js";
import { PrivateChatCache } from "../src/repository/PrivateChatCache.js";
import { PrivateChatRepository } from "../src/repository/PrivateChatRepository.js";
import { ProfileRepository } from "../src/repository/ProfileRepository.js";
import { GroupChatService } from "../src/service/GroupChatService.js";
import { PrivateChatService } from "../src/service/PrivateChatService.js";
import { ProfileService } from "../src/service/ProfileService.js";
import type { NodeService } from "../src/service/NodeService.js";
import { createInMemoryTestDatabase } from "./testDb.js";

describe("Schema, uint8ArrayBlob, and Repositories without Node Buffer", () => {
  const originalBuffer = globalThis.Buffer;

  beforeEach(() => {
    // Simulate a browser/worker environment without Node's global Buffer
    (globalThis as { Buffer?: typeof Buffer }).Buffer = undefined;
  });

  afterEach(() => {
    globalThis.Buffer = originalBuffer;
  });

  it("initializes database idempotently, enables PRAGMA foreign_keys, and enforces ON DELETE CASCADE", async () => {
    const { db, sqlite } = await createInMemoryTestDatabase();
    // Run initializeDatabase a second time to verify idempotency
    await initializeDatabase(db);

    const fkRow = sqlite.prepare("PRAGMA foreign_keys;").get() as {
      foreign_keys: number;
    };
    expect(fkRow.foreign_keys).toBe(1);

    const profileRepo = new ProfileRepository(db);
    const privateChatRepo = new PrivateChatRepository(db);
    const messageRepo = new MessageRepository(db);

    await profileRepo.save({
      id: "peer-1",
      name: "Alice",
      avatar: new Uint8Array([1, 2, 3]),
    });

    await privateChatRepo.save({
      id: "peer-1",
      participants: ["peer-1"],
    });

    await messageRepo.save({
      chatId: "peer-1",
      senderId: "peer-1",
      contentType: "text",
      content: "Cascade test",
      timestamp: new Date(),
    });

    expect(await messageRepo.list("peer-1")).toHaveLength(1);

    // Deleting the chat should cascade-delete messages and chat_participants
    await db
      .delete(databaseSchema.chats)
      .where(eq(databaseSchema.chats.id, "peer-1"));

    expect(await messageRepo.list("peer-1")).toHaveLength(0);
    const remainingParticipants = await db
      .select()
      .from(databaseSchema.chatParticipants);
    expect(remainingParticipants).toHaveLength(0);
  });

  it("round-trips IdentityRepository, ProfileRepository, PrivateChatRepository, GroupChatRepository, and MessageRepository without Buffer", async () => {
    expect(globalThis.Buffer).toBeUndefined();
    const { db } = await createInMemoryTestDatabase();

    // 1. IdentityRepository
    const identityRepo = new IdentityRepository(db);
    expect(await identityRepo.getSeed()).toBeUndefined();
    const generatedSeed = await identityRepo.generateSeed();
    expect(generatedSeed).toBeInstanceOf(Uint8Array);
    expect(generatedSeed.byteLength).toBe(32);

    const fetchedSeed = await identityRepo.getSeed();
    expect(fetchedSeed).toBeInstanceOf(Uint8Array);
    expect(fetchedSeed?.constructor).toBe(Uint8Array);
    expect(fetchedSeed).toEqual(generatedSeed);

    // 2. ProfileRepository
    const profileRepo = new ProfileRepository(db);
    const avatarBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const savedProfile = await profileRepo.save({
      id: "user-self",
      name: "Self",
      avatar: avatarBytes,
    });
    expect(profileSchema.assert(savedProfile)).toEqual({
      id: "user-self",
      name: "Self",
      avatar: avatarBytes,
    });
    expect(savedProfile.avatar?.constructor).toBe(Uint8Array);

    await profileRepo.createIfNotExists({
      id: "peer-bob",
      name: "Bob",
      avatar: null,
    });
    // Should not overwrite existing profile
    await profileRepo.createIfNotExists({
      id: "peer-bob",
      name: "Overwritten",
      avatar: avatarBytes,
    });
    const bobProfile = await profileRepo.getById("peer-bob");
    expect(bobProfile?.name).toBe("Bob");
    expect(bobProfile?.avatar).toBeNull();

    // 3. PrivateChatRepository & GroupChatRepository
    const privateChatRepo = new PrivateChatRepository(db);
    const savedPrivateChat = await privateChatRepo.save({
      id: "peer-bob",
      participants: ["peer-bob", "user-self"],
    });
    expect(privateChatSchema.assert(savedPrivateChat)).toEqual({
      id: "peer-bob",
      participants: ["peer-bob", "user-self"],
    });

    const groupChatRepo = new GroupChatRepository(db);
    const groupIcon = new Uint8Array([10, 20, 30, 40]);
    const savedGroupChat = await groupChatRepo.save({
      id: "group-1",
      name: "Core Dev",
      image: groupIcon,
      participants: ["user-self", "peer-bob"],
    });
    expect(groupChatSchema.assert(savedGroupChat)).toEqual({
      id: "group-1",
      name: "Core Dev",
      image: groupIcon,
      participants: ["user-self", "peer-bob"],
    });

    // 4. MessageRepository ("text", "image", "file" round-trips passing messageSchema.assert)
    const messageRepo = new MessageRepository(db);
    const timestamp = new Date(1_700_000_000_000);

    const textMsg = await messageRepo.save(
      {
        chatId: "peer-bob",
        senderId: "user-self",
        contentType: "text",
        content: "Hello P2P world! 🚀",
        timestamp,
      },
      false,
    );
    expect(messageSchema.assert(textMsg)).toEqual({
      id: 1,
      chatId: "peer-bob",
      senderId: "user-self",
      contentType: "text",
      content: "Hello P2P world! 🚀",
      timestamp,
      received: false,
    });

    const imageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const imageMsg = await messageRepo.save(
      {
        chatId: "peer-bob",
        senderId: "peer-bob",
        contentType: "image",
        content: imageBytes,
        timestamp,
      },
      true,
    );
    expect(messageSchema.assert(imageMsg)).toEqual({
      id: 2,
      chatId: "peer-bob",
      senderId: "peer-bob",
      contentType: "image",
      content: imageBytes,
      timestamp,
      received: true,
    });
    if (imageMsg.contentType === "image") {
      expect(imageMsg.content.constructor).toBe(Uint8Array);
    }

    const fileBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    const fileMsg = await messageRepo.save(
      {
        chatId: "peer-bob",
        senderId: "peer-bob",
        contentType: "file",
        content: fileBytes,
        timestamp,
      },
      true,
    );
    expect(messageSchema.assert(fileMsg)).toEqual({
      id: 3,
      chatId: "peer-bob",
      senderId: "peer-bob",
      contentType: "file",
      content: fileBytes,
      timestamp,
      received: true,
    });

    const listed = await messageRepo.list("peer-bob");
    expect(listed.map((m) => m.id)).toEqual([3, 2, 1]);
    for (const msg of listed) {
      expect(() => messageSchema.assert(msg)).not.toThrow();
    }

    // Cursor pagination check
    const olderPage = await messageRepo.list("peer-bob", 3);
    expect(olderPage.map((m) => m.id)).toEqual([2, 1]);
  });

  it("returns sanitized models from PrivateChatRepository/GroupChatRepository and ensures participant profiles in GroupChatService", async () => {
    const { db } = await createInMemoryTestDatabase();
    const profileRepo = new ProfileRepository(db);
    const privateChatRepo = new PrivateChatRepository(db);
    const groupChatRepo = new GroupChatRepository(db);

    await profileRepo.createIfNotExists({
      id: "user-1",
      name: "User 1",
      avatar: null,
    });
    await profileRepo.createIfNotExists({
      id: "user-2",
      name: "User 2",
      avatar: null,
    });

    // Duplicate participants should be deduplicated and raw DB columns (isGroup, name, image) must not leak
    const savedPrivate = await privateChatRepo.save({
      id: "user-2",
      participants: ["user-1", "user-2", "user-1"],
    });
    expect(Object.keys(savedPrivate).sort()).toEqual(["id", "participants"]);
    expect("isGroup" in savedPrivate).toBe(false);
    expect("name" in savedPrivate).toBe(false);
    expect("image" in savedPrivate).toBe(false);
    expect(savedPrivate.participants).toEqual(["user-1", "user-2"]);

    // Empty participants list should save cleanly without throwing invalid empty INSERT
    const emptyPrivate = await privateChatRepo.save({
      id: "empty-private",
      participants: [],
    });
    expect(emptyPrivate).toEqual({
      id: "empty-private",
      participants: [],
    });

    // GroupChatRepository returns only { id, name, image, participants } (no leaked isGroup)
    const savedGroup = await groupChatRepo.save({
      id: "group-sanitized",
      name: "Sanitized Group",
      image: null,
      participants: ["user-1", "user-1", "user-2"],
    });
    expect(Object.keys(savedGroup).sort()).toEqual([
      "id",
      "image",
      "name",
      "participants",
    ]);
    expect("isGroup" in savedGroup).toBe(false);
    expect(savedGroup.participants).toEqual(["user-1", "user-2"]);

    // Empty participants in GroupChatRepository
    const emptyGroup = await groupChatRepo.save({
      id: "empty-group",
      name: "Empty Group",
      image: null,
      participants: [],
    });
    expect(emptyGroup).toEqual({
      id: "empty-group",
      name: "Empty Group",
      image: null,
      participants: [],
    });

    // GroupChatService.create() ensures participant profiles exist before inserting chat_participants
    const stubNodeService = {} as unknown as NodeService;
    const profileService = new ProfileService(
      profileRepo,
      stubNodeService,
      "user-1",
    );
    const groupChatService = new GroupChatService(
      groupChatRepo,
      profileService,
    );

    const createdGroup = await groupChatService.create(
      "Auto-Profile Group",
      ["unseen-peer-a", "unseen-peer-b", "unseen-peer-a"],
      new Uint8Array([9, 8, 7]),
    );
    expect(createdGroup).toBeDefined();
    expect(createdGroup?.participants).toEqual([
      "unseen-peer-a",
      "unseen-peer-b",
    ]);
    expect(await profileRepo.getById("unseen-peer-a")).toEqual({
      id: "unseen-peer-a",
      name: null,
      avatar: null,
    });
    expect(await profileRepo.getById("unseen-peer-b")).toEqual({
      id: "unseen-peer-b",
      name: null,
      avatar: null,
    });

    // PrivateChatService.create() rejects self-chat and duplicate chat creation
    const privateChatCache = new PrivateChatCache(privateChatRepo);
    await privateChatCache.init();
    const privateChatService = new PrivateChatService(
      privateChatRepo,
      profileService,
      privateChatCache,
    );

    await expect(privateChatService.create("user-1")).rejects.toThrow(
      "Cannot create a private chat with yourself",
    );
    await expect(privateChatService.create("user-2")).rejects.toThrow(
      "Chat already exists",
    );
  });
});
