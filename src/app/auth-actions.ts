"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, homeForRole } from "@/lib/auth";
import {
  assertAuthAllowed,
  authThrottleKey,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth-throttle";
import { registerSchema } from "@/lib/validation";
import { generateParentAccessCode } from "@/lib/parent-access";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

function fail(message: string): never {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

async function uniqueParentAccessCode() {
  let code = "";
  do {
    code = generateParentAccessCode();
  } while (
    await db.studentProfile.findUnique({ where: { parentAccessCode: code } })
  );
  return code;
}

export async function registerAction(form: FormData) {
  const parsed = registerSchema.safeParse({
    name: value(form, "name"),
    email: value(form, "email"),
    password: value(form, "password"),
    confirmPassword: value(form, "confirmPassword"),
    role: value(form, "role"),
    school: value(form, "school"),
    subject: value(form, "subject"),
    grade: value(form, "grade"),
    rollNumber: value(form, "rollNumber"),
  });
  if (!parsed.success)
    fail(parsed.error.issues[0]?.message ?? "Check your account details.");

  const throttleKey = await authThrottleKey("register", parsed.data.email);
  try {
    await assertAuthAllowed(throttleKey);
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const parentAccessCode =
      parsed.data.role === "STUDENT"
        ? await uniqueParentAccessCode()
        : undefined;
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        teacherProfile:
          parsed.data.role === "TEACHER"
            ? {
                create: {
                  school: parsed.data.school,
                  subject: parsed.data.subject,
                },
              }
            : undefined,
        studentProfile:
          parsed.data.role === "STUDENT"
            ? {
                create: {
                  school: parsed.data.school,
                  grade: parsed.data.grade,
                  rollNumber: parsed.data.rollNumber,
                  parentAccessCode: parentAccessCode!,
                },
              }
            : undefined,
        parentProfile:
          parsed.data.role === "PARENT"
            ? { create: { school: parsed.data.school } }
            : undefined,
      },
    });
    await clearAuthFailures(throttleKey);
    await createSession(user.id);
    await db.activityLog.create({
      data: { userId: user.id, action: "Created account", entityType: "User" },
    });
    redirect(homeForRole(user.role));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      await recordAuthFailure(throttleKey);
      fail("An account with this email already exists.");
    }
    if (error instanceof Error && error.message.startsWith("Too many attempts"))
      fail(error.message);
    console.error(
      "[EduGrade] Account registration failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    fail("Account creation is temporarily unavailable. Please try again.");
  }
}
