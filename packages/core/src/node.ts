// packages/core/src/node.ts

// Libp2p-related imports
import { createLibp2p, type Libp2p, type Libp2pOptions } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { bootstrap } from "@libp2p/bootstrap";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import type { Connection, Stream } from "@libp2p/interface";
import {
  circuitRelayServer,
  circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";
import { ping } from "@libp2p/ping";
import { webSockets } from "@libp2p/websockets";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";

// Local packages imports
import { getPrivateKey } from "./keys.js";
import { log } from "@basilisk/utils";
import { validateConfigFile } from "./config.js";
import { stdinToStream, streamToConsole } from "./stream.js";
import { kadDHT } from "@libp2p/kad-dht";
import { tcp } from "@libp2p/tcp";

const bootstrapNodes = process.env.BOOTSTRAP_MULTIADDRS?.split("\n") || [
  "/dns4/your-relay.example.com/tcp/4001/p2p/12D3KooW...",
];

const publicDns = process.env.PUBLIC_DNS || "localhost";

const baseConfig: Partial<Libp2pOptions> = {
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    ping: ping(),
    dht: kadDHT(),
    identify: identify(),
    autoNAT: autoNAT(),
    dcutr: dcutr(),
  } as any,
};

const clientConfig: Partial<Libp2pOptions> = {
  addresses: {
    listen: ["/p2p-circuit"],
  },
  transports: [tcp(), webSockets(), circuitRelayTransport()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapNodes,
    }),
  ],
};

const serverConfig: Partial<Libp2pOptions> = {
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
    announce: [`/dns4/${publicDns}/tcp/4001`, `/dns4/${publicDns}/tcp/4002/ws`],
  },
  transports: [tcp(), webSockets()],
  services: {
    relay: circuitRelayServer({
      reservations: {
        applyDefaultLimit: false,
      },
    }),
  },
};

export class Node {
  private node: Libp2p;

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    this.node.addEventListener("connection:open", (evt) => {
      const remoteAddr = evt.detail.remoteAddr.toString();
      log("INFO", `Connection established with: ${remoteAddr}`);
    });
  }

  static async init(mode: "CLIENT" | "RELAY"): Promise<Node> {
    await log("INFO", "Initializing node...");

    await validateConfigFile();

    const modeConfig = mode === "CLIENT" ? clientConfig : serverConfig;

    const config: Libp2pOptions = {
      ...baseConfig,
      ...modeConfig,
      services: {
        ...baseConfig.services,
        ...modeConfig.services,
      },
      privateKey: await getPrivateKey(),
      start: true,
    };

    const node = await createLibp2p(config);

    await log("INFO", "Creating chat protocol...");
    await node.handle("/chat/1.0.0", async ({ stream }) => {
      stdinToStream(stream);
      streamToConsole(stream);
    });
    await log("INFO", "Chat protocol created.");

    await log("INFO", "Node initialized.");

    return new Node(node);
  }

  async stop() {
    await log("INFO", "Stopping node...");
    this.node.stop();
    await log("INFO", "Node stopped.");
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  printAddresses(): string[] {
    const multiaddrs = this.getMultiaddrs();
    return multiaddrs.map((addr: Multiaddr) => addr.toString());
  }

  async pingTest(addr: string): Promise<string> {
    const pingService = this.node.services.ping as {
      ping: (addr: Multiaddr) => Promise<number>;
    };
    const latency: number = await pingService.ping(multiaddr(addr));
    return `Pinged ${addr.toString()} in ${latency}ms`;
  }

  async startChatStream(addr: string): Promise<Stream> {
    return await this.node.dialProtocol(multiaddr(addr), "chat/1.0.0");
  }

  async chat(addr: string) {
    try {
      await log("INFO", `Chatting with ${addr}...`);
      const stream = await this.startChatStream(addr);
      stdinToStream(stream);
      streamToConsole(stream);
    } catch (err) {
      log("ERROR", `Chat failed: ${err}`);
      throw new Error("Chat failed: " + err);
    }
  }
}
