// package/core/src/connection.ts

import { fromString } from "uint8arrays/from-string";
import type { Stream } from "@libp2p/interface";
import * as lp from "it-length-prefixed";
import { pushable, type Pushable } from "it-pushable";
import { pipe } from "it-pipe";
import type { Message } from "./types.js";

export class Connection {
  private stream: Stream;
  private messagePusher!: Pushable<Uint8Array>;

  constructor(stream: Stream) {
    this.stream = stream;
    this.setupPipe();
  }

  private setupPipe() {
    this.messagePusher = pushable();

    pipe(this.messagePusher, (source) => lp.encode(source), this.stream.sink);
  }

  sendMessage(message: Message) {
    const messageString = JSON.stringify(message);
    this.messagePusher.push(fromString(messageString));
  }

  close() {
    this.messagePusher.end();
  }
}
