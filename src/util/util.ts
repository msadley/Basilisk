// src/util/util.ts

import fs from 'fs';
import path from 'path';
import appRootPath  from 'app-root-path';

export async function readJsonFile(file : string) {
  try {
    file = absolutePath(file);
    const jsonString = await fs.promises.readFile(file, 'utf-8');
    const data = JSON.parse(jsonString);
    return data;
  } catch (err : any) {
    if (err.code === 'ENOENT') {
      console.error(`Error: The file '${file}' was not found.`);
    } else {
      console.error("An error occurred:", err);
    }
  }
}

export function absolutePath(file : string) {
  return path.join(appRootPath.path, file);
}

export async function writeJsonFile(file : string, data : any) {
  try {
    file = absolutePath(file);
    const jsonString = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(file, jsonString, 'utf-8');
    } catch (err : any) {
    console.error("An error occurred:", err);
  }
}
