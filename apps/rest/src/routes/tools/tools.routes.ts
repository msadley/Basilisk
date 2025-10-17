// apps/rest/src/routes/tools/tools.routes.ts

import { Router } from "express";
import { ping } from "./tools.controller.js";

const router = Router();

router.get("/ping/:addr", ping);

export default router;
