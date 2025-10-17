// apps/rest/src/utils/env.ts

import appRootPath from "app-root-path";
import { config } from "dotenv";

const result = config({ path: `${appRootPath}/.env` });

if (result.error) {
  console.error("Fatal: Could not load .env file.");
  throw result.error;
}
