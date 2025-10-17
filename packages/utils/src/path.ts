// packages/utils/src/path.ts

import path from "path";
import os from "os";

let homePath: string = path.join(os.homedir(), ".basilisk");

export function setHomePath(newPath: string) {
  homePath = newPath;
}

export function getHomePath() {
  return homePath;
}

export function getHomeDatabasePath(): string {
  return path.join(getHomePath(), "databases/")
}