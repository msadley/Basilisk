// apps/rest/server.ts

import "./utils/env.js";

import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,  
} from "express";
import cors from "cors";
import { Basilisk } from "@basilisk/core";
import { log } from "@basilisk/utils";

import profileRoutes from "./routes/profile/profile.routes.js";
import chatRoutes from "./routes/chat/chat.routes.js";
import toolsRoutes from "./routes/tools/tools.routes.js";

const home_data: string | undefined = process.env.HOME_DATA || undefined;
const port: number = Number(process.env.SERVER_PORT) || 3001;

const app: Application = express();
export const basilisk = await Basilisk.init("CLIENT", home_data);

app.use(cors());
app.use(express.json());

app.use("/profile", profileRoutes);
app.use("/chat", chatRoutes);
app.use("/tools", toolsRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log("ERROR", err.message || "Ocorreu um erro interno.");
  res.status(500).json({ message: err.message || "Ocorreu um erro interno." });
});

app.listen(port, () => {
  console.log(`Servidor TypeScript rodando em http://localhost:${port}`);
});
