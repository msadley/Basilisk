// packages/core/src/stream.ts

import map from "it-map";
import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";

export async function stdinToStream(stream: { sink: any }) {
  process.stdin.setDefaultEncoding("utf-8");

  pipe(
    process.stdin,
    (source) => map(source, (string) => fromString(string)),
    (source) => lp.encode(source),
    stream.sink
  );
}

export async function streamToConsole(stream: { source: any }) {
  pipe(
    stream.source,
    (source) => lp.decode(source),
    (source) => map(source, (buffer) => toString(buffer.subarray())),

    async function (source) {
      for await (const msg of source) {
        console.log("> " + msg.toString().replace("\n", "")); //TODO Have a look at me!!!
      }
    }
  );
}
