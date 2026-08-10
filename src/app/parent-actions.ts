"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  assertAuthAllowed,
  authThrottleKey,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth-throttle";
import { db } from "@/lib/db";
import { generateParentAccessCode } from "@/lib/parent-access";
import { parentStudentLinkSchema } from "@/lib/validation";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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

export async function linkStudentAction(form: FormData) {
  const user = await requireUser("PARENT");
  const parsed = parentStudentLinkSchema.safeParse({
    studentEmail: value(form, "studentEmail"),
    accessCode: value(form, "accessCode"),
    relationship: value(form, "relationship"),
  });
  const path = "/parent/students";
  if (!parsed.success)
    fail(path, parsed.error.issues[0]?.message ?? "Check the connection details.");

  const throttleKey = await authThrottleKey(
    "parent-link",
    `${user.id}:${parsed.data.studentEmail}`,
  );
  try {
    await assertAuthAllowed(throttleKey);
  } catch (error) {
    fail(
      path,
      error instanceof Error
        ? error.message
        : "Too many connection attempts. Please try again later.",
    );
  }
  const student = await db.studentProfile.findFirst({
    where: {
      parentAccessCode: parsed.data.accessCode,
      user: { email: parsed.data.studentEmail },
    },
    select: { id: true, userId: true },
  });
  if (!student) {
    await recordAuthFailure(throttleKey);
    fail(path, "The student email or parent access code is incorrect.");
  }

  await clearAuthFailures(throttleKey);
  const existing = await db.parentStudent.findUnique({
    where: {
      parentId_studentId: {
        parentId: user.parentProfile!.id,
        studentId: student.id,
      },
    },
    select: { id: true },
  });
  if (existing) redirect(`${path}?success=Student already connected`);

  try {
    await db.$transaction(async (tx) => {
      const connection = await tx.parentStudent.create({
        data: {
          parentId: user.parentProfile!.id,
          studentId: student.id,
          relationship: parsed.data.relationship || null,
        },
      });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "Connected student account",
          entityType: "ParentStudent",
          entityId: connection.id,
        },
      });
      await tx.activityLog.create({
        data: {
          userId: student.userId,
          action: "Connected parent account",
          entityType: "ParentStudent",
          entityId: connection.id,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      redirect(`${path}?success=Student already connected`);
    throw error;
  }
  revalidatePath("/parent", "layout");
  redirect(`${path}?success=Student connected`);
}

export async function unlinkStudentAction(form: FormData) {
  const user = await requireUser("PARENT");
  const id = value(form, "id");
  const connection = await db.parentStudent.findFirst({
    where: { id, parentId: user.parentProfile!.id },
    select: { id: true, student: { select: { userId: true } } },
  });
  if (!connection) fail("/parent/students", "Student connection not found.");
  await db.$transaction([
    db.parentStudent.delete({ where: { id: connection.id } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Removed student connection",
        entityType: "ParentStudent",
        entityId: connection.id,
      },
    }),
    db.activityLog.create({
      data: {
        userId: connection.student.userId,
        action: "Parent access removed",
        entityType: "ParentStudent",
        entityId: connection.id,
      },
    }),
  ]);
  revalidatePath("/parent", "layout");
  redirect("/parent/students?success=Student connection removed");
}

export async function revokeParentAccessAction(form: FormData) {
  const user = await requireUser("STUDENT");
  const id = value(form, "id");
  const connection = await db.parentStudent.findFirst({
    where: { id, studentId: user.studentProfile!.id },
    select: { id: true, parent: { select: { userId: true } } },
  });
  if (!connection) fail("/account", "Parent connection not found.");
  await db.$transaction([
    db.parentStudent.delete({ where: { id: connection.id } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Revoked parent access",
        entityType: "ParentStudent",
        entityId: connection.id,
      },
    }),
    db.activityLog.create({
      data: {
        userId: connection.parent.userId,
        action: "Student connection revoked",
        entityType: "ParentStudent",
        entityId: connection.id,
      },
    }),
  ]);
  revalidatePath("/student", "layout");
  revalidatePath("/parent", "layout");
  redirect("/account?success=Parent access revoked");
}

export async function regenerateParentAccessCodeAction() {
  const user = await requireUser("STUDENT");
  const code = await uniqueParentAccessCode();
  await db.$transaction([
    db.studentProfile.update({
      where: { id: user.studentProfile!.id },
      data: { parentAccessCode: code },
    }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Regenerated parent access code",
        entityType: "StudentProfile",
        entityId: user.studentProfile!.id,
      },
    }),
  ]);
  revalidatePath("/student", "layout");
  revalidatePath("/parent", "layout");
  redirect("/account?success=Parent access code regenerated");
}
