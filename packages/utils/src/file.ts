// packages/utils/src/file.ts

import path from "path";
import { promises as fs } from "fs";
import appRootPath from "app-root-path";

export function absolutePath(file: string): string {
  return path.join(appRootPath.path, file);
}

export async function ensurePathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath(filePath));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      await createFile(filePath);
      return false;
    }
    throw error;
  }
  return true;
}

export async function createFile(filePath: string) {
  await fs.mkdir(absolutePath(path.dirname(filePath)), {
    recursive: true,
  });
  await fs.writeFile(absolutePath(filePath), "");
}

export async function searchFiles(dir: string): Promise<string[]> {
  let files = await fs.readdir(absolutePath(dir));
  files = files.filter((file) => path.extname(file) === ".db");
  files = files.map((file) => path.join(dir, file));
  return files;
}

export async function writeJson(file: string, data: any) {
  file = absolutePath(file);
  const jsonString = JSON.stringify(data, null, 2);
  await fs.mkdir(path.dirname(file), {
    recursive: true,
  });
  await fs.writeFile(file, jsonString, "utf-8");
}

export async function readJson(file: string): Promise<Record<string, any>> {
  file = absolutePath(file);
  const jsonString = await fs.readFile(file, "utf-8");
  return JSON.parse(jsonString);
}

export async function overrideJsonField(
  file: string,
  field: string,
  data: any
) {
  let jsonData = await readJson(file);
  jsonData[field] = data;
  await writeJson(file, jsonData);
}
