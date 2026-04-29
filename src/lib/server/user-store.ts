import { randomUUID } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store";

const USERS_FILE = "users.json";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export async function getUsers(): Promise<UserRecord[]> {
  return readJsonFile<UserRecord[]>(USERS_FILE, []);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<UserRecord> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();

  const user: UserRecord = {
    id: randomUUID(),
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeJsonFile(USERS_FILE, users);
  return user;
}
