// apps/rest/src/routes/tools/tools.controller.ts

import { log } from "@basilisk/utils";
import { basilisk } from "../../index.js";
import { type Request, type Response } from "express";

export const ping = async (req: Request<{ addr: string }>, res: Response) => {
  await log("INFO", `Pinging ${req.params.addr}`);
  const latency = await basilisk.ping(req.params.addr);
  res.json({ latency });
};
