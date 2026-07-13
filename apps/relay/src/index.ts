import IdentityManager from "./IdentityManager.js";
import { databaseAdapter } from "./DatabaseAdapter.js";
import BasiliskRelay from "./BasiliskRelay.js";
import "dotenv/config"

const PUBLIC_DNS = process.env.PUBLIC_DNS;

if (!PUBLIC_DNS) {
  throw new Error("PUBLIC_DNS environment variable not set");
}

const identityManager = new IdentityManager(databaseAdapter);
const privateKey = await identityManager.getIdentity();

const basilisk = await BasiliskRelay.init(PUBLIC_DNS, privateKey);
await basilisk.start();
