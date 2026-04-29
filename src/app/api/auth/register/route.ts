import { NextResponse } from "next/server";
import { hashPassword, setAuthSession } from "@/lib/server/auth";
import { createUser, findUserByEmail } from "@/lib/server/user-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ message: "Email already registered." }, { status: 409 });
  }

  const user = await createUser(email, hashPassword(password));
  await setAuthSession(user.id, user.email);

  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}
