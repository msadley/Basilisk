import type { IncomingStreamData, Stream } from "@libp2p/interface";
import * as lp from "it-length-prefixed";
import { pipe } from "it-pipe";
import { toString } from "uint8arrays/to-string";
import { fromString } from "uint8arrays/from-string";
import type { Type } from "arktype";

export async function parseDataFromStream<S extends Type<any>>(
  stream: Stream,
  schema: S,
): Promise<S["infer"]> {
  return pipe(stream.source, lp.decode, async (source) => {
    for await (const buf of source)
      return schema.assert(JSON.parse(toString(buf.subarray())));

    throw new Error("Stream ended without a response");
  });
}

export async function sendDataToStream(stream: Stream, data: any) {
  await pipe([fromString(JSON.stringify(data))], lp.encode, stream.sink);
}

export async function forwardSchemaValidatedStream<T, K>(
  event: IncomingStreamData,
  schema: Type<T>,
  fn: (arg0: T) => K | Promise<K>,
): Promise<K> {
  const parsedData: T = await parseDataFromStream(event.stream, schema);
  return fn(parsedData);
}
