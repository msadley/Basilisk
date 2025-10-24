import { Basilisk } from "@basilisk/core";
import { sqlite } from "./sqlite";

let controller: Basilisk;

self.onmessage = async (event) => {
  console.debug("[WORKER] Received message:", event.data);
  if (event.data.type === "start-node") {
    if (controller) return;

    const db = await sqlite.create();

    controller = await Basilisk.init(
      db,
      (event) => {
        console.debug("[WORKER] Message sent to UI:", event);
        self.postMessage(event);
      },
      import.meta.env.VITE_BOOTSTRAP_MULTIADDRS
    );

    await controller.startNode();
  } else if (controller) {
    await controller.handleUiCommand(event.data);
  }
};
