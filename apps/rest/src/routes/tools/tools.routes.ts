// apps/rest/src/routes/tools/tools.routes.ts

import { Router } from "express";
import { addresses, ping } from "./tools.controller.js";

const router = Router();

router.get("/ping/:addr", ping);
router.get("/addresses", addresses);

export default router;
