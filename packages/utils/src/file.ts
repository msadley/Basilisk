// packages/utils/src/file.ts

import path from "path";
import fs from "fs";
import appRootPath from "app-root-path";

export function absolutePath(file: string): string {
  return path.join(appRootPath.path, file);
}

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

export async function writeJson(file: string, data: any) {
  file = absolutePath(file);
  const jsonString = JSON.stringify(data, null, 2);
  await fs.promises.mkdir(absolutePath("config/"), { recursive: true });
  await fs.promises.writeFile(file, jsonString, "utf-8");
}

export async function readJson(file: string): Promise<any> {
  file = absolutePath(file);
  const jsonString = await fs.promises.readFile(file, "utf-8");
  return JSON.parse(jsonString);
}
