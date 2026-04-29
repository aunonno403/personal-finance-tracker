import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  createSession,
  deleteSessionByToken,
  findSessionByToken,
  findUserById,
} from "@/lib/server/auth-store";

const SESSION_COOKIE_NAME = "pft_session";
export type AuthSession = {
  userId: string;
  email: string;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, existingHash] = stored.split(":");
  if (!salt || !existingHash) {
    return false;
  }

  const computedHash = scryptSync(password, salt, 64).toString("hex");
  if (existingHash.length !== computedHash.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(existingHash, "hex"), Buffer.from(computedHash, "hex"));
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await findSessionByToken(token);
  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return null;
  }

  return { userId: user.id, email: user.email };
}

export async function setAuthSession(userId: string, email: string) {
  const cookieStore = await cookies();
  const session = await createSession({ id: userId, email });
  const token = session.token;
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSessionByToken(token);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };
