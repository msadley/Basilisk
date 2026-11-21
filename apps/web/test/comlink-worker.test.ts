import type { PushEvent, WorkerEventSink } from "@basilisk/core";
import * as Comlink from "comlink";
import { describe, expect, it } from "vitest";

class MockProfileService {
  private profile = {
    id: "12D3KooWWorkerPeer",
    name: "Worker Node" as string | null,
    avatar: new Uint8Array([1, 2, 3, 4]) as Uint8Array | null,
  };

  async getUserProfile() {
    return this.profile;
  }

  async update(avatar?: Uint8Array | null, name?: string | null) {
    if (avatar !== undefined) {
      this.profile.avatar = avatar;
    }
    if (name !== undefined) {
      this.profile.name = name;
    }
    return this.profile;
  }
}

class MockChatService {
  private chats = [
    {
      id: "12D3KooWRemotePeer",
      participants: ["12D3KooWWorkerPeer", "12D3KooWRemotePeer"],
    },
  ];

  async list() {
    return this.chats;
  }
}

class MockMessageService {
  async list(chatId: string) {
    return [
      {
        id: 1,
        chatId,
        senderId: chatId,
        contentType: "text" as const,
        content: "Proxied message over Comlink",
        timestamp: new Date(1_700_000_000_000),
        received: true,
      },
    ];
  }
}

class MockNodeService {
  constructor(private sink: WorkerEventSink) {}

  async start() {
    this.sink.emit({ type: "relay-found" });
    this.sink.emit({
      type: "peer-found",
      payload: { peerId: "12D3KooWRemotePeer" },
    });
  }
}

describe("Worker Comlink.proxy service container over MessageChannel", () => {
  it("exposes class-instance services via Comlink.proxy without DataCloneError and forwards WorkerEventSink events", async () => {
    const channel = new MessageChannel();

    const workerApi = {
      init: async (_relayAddress: string, sink: WorkerEventSink) => {
        const profileService = new MockProfileService();
        const chatService = new MockChatService();
        const messageService = new MockMessageService();
        const nodeService = new MockNodeService(sink);

        return Comlink.proxy({
          profileService: Comlink.proxy(profileService),
          chatService: Comlink.proxy(chatService),
          messageService: Comlink.proxy(messageService),
          nodeService: Comlink.proxy(nodeService),
        });
      },
    };

    Comlink.expose(workerApi, channel.port1);
    const remoteInitializer = Comlink.wrap<typeof workerApi>(channel.port2);

    const receivedEvents: PushEvent[] = [];
    const services = await remoteInitializer.init(
      "/dns4/relay.example.com/tcp/443/wss/p2p/12D3KooWRelayPeer",
      Comlink.proxy({
        emit: (event: PushEvent) => {
          receivedEvents.push(event);
        },
      }),
    );

    try {
      const userProfile = await services.profileService.getUserProfile();
      expect(userProfile).toEqual({
        id: "12D3KooWWorkerPeer",
        name: "Worker Node",
        avatar: new Uint8Array([1, 2, 3, 4]),
      });

      const updatedProfile = await services.profileService.update(
        new Uint8Array([9, 9]),
        "Updated Worker",
      );
      expect(updatedProfile).toEqual({
        id: "12D3KooWWorkerPeer",
        name: "Updated Worker",
        avatar: new Uint8Array([9, 9]),
      });

      const chats = await services.chatService.list();
      expect(chats).toEqual([
        {
          id: "12D3KooWRemotePeer",
          participants: ["12D3KooWWorkerPeer", "12D3KooWRemotePeer"],
        },
      ]);

      const messages = await services.messageService.list("12D3KooWRemotePeer");
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("Proxied message over Comlink");

      await services.nodeService.start();

      // Allow MessagePort event delivery to settle
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(receivedEvents).toEqual([
        { type: "relay-found" },
        {
          type: "peer-found",
          payload: { peerId: "12D3KooWRemotePeer" },
        },
      ]);
    } finally {
      channel.port1.close();
      channel.port2.close();
    }
  });
});
