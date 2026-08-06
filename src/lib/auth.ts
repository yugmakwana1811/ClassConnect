import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";
import { db } from "./db";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAuthSecret } from "@/lib/runtime-config";

const COOKIE_NAME = "edugrade_session";
const SESSION_DAYS = 14;

const hash = (token: string) =>
  createHmac("sha256", getAuthSecret()).update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.session.create({
      data: { userId, tokenHash: hash(token), expiresAt },
    }),
  ]);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  store.delete(COOKIE_NAME);
  if (!token) return;
  try {
    await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  } catch (error) {
    console.error(
      "[EduGrade] Session cleanup failed",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: {
      user: {
        include: {
          teacherProfile: true,
          studentProfile: true,
          parentProfile: true,
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export function homeForRole(role: Role) {
  if (role === "TEACHER") return "/teacher";
  if (role === "PARENT") return "/parent";
  return "/student";
}

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(homeForRole(user.role));
  return user;
}
