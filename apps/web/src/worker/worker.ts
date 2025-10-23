import { Basilisk } from "@basilisk/core";
import { dbAdapter } from "./dbAdapter";

let controller: Basilisk;

self.onmessage = async (event) => {
  if (event.data.type === "start-node") {
    if (controller) return;

    console.log("Worker: Received start-node message");

    const db = await dbAdapter.create();
    console.log("Worker: dbAdapter created");

    controller = await Basilisk.init(
      db,
      (event) => {
        self.postMessage(event);
      },
      [import.meta.env.VITE_BOOTSTRAP_MULTIADDRS],
    );

    await controller.startNode();
  } else if (controller) {
    await controller.handleUiCommand(event.data);
  }
};
