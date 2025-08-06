// src/index.ts

import { menu } from "./interface/tui.js";
import { App } from "./app/app.js";

async function main() {
  const app = await App.init();
  menu(app);
}

main();
