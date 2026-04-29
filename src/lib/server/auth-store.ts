import { randomUUID } from "crypto";
import { MongoClient, Db } from "mongodb";
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store";

const USERS_FILE = "users.json";
const SESSIONS_FILE = "sessions.json";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const useMongoDb = process.env.DB_TYPE === "mongodb";

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

export type AuthSessionRecord = {
  userId: string;
  email: string;
  token: string;
};

async function getDatabase(): Promise<Db> {
  if (!db) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is required for auth storage");
    }

    mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB_NAME || "personal-finance");
    await createIndexes(db);
  }

  return db;
}

async function createIndexes(database: Db): Promise<void> {
  const usersCollection = database.collection<UserRecord>("users");
  const sessionsCollection = database.collection<SessionRecord>("sessions");

  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await sessionsCollection.createIndex({ token: 1 }, { unique: true });
  await sessionsCollection.createIndex({ userId: 1 });
  await sessionsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

async function getUsersJson(): Promise<UserRecord[]> {
  return readJsonFile<UserRecord[]>(USERS_FILE, []);
}

async function getSessionsJson(): Promise<SessionRecord[]> {
  return readJsonFile<SessionRecord[]>(SESSIONS_FILE, []);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();

  if (useMongoDb) {
    const database = await getDatabase();
    return (
      (await database.collection<UserRecord>("users").findOne({ email: normalized })) ?? null
    );
  }

  const users = await getUsersJson();
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  if (useMongoDb) {
    const database = await getDatabase();
    return (await database.collection<UserRecord>("users").findOne({ id: userId })) ?? null;
  }

  const users = await getUsersJson();
  return users.find((user) => user.id === userId) ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<UserRecord> {
  const normalized = email.trim().toLowerCase();
  const user: UserRecord = {
    id: randomUUID(),
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (useMongoDb) {
    const database = await getDatabase();
    await database.collection<UserRecord>("users").insertOne(user);
    return user;
  }

  const users = await getUsersJson();
  users.push(user);
  await writeJsonFile(USERS_FILE, users);
  return user;
}

export async function createSession(
  user: Pick<UserRecord, "id" | "email">,
): Promise<SessionRecord> {
  const session: SessionRecord = {
    token: randomUUID(),
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };

  if (useMongoDb) {
    const database = await getDatabase();
    await database.collection<SessionRecord>("sessions").insertOne(session);
    return session;
  }

  const sessions = await getSessionsJson();
  sessions.push(session);
  await writeJsonFile(SESSIONS_FILE, sessions);
  return session;
}

export async function findSessionByToken(token: string): Promise<AuthSessionRecord | null> {
  if (useMongoDb) {
    const database = await getDatabase();
    const session = await database.collection<SessionRecord>("sessions").findOne({ token });
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await database.collection<SessionRecord>("sessions").deleteOne({ token });
      return null;
    }

    return {
      token: session.token,
      userId: session.userId,
      email: session.email,
    };
  }

  const sessions = await getSessionsJson();
  const session = sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await writeJsonFile(
      SESSIONS_FILE,
      sessions.filter((item) => item.token !== token),
    );
    return null;
  }

  return {
    token: session.token,
    userId: session.userId,
    email: session.email,
  };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  if (useMongoDb) {
    const database = await getDatabase();
    await database.collection<SessionRecord>("sessions").deleteOne({ token });
    return;
  }

  const sessions = await getSessionsJson();
  await writeJsonFile(
    SESSIONS_FILE,
    sessions.filter((item) => item.token !== token),
  );
}
