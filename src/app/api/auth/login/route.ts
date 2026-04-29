import { NextResponse } from "next/server";
import { setAuthSession, verifyPassword } from "@/lib/server/auth";
import { findUserByEmail } from "@/lib/server/user-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  await setAuthSession(user.id, user.email);
  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 200 });
}
