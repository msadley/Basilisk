// apps/rest/src/chat/chat.controller.ts

import { type Request, type Response } from "express";
import { basilisk } from "../../index.js";
import { log } from "@basilisk/utils";
import { type Message, type Profile } from "@basilisk/core";

export const getPeerProfile = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  await log("INFO", `Request received for peer profile ${req.params.id}`);
  const { id } = req.params;
  const profile = await basilisk.getPeerProfile(id);
  res.status(200).json(profile);
};

export const getChats = async (_req: Request, res: Response) => {
  await log("INFO", "Request received for chats");
  const profiles: Profile[] = await basilisk.getChats();
  await log("INFO", `Found ${profiles.length} chats.`);
  res.status(200).json(profiles);
};

export const getChat = async (req: Request<{ id: string }>, res: Response) => {
  log("INFO", `Request received for chat ${req.params.id}`);
  const { id } = req.params;
  const database = await basilisk.getChatById(id);

  if (database) {
    res.status(200).json(database);
  } else {
    res.status(404).json({ message: "Database not found." });
  }
};

export const getMessages = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  log("INFO", `Request received for messages from chat ${req.params.id}`);
  const { id } = req.params;
  const messages = await basilisk.getMessages(id);
  res.status(200).json(messages);
};

export const getMessage = async (
  req: Request<{ id: string; msg: number }>,
  res: Response
) => {
  log(
    "INFO",
    `Request received for message ${req.params.msg} from chat ${req.params.id}`
  );
  const message: Message = await basilisk.getMessage(
    req.params.id,
    req.params.msg
  );
  res.status(200).json(message);
};

// TODO Fix media compatibility
export const sendMessage = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  log(
    "INFO",
    `Request received for sending a message to chat ${req.params.id}`
  );
  const id = req.params.id;
  const content = req.body.content;
  try {
    await basilisk.sendMessage(id, content);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.status(201).json({ message: "Message sent successfully." });
};
