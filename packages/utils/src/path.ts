// packages/utils/src/path.ts

import path from "path";

let homePath: string;

export function setHomePath(newPath: string) {
  homePath = newPath;
}

export function getHomePath() {
  return homePath;
}

export function getHomeDatabasePath(): string {
  return path.join(getHomePath(), "database");
}
