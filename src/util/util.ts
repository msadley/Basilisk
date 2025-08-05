import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export async function readJsonFile(file : string) {
  try {
    file = path.join('../../', file)
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

