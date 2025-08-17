// src/util/util.ts

import path from "path";
import fs from "fs";
import appRootPath from "app-root-path";

export function absolutePath(file: string): string {
  return path.join(appRootPath.path, file);
}

/**
 * Returns false if the file wasn't valid else returns true
 */
export async function validateFile(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(absolutePath(filePath));
  } catch (error: any) {
    await createFile(filePath);
    return false;
  }
  return true;
}

export async function createFile(filePath: string) {
  await fs.promises.mkdir(absolutePath(path.dirname(filePath)), {
    recursive: true,
  });
  await fs.promises.writeFile(absolutePath(filePath), "");
}
