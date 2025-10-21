// apps/rest/src/chat/chat.routes.ts

import { Router } from "express";

import {
  getChats,
  getChat,
  getMessage,
  getMessages,
  sendMessage,
  getPeerProfile,
} from "./chat.controller.js";
import { handler } from "../../utils/handler.js";

const router = Router();

router.get("/", handler(getChats));
router.get("/:id", handler(getChat));
router.get("/:id/profile", handler(getPeerProfile));
router.get("/:id/message", handler(getMessages));
router.get("/:id/message/:msg", handler(getMessage));
router.post("/:id/message", handler(sendMessage));

export default router;
