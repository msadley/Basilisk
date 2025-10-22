// apps/rest/src/info/info.routes.ts

import { Router } from "express";
import {
  getPeerProfile,
  getProfile,
  setProfile,
} from "./profile.controller.js";
import { handler } from "../../utils/handler.js";

const router = Router();

router.get("/", handler(getProfile));
router.patch("/", handler(setProfile));
router.get("/:peerId", handler(getPeerProfile));

export default router;
