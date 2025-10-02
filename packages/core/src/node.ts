// packages/core/src/node.ts

// Libp2p-related imports
import { createLibp2p, type Libp2p, type Libp2pOptions } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { bootstrap } from "@libp2p/bootstrap";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import type { Stream } from "@libp2p/interface";
import { ping } from "@libp2p/ping";
import { webSockets } from "@libp2p/websockets";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";
import { kadDHT } from "@libp2p/kad-dht";
import { tcp } from "@libp2p/tcp";
import {
  circuitRelayServer,
  circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";

//Misc imports
import { EventEmitter } from "events";
import map from "it-map";
import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";
import type { Packet } from "./packet.js";

// Local packages imports
import { getPrivateKey } from "./keys.js";
import { log } from "@basilisk/utils";
import { validateConfigFile } from "./config.js";

// Environment variables
const bootstrapNodes = process.env.BOOTSTRAP_MULTIADDRS?.split("\n") || [
  "/dns4/your-relay.example.com/tcp/4001/p2p/12D3KooW...",
];
const publicDns = process.env.PUBLIC_DNS || "localhost";

// Libp2p config templates
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

// Events
export const chatEvents = new EventEmitter();

export class Node {
  private node: Libp2p;
  private chatStreams: Map<Multiaddr, Stream> = new Map();

  private constructor(nodeInstance: Libp2p) {
    this.node = nodeInstance;

    this.node.addEventListener("connection:open", (evt) => {
      const remoteAddr = evt.detail.remoteAddr.toString();
      log("INFO", `Connection established with: ${remoteAddr}`);
    });

    this.node.addEventListener("connection:close", (evt) => {
      const remoteAddr = evt.detail.remoteAddr;
      log("INFO", `Connection closed with: ${remoteAddr.toString()}`);
      this.chatStreams.delete(remoteAddr);
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
      start: false,
    };

    const node = await createLibp2p(config);

    await log("INFO", "Creating chat protocol...");
    await node.handle("/chat/1.0.0", async ({ stream }) => {
      for await (const chunk of stream.source) {
        const packet: Packet = JSON.parse(toString(chunk.subarray()));
        chatEvents.emit("message:receive", packet);
      }
    });
    await log("INFO", "Chat protocol created.");

    await node.start();
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

  async pingTest(addr: string): Promise<number> {
    const pingService = this.node.services.ping as {
      ping: (addr: Multiaddr) => Promise<number>;
    };
    const latency: number = await pingService.ping(multiaddr(addr));
    await log("INFO", `Pinged ${addr.toString()} in ${latency}ms`);
    return latency;
  }

  async createChatStream(addr: string) {
    await log("INFO", `Creating chat stream with ${addr}...`);
    const stream: Stream = await this.node.dialProtocol(
      multiaddr(addr),
      "/chat/1.0.0"
    );
    this.chatStreams.set(multiaddr(addr), stream);
    await log("INFO", `Chat stream created with ${addr}.`);
  }

  async packetToStream(msg: Packet, stream: { sink: any }) {
    pipe(
      [JSON.stringify(msg)],
      (source) => map(source, (string) => fromString(string)),
      (source) => lp.encode(source),
      stream.sink
    );
  }

  async streamToPacket(stream: { source: any }) {
    pipe(
      stream.source,
      (source) => lp.decode(source),
      (source) => map(source, (buffer) => toString(buffer.subarray())),
      (source) => map(source, (string) => JSON.parse(string)),
      (source) =>
        map(source, (Packet) => chatEvents.emit("packet:receive", Packet))
    );
  }
}
