// apps/rest/src/chat/chat.routes.ts

import { Router } from "express";

import {
  getChats,
  getMessage,
  getMessages,
  sendMessage,
} from "./chat.controller.js";
import { handler } from "../../utils/handler.js";

const router = Router();

router.get("/", handler(getChats));
router.get("/:peerId/message", handler(getMessages));
router.get("/:peerId/message/:msgId", handler(getMessage));
router.post("/:peerId/message", handler(sendMessage));

export default router;
