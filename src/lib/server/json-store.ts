import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const dataDirectory = path.join(process.cwd(), "data");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataDirectory() {
  await mkdir(dataDirectory, { recursive: true });
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDataDirectory();

  const filePath = path.join(dataDirectory, fileName);

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    await writeJsonFile(fileName, fallback);
    return fallback;
  }
}

export async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
  await ensureDataDirectory();

  const filePath = path.join(dataDirectory, fileName);
  const content = JSON.stringify(data, null, 2);

  writeQueue = writeQueue.then(() => writeFile(filePath, content, "utf-8"));
  await writeQueue;
}
