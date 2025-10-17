// apps/rest/src/chat/chat.controller.ts

import { type Request, type Response } from "express";
import { basilisk } from "../../index.js";
import { log } from "@basilisk/utils";
import { type Message } from "@basilisk/core";

export const getChats = async (_req: Request, res: Response) => {
  log("INFO", "Request received for chats");
  const databases: string[] = await basilisk.getChats();
  res.status(200).json(databases);
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
  req: Request<{ id: string }, {}, { content: string }>,
  res: Response
) => {
  log(
    "INFO",
    `Request received for sending a message to chat ${req.params.id}`
  );
  const { id } = req.params;
  const { content } = req.body;
  await basilisk.sendMessage(id, content);
  res.status(201).json({ message: "Message sent successfully." });
};
