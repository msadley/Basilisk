// apps/rest/src/chat/chat.controller.ts

import { type Request, type Response } from "express";
import { basilisk } from "../../index.js";
import { log } from "@basilisk/utils";
import { type Message, type Chat } from "@basilisk/core";

export const getPeerProfile = async (
  req: Request<{ peerId: string }>,
  res: Response
) => {
  await log("INFO", `Request received for peer profile ${req.params.peerId}`);
  const { peerId } = req.params;
  const profile = await basilisk.getPeerProfile(peerId);
  res.status(200).json(profile);
};

export const getChats = async (_req: Request, res: Response) => {
  await log("INFO", "Retrieving chats...");
  const profiles: Chat[] = await basilisk.getChats();
  await log("INFO", `Found ${profiles.length} chats.`);
  res.status(200).json(profiles);
};

export const getMessages = async (
  req: Request<{ peerId: string }, {}, {}, { page?: string; limit?: string }>,
  res: Response
) => {
  log("INFO", `Retrieving messages from ${req.params.peerId}`);
  const { peerId } = req.params;
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "20");
  const messages = await basilisk.getMessages(peerId, page, limit);
  res.status(200).json(messages);
};

export const getMessage = async (
  req: Request<{ peerId: string; msgId: number }>,
  res: Response
) => {
  log(
    "INFO",
    `Request received for message ${req.params.msgId} from chat ${req.params.peerId}`
  );
  const message: Message = await basilisk.getMessage(
    req.params.peerId,
    req.params.msgId
  );
  res.status(200).json(message);
};

// TODO Fix media compatibility
export const sendMessage = async (
  req: Request<{ peerId: string }>,
  res: Response
) => {
  log(
    "INFO",
    `Request received for sending a message to chat ${req.params.peerId}`
  );
  const peerId = req.params.peerId;
  const content = req.body.content;
  try {
    await basilisk.sendMessage(peerId, content);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.status(201).json({ message: "Message sent successfully." });
};
