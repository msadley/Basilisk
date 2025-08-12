// src/networking/node.ts

import { kadDHT } from "@libp2p/kad-dht";
import { bootstrap } from "@libp2p/bootstrap";
import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { getBootstrapAddresses } from "../util/json.js";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { getPrivateKey } from "../util/util.js";
import { webSockets } from "@libp2p/websockets";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";

/**
 * Represents a libp2p node.
 */
export class Node {
  private node;

  /**
   * Creates a new Node instance.
   * @param {any} nodeInstance - The libp2p node instance.
   * @private
   */
  private constructor(nodeInstance: any) {
    this.node = nodeInstance;
    // Event listener for when the node finds a new peer
    this.node.addEventListener(
      "peer:discovery",
      (evt: { detail: { id: { toString: () => any } } }) => {
        console.log("Discovered:", evt.detail.id.toString());
      }
    );

    // Event listener for when a connection is established
    this.node.addEventListener(
      "connection:establish",
      (evt: { detail: { remoteAddr: { toString: () => any } } }) => {
        const remoteAddr = evt.detail.remoteAddr.toString();
        console.log(`Connection established with: ${remoteAddr}`);

        // Check if the connection is relayed
        if (remoteAddr.includes("p2p-circuit")) {
          console.log(
            "✅ SUCCESS: Connection is being relayed. Waiting for hole punch..."
          );
        } else {
          console.log("✨ UPGRADE COMPLETE: Connection is now direct!");
        }
      }
    );

    this.node.addEventListener("self:peer:update", () => {
      // Updated self multiaddrs?
      this.printAddresses();
    });
  }

  /**
   * Creates a new libp2p node.
   * @returns {Promise<Node>} A promise that resolves to a new Node instance.
   */
  static async create(): Promise<Node> {
    const nodeInstance = await createLibp2p({
      privateKey: await getPrivateKey(),
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws", "/p2p-circuit"],
      },
      transports: [tcp(), webSockets(), circuitRelayTransport()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        ping: ping(),
        identify: identify(),
        dht: kadDHT({}),
        autoNAT: autoNAT(),
        dcutr: dcutr(),
      },
      peerDiscovery: [
        bootstrap({
          list: await getBootstrapAddresses(),
        }),
      ],
      start: false,
    });
    return new Node(nodeInstance);
  }

  /**
   * Starts the libp2p node.
   */
  start() {
    this.node.start();
  }

  /**
   * Stops the libp2p node.
   */
  stop() {
    this.node.stop();
  }

  getMultiaddrs(): Multiaddr[] {
    return this.node.getMultiaddrs();
  }

  printAddresses(): string[] {
    const multiaddrs = this.getMultiaddrs();
    return multiaddrs.map((addr: Multiaddr) => addr.toString());
  }

  async printRelayedAddresses(): Promise<string[]> {
    const selfMultiaddrs = this.getMultiaddrs();
    const relayServerMultiAddress = (await getBootstrapAddresses())[0];
    if (!relayServerMultiAddress) {
      throw new Error(
        "No relay server multiaddress found in bootstrap addresses."
      );
    }
    return selfMultiaddrs
      .map((addr: Multiaddr) =>
        this.createRelayCircuitAddress(relayServerMultiAddress, addr.toString())
      )
      .filter((addr): addr is string => addr !== null);
  }

  createRelayCircuitAddress(
    relayMultiaddr: string,
    targetPeerMultiaddr: string
  ) {
    try {
      // Find the /p2p/ part and get the PeerId
      const relayPeerId = relayMultiaddr.split("/p2p/")[1];
      const targetPeerId = targetPeerMultiaddr.split("/p2p/")[1];

      if (!relayPeerId || !targetPeerId) {
        console.error("Could not find PeerId in one of the addresses.");
        return null;
      }

      // Construct the final circuit address
      return `/p2p/${relayPeerId}/p2p-circuit/p2p/${targetPeerId}`;
    } catch (error) {
      console.error("Failed to parse multiaddresses:", error);
      return null;
    }
  }

  async pingTest(maString: string) {
    try {
      const latency: number = await this.node.services.ping.ping(
        multiaddr(maString)
      );
      console.log(`Pinged ${maString} in ${latency}ms`);
    } catch (error: any) {
      // throw new Error(`Ping failed: ${error.message}`); //FIXME change this
      console.log("Ping failed: ", error.message);
    }
  }

  async dial(ma: string) {
    try {
      await this.node.dial(multiaddr(ma));
      console.log("Dial successful!");
    } catch (err) {
      console.error("Dial failed:", err);
    }
  }
}
