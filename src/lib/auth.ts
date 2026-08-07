import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";
import { db } from "./db";
import type {
  ParentProfile,
  Role,
  StudentProfile,
  TeacherProfile,
  User,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { getAuthSecret } from "@/lib/runtime-config";
import { cache } from "react";

const COOKIE_NAME = "edugrade_session";
const SESSION_DAYS = 14;

type AuthenticatedUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "avatarUrl" | "createdAt" | "updatedAt"
> & {
  teacherProfile: TeacherProfile | null;
  studentProfile: StudentProfile | null;
  parentProfile: ParentProfile | null;
};

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

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [user] = await db.$queryRaw<AuthenticatedUser[]>`
    SELECT
      u."id",
      u."email",
      u."name",
      u."role"::text AS "role",
      u."avatarUrl",
      u."createdAt",
      u."updatedAt",
      CASE
        WHEN teacher."id" IS NULL THEN NULL
        ELSE JSONB_BUILD_OBJECT(
          'id', teacher."id",
          'userId', teacher."userId",
          'school', teacher."school",
          'subject', teacher."subject"
        )
      END AS "teacherProfile",
      CASE
        WHEN student."id" IS NULL THEN NULL
        ELSE JSONB_BUILD_OBJECT(
          'id', student."id",
          'userId', student."userId",
          'school', student."school",
          'grade', student."grade",
          'rollNumber', student."rollNumber",
          'parentAccessCode', student."parentAccessCode"
        )
      END AS "studentProfile",
      CASE
        WHEN parent."id" IS NULL THEN NULL
        ELSE JSONB_BUILD_OBJECT(
          'id', parent."id",
          'userId', parent."userId",
          'school', parent."school"
        )
      END AS "parentProfile"
    FROM "Session" session
    INNER JOIN "User" u ON u."id" = session."userId"
    LEFT JOIN "TeacherProfile" teacher ON teacher."userId" = u."id"
    LEFT JOIN "StudentProfile" student ON student."userId" = u."id"
    LEFT JOIN "ParentProfile" parent ON parent."userId" = u."id"
    WHERE session."tokenHash" = ${hash(token)}
      AND session."expiresAt" >= CURRENT_TIMESTAMP
    LIMIT 1
  `;
  return user ?? null;
});

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
