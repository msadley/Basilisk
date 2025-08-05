import fs from 'fs/promises';
import path from 'path';
import appRootPath  from 'app-root-path';

export async function readJsonFile(file : string) {
  try {
    file = absolutePath(file);
    const jsonString = await fs.readFile(file, 'utf8');
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

