"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  homeForRole,
  requireUser,
} from "@/lib/auth";
import {
  aiSchema,
  announcementSchema,
  assignmentSchema,
  attendanceDateSchema,
  attendanceStatusSchema,
  classNameSchema,
  classSchema,
  generatedContentSchema,
  joinClassSchema,
  loginSchema,
  resourceSchema,
  reviewSchema,
  submissionNoteSchema,
  uploadedPagesSchema,
} from "@/lib/validation";
import { generateAI } from "@/lib/ai";
import {
  deleteStoredFile,
  storeFile,
  validateFile,
  verifyPrivateUpload,
} from "@/lib/storage";
import type { AIContentType } from "@prisma/client";
import {
  assertAuthAllowed,
  authThrottleKey,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth-throttle";

const DUMMY_PASSWORD_HASH =
  "$2b$12$2gwD2filJ2VA7OTnAXsmYeuBOMe30gvzLn2EKcRFC34OEEzD75EoC";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}
function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

async function uniqueClassCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from(
      { length: 6 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  } while (await db.classRoom.findUnique({ where: { code } }));
  return code;
}

export async function loginAction(form: FormData) {
  const result = loginSchema.safeParse({
    email: text(form, "email"),
    password: text(form, "password"),
  });
  if (!result.success)
    fail("/login", result.error.issues[0]?.message ?? "Check your details.");
  let user;
  const throttleKey = await authThrottleKey("login", result.data.email);
  try {
    await assertAuthAllowed(throttleKey);
    user = await db.user.findUnique({ where: { email: result.data.email } });
    const passwordMatches = await bcrypt.compare(
      result.data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !passwordMatches) {
      await recordAuthFailure(throttleKey);
      fail("/login", "Email or password is incorrect.");
    }
    await clearAuthFailures(throttleKey);
    await createSession(user.id);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    if (error instanceof Error && error.message.startsWith("Too many attempts"))
      fail("/login", error.message);
    console.error(
      "[EduGrade] Login service failure",
      error instanceof Error ? error.message : "Unknown error",
    );
    fail(
      "/login",
      "Sign-in is temporarily unavailable because the data service is not connected. Please try again shortly.",
    );
  }
  try {
    await db.activityLog.create({
      data: { userId: user.id, action: "Signed in", entityType: "Session" },
    });
  } catch (error) {
    console.error(
      "[EduGrade] Sign-in activity logging failed",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createClassAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const parsed = classSchema.safeParse({
    name: text(form, "name"),
    subject: text(form, "subject"),
    grade: text(form, "grade"),
    description: text(form, "description"),
  });
  if (!parsed.success)
    fail(
      "/teacher/classes",
      parsed.error.issues[0]?.message ?? "Check the class details.",
    );
  const code = await uniqueClassCode();
  const classroom = await db.classRoom.create({
    data: { ...parsed.data, code, teacherId: user.teacherProfile!.id },
  });
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: "Created class",
      entityType: "ClassRoom",
      entityId: classroom.id,
    },
  });
  redirect(`/teacher/classes/${classroom.id}?success=Class created`);
}

export async function updateClassAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const parsed = classSchema.safeParse({
    name: text(form, "name"),
    subject: text(form, "subject"),
    grade: text(form, "grade"),
    description: text(form, "description"),
  });
  if (!parsed.success)
    fail(
      `/teacher/classes/${id}`,
      parsed.error.issues[0]?.message ?? "Check the class details.",
    );
  const classroom = await db.classRoom.findFirst({
    where: { id, teacherId: user.teacherProfile!.id },
    select: { id: true },
  });
  if (!classroom) fail("/teacher/classes", "Class not found.");
  await db.$transaction([
    db.classRoom.update({ where: { id }, data: parsed.data }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Updated class",
        entityType: "ClassRoom",
        entityId: id,
      },
    }),
  ]);
  redirect(`/teacher/classes/${id}?success=Class updated`);
}

export async function renameClassAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const parsed = classNameSchema.safeParse(text(form, "name"));
  if (!parsed.success)
    fail(
      "/teacher/classes",
      parsed.error.issues[0]?.message ?? "Check the class name.",
    );
  const classroom = await db.classRoom.findFirst({
    where: { id, teacherId: user.teacherProfile!.id },
    select: { id: true },
  });
  if (!classroom) fail("/teacher/classes", "Class not found.");
  await db.$transaction([
    db.classRoom.update({ where: { id }, data: { name: parsed.data } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Renamed class",
        entityType: "ClassRoom",
        entityId: id,
      },
    }),
  ]);
  redirect("/teacher/classes?success=Class renamed");
}

export async function deleteClassAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const confirmation = text(form, "confirmName").trim();
  const classroom = await db.classRoom.findFirst({
    where: { id, teacherId: user.teacherProfile!.id },
    select: {
      id: true,
      name: true,
      resources: { select: { url: true } },
      assignments: {
        select: {
          attachments: { select: { url: true } },
          submissions: {
            select: { pages: { select: { url: true } } },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true,
          quizzes: true,
          resources: true,
          announcements: true,
          attendance: true,
        },
      },
    },
  });
  if (!classroom) fail("/teacher/classes", "Class not found.");
  if (confirmation !== classroom.name.trim())
    fail(
      "/teacher/classes",
      `Type “${classroom.name.trim()}” exactly to delete this class.`,
    );

  const storedFiles = new Set([
    ...classroom.resources.map((resource) => resource.url),
    ...classroom.assignments.flatMap((assignment) => [
      ...assignment.attachments.map((attachment) => attachment.url),
      ...assignment.submissions.flatMap((submission) =>
        submission.pages.map((page) => page.url),
      ),
    ]),
  ]);

  await db.$transaction([
    db.classRoom.delete({ where: { id: classroom.id } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Deleted class",
        entityType: "ClassRoom",
        entityId: classroom.id,
        metadata: {
          className: classroom.name,
          ...classroom._count,
        },
      },
    }),
  ]);

  const cleanup = await Promise.allSettled(
    [...storedFiles].map((url) => deleteStoredFile(url)),
  );
  const failedCleanup = cleanup.filter(
    (result) => result.status === "rejected",
  );
  if (failedCleanup.length)
    console.error(
      `[EduGrade] ${failedCleanup.length} stored class file(s) could not be removed after deleting class ${classroom.id}.`,
    );

  redirect("/teacher/classes?success=Class permanently deleted");
}

export async function regenerateClassCodeAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const classroom = await db.classRoom.findFirst({
    where: { id, teacherId: user.teacherProfile!.id },
    select: { id: true },
  });
  if (!classroom) fail("/teacher/classes", "Class not found.");
  const code = await uniqueClassCode();
  await db.$transaction([
    db.classRoom.update({ where: { id }, data: { code } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Regenerated class code",
        entityType: "ClassRoom",
        entityId: id,
      },
    }),
  ]);
  redirect(`/teacher/classes/${id}?success=New class code generated`);
}

export async function removeEnrollmentAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const classId = text(form, "classId");
  const enrollmentId = text(form, "enrollmentId");
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      id: enrollmentId,
      classId,
      class: { teacherId: user.teacherProfile!.id },
    },
    select: { id: true },
  });
  if (!enrollment) fail(`/teacher/classes/${classId}`, "Enrollment not found.");
  await db.$transaction([
    db.classEnrollment.delete({ where: { id: enrollment.id } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Removed student from class",
        entityType: "ClassEnrollment",
        entityId: enrollment.id,
      },
    }),
  ]);
  redirect(`/teacher/classes/${classId}?success=Student removed from class`);
}

export async function joinClassAction(form: FormData) {
  const user = await requireUser("STUDENT");
  const parsed = joinClassSchema.safeParse({ code: text(form, "code") });
  if (!parsed.success)
    fail(
      "/student/classes",
      parsed.error.issues[0]?.message ?? "Invalid class code.",
    );
  const classroom = await db.classRoom.findUnique({
    where: { code: parsed.data.code },
  });
  if (!classroom)
    fail("/student/classes", "No class was found with that code.");
  await db.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId: classroom.id,
        studentId: user.studentProfile!.id,
      },
    },
    update: {},
    create: { classId: classroom.id, studentId: user.studentProfile!.id },
  });
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: "Joined class",
      entityType: "ClassRoom",
      entityId: classroom.id,
    },
  });
  redirect(`/student/classes/${classroom.id}?success=You joined the class`);
}

export async function createAssignmentAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const parsed = assignmentSchema.safeParse({
    classId: text(form, "classId"),
    title: text(form, "title"),
    description: text(form, "description"),
    instructions: text(form, "instructions"),
    topic: text(form, "topic"),
    type: text(form, "type"),
    maxMarks: text(form, "maxMarks"),
    dueAt: text(form, "dueAt"),
    publish: form.get("publish") === "on",
  });
  if (!parsed.success)
    fail(
      "/teacher/assignments/new",
      parsed.error.issues[0]?.message ?? "Check the assignment details.",
    );
  const owns = await db.classRoom.findFirst({
    where: { id: parsed.data.classId, teacherId: user.teacherProfile!.id },
  });
  if (!owns)
    fail("/teacher/assignments/new", "You cannot add work to that class.");
  const file = form.get("attachment");
  let assignmentId = "";
  try {
    const assignment = await db.assignment.create({
      data: {
        classId: parsed.data.classId,
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        topic: parsed.data.topic,
        type: parsed.data.type,
        maxMarks: parsed.data.maxMarks,
        dueAt: parsed.data.dueAt,
        status: parsed.data.publish ? "PUBLISHED" : "DRAFT",
      },
    });
    assignmentId = assignment.id;
    if (file instanceof File && file.size) {
      validateFile(file);
      const url = await storeFile(file, "assignments");
      await db.assignmentAttachment.create({
        data: {
          assignmentId: assignment.id,
          name: file.name,
          url,
          mimeType: file.type,
          size: file.size,
        },
      });
    }
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: parsed.data.publish
          ? "Published assignment"
          : "Saved assignment draft",
        entityType: "Assignment",
        entityId: assignment.id,
      },
    });
  } catch (error) {
    fail("/teacher/assignments/new", messageOf(error));
  }
  redirect(`/teacher/assignments/${assignmentId}?success=Assignment saved`);
}

export async function publishAssignmentAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const assignment = await db.assignment.findFirst({
    where: {
      id,
      status: "DRAFT",
      class: { teacherId: user.teacherProfile!.id },
    },
  });
  if (!assignment)
    fail(
      "/teacher/assignments",
      "The assignment was not found or is already published.",
    );
  await db.assignment.update({ where: { id }, data: { status: "PUBLISHED" } });
  redirect(`/teacher/assignments/${id}?success=Assignment published`);
}

export async function updateAssignmentAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const parsed = assignmentSchema.safeParse({
    classId: text(form, "classId"),
    title: text(form, "title"),
    description: text(form, "description"),
    instructions: text(form, "instructions"),
    topic: text(form, "topic"),
    type: text(form, "type"),
    maxMarks: text(form, "maxMarks"),
    dueAt: text(form, "dueAt"),
    publish: false,
  });
  if (!parsed.success)
    fail(
      `/teacher/assignments/${id}/edit`,
      parsed.error.issues[0]?.message ?? "Check the assignment details.",
    );
  const assignment = await db.assignment.findFirst({
    where: {
      id,
      status: "DRAFT",
      class: { teacherId: user.teacherProfile!.id },
    },
    select: { id: true },
  });
  if (!assignment)
    fail(
      `/teacher/assignments/${id}`,
      "Only a draft assignment can be edited.",
    );
  const targetClass = await db.classRoom.findFirst({
    where: { id: parsed.data.classId, teacherId: user.teacherProfile!.id },
    select: { id: true },
  });
  if (!targetClass)
    fail(
      `/teacher/assignments/${id}/edit`,
      "You cannot move work to that class.",
    );
  await db.$transaction([
    db.assignment.update({
      where: { id },
      data: {
        classId: parsed.data.classId,
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        topic: parsed.data.topic,
        type: parsed.data.type,
        maxMarks: parsed.data.maxMarks,
        dueAt: parsed.data.dueAt,
      },
    }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Updated assignment draft",
        entityType: "Assignment",
        entityId: id,
      },
    }),
  ]);
  redirect(`/teacher/assignments/${id}?success=Assignment updated`);
}

export async function closeAssignmentAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const assignment = await db.assignment.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      class: { teacherId: user.teacherProfile!.id },
    },
    select: { id: true },
  });
  if (!assignment)
    fail(
      `/teacher/assignments/${id}`,
      "Only an open assignment can be closed.",
    );
  await db.$transaction([
    db.assignment.update({ where: { id }, data: { status: "CLOSED" } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Closed assignment",
        entityType: "Assignment",
        entityId: id,
      },
    }),
  ]);
  redirect(`/teacher/assignments/${id}?success=Assignment closed`);
}

export async function generateContentAction(form: FormData) {
  const user = await requireUser();
  if (user.role === "PARENT")
    fail("/parent", "AI generation is available in teacher and student workspaces.");
  const parsed = aiSchema.safeParse({
    type: text(form, "type"),
    topic: text(form, "topic"),
    subject: text(form, "subject"),
    grade: text(form, "grade") || "12",
    details: text(form, "details"),
  });
  const base =
    user.role === "TEACHER" ? "/teacher/ai-tools" : "/student/ai-help";
  if (!parsed.success)
    fail(base, parsed.error.issues[0]?.message ?? "Check your prompt.");
  if (
    user.role === "STUDENT" &&
    !["DOUBT_HELP", "REVISION_HELP", "EXPLANATION"].includes(parsed.data.type)
  )
    fail(base, "That tool is available to teachers only.");
  const generated = await generateAI({
    ...parsed.data,
    type: parsed.data.type as AIContentType,
    audience: user.role === "STUDENT" ? "student" : "teacher",
  });
  const record = await db.aIContentGeneration.create({
    data: {
      userId: user.id,
      type: parsed.data.type as AIContentType,
      prompt: {
        topic: parsed.data.topic,
        subject: parsed.data.subject,
        grade: parsed.data.grade,
        details: parsed.data.details,
      },
      output: generated.content,
      provider: generated.provider,
    },
  });
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: "Generated AI suggestion",
      entityType: "AIContentGeneration",
      entityId: record.id,
    },
  });
  redirect(`${base}?generation=${record.id}`);
}

export async function saveGeneratedContentAction(form: FormData) {
  const user = await requireUser();
  if (user.role === "PARENT")
    fail("/parent", "AI generation is available in teacher and student workspaces.");
  const parsed = generatedContentSchema.safeParse({
    id: text(form, "id"),
    output: text(form, "output"),
    approved: form.get("approved") === "on",
  });
  const base =
    user.role === "TEACHER" ? "/teacher/ai-tools" : "/student/ai-help";
  if (!parsed.success)
    fail(
      base,
      parsed.error.issues[0]?.message ?? "Check the generated content.",
    );
  const { id, output, approved } = parsed.data;
  const record = await db.aIContentGeneration.findFirst({
    where: { id, userId: user.id },
  });
  if (!record) fail(base, "Content not found.");
  await db.aIContentGeneration.update({
    where: { id },
    data: { output, approved },
  });
  revalidatePath(base);
  const successMessage =
    user.role === "TEACHER" ? "AI draft saved" : "Notes saved";
  redirect(
    `${base}?generation=${encodeURIComponent(id)}&success=${encodeURIComponent(successMessage)}`,
  );
}

export async function createAnnouncementAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const parsed = announcementSchema.safeParse({
    classId: text(form, "classId"),
    title: text(form, "title"),
    content: text(form, "content"),
  });
  if (!parsed.success)
    fail(
      "/teacher/announcements",
      parsed.error.issues[0]?.message ?? "Check the announcement.",
    );
  const owns = await db.classRoom.findFirst({
    where: { id: parsed.data.classId, teacherId: user.teacherProfile!.id },
  });
  if (!owns) fail("/teacher/announcements", "Class not found.");
  await db.announcement.create({ data: { ...parsed.data, authorId: user.id } });
  redirect("/teacher/announcements?success=Announcement sent");
}

export async function deleteAnnouncementAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const announcement = await db.announcement.findFirst({
    where: { id, class: { teacherId: user.teacherProfile!.id } },
    select: { id: true },
  });
  if (!announcement) fail("/teacher/announcements", "Announcement not found.");
  await db.$transaction([
    db.announcement.delete({ where: { id } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Deleted announcement",
        entityType: "Announcement",
        entityId: id,
      },
    }),
  ]);
  redirect("/teacher/announcements?success=Announcement deleted");
}

export async function uploadResourceAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const parsed = resourceSchema.safeParse({
    classId: text(form, "classId"),
    title: text(form, "title"),
    description: text(form, "description"),
    type: text(form, "type"),
  });
  if (!parsed.success)
    fail(
      "/teacher/resources",
      parsed.error.issues[0]?.message ?? "Check the resource details.",
    );
  const file = form.get("file");
  if (!(file instanceof File))
    fail("/teacher/resources", "Select a file to upload.");
  const owns = await db.classRoom.findFirst({
    where: { id: parsed.data.classId, teacherId: user.teacherProfile!.id },
  });
  if (!owns) fail("/teacher/resources", "Class not found.");
  try {
    validateFile(file);
    const url = await storeFile(file, "resources");
    await db.resource.create({
      data: { ...parsed.data, url, mimeType: file.type, size: file.size },
    });
  } catch (error) {
    fail("/teacher/resources", messageOf(error));
  }
  redirect("/teacher/resources?success=Resource uploaded");
}

export async function deleteResourceAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = text(form, "id");
  const resource = await db.resource.findFirst({
    where: { id, class: { teacherId: user.teacherProfile!.id } },
    select: { id: true, url: true },
  });
  if (!resource) fail("/teacher/resources", "Resource not found.");
  try {
    await deleteStoredFile(resource.url);
    await db.$transaction([
      db.resource.delete({ where: { id } }),
      db.activityLog.create({
        data: {
          userId: user.id,
          action: "Deleted resource",
          entityType: "Resource",
          entityId: id,
        },
      }),
    ]);
  } catch (error) {
    fail("/teacher/resources", messageOf(error));
  }
  redirect("/teacher/resources?success=Resource deleted");
}

export async function submitWorkAction(form: FormData) {
  const user = await requireUser("STUDENT");
  const assignmentId = text(form, "assignmentId");
  const noteResult = submissionNoteSchema.safeParse(text(form, "note"));
  if (!noteResult.success)
    return {
      ok: false as const,
      error:
        noteResult.error.issues[0]?.message ?? "Check the submission note.",
    };
  const note = noteResult.data;
  const assignment = await db.assignment.findFirst({
    where: {
      id: assignmentId,
      status: "PUBLISHED",
      class: { enrollments: { some: { studentId: user.studentProfile!.id } } },
    },
    include: {
      submissions: {
        where: { studentId: user.studentProfile!.id },
        select: { status: true },
        take: 1,
      },
    },
  });
  if (!assignment)
    return { ok: false as const, error: "Assignment not found." };
  if (assignment.submissions[0] && assignment.submissions[0].status !== "DRAFT")
    return {
      ok: false as const,
      error:
        "This submission is already with your teacher and cannot be replaced.",
    };
  let rawPages: unknown;
  try {
    rawPages = JSON.parse(text(form, "pagesJson"));
  } catch {
    return {
      ok: false as const,
      error: "The uploaded-page list is invalid.",
    };
  }
  const pagesResult = uploadedPagesSchema.safeParse(rawPages);
  if (!pagesResult.success)
    return {
      ok: false as const,
      error:
        pagesResult.error.issues[0]?.message ??
        "Check the uploaded answer pages.",
    };
  try {
    const uploaded: Array<{
      pageNumber: number;
      name: string;
      url: string;
      mimeType: string;
      size: number;
    }> = [];
    for (const page of pagesResult.data) {
      const metadata = await verifyPrivateUpload(
        page.url,
        `submissions/${assignmentId}/`,
        true,
      );
      uploaded.push({
        pageNumber: page.pageNumber,
        name: page.name.replace(/[^a-zA-Z0-9._ -]/g, "-").slice(0, 255),
        url: metadata.url,
        mimeType: metadata.contentType,
        size: metadata.size,
      });
    }
    await db.$transaction(async (tx) => {
      const existing = await tx.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: user.studentProfile!.id,
          },
        },
        select: { id: true },
      });
      let submissionId: string;
      if (existing) {
        const claimed = await tx.submission.updateMany({
          where: { id: existing.id, status: "DRAFT" },
          data: { note, status: "SUBMITTED", submittedAt: new Date() },
        });
        if (claimed.count !== 1)
          throw new Error(
            "This submission is already with your teacher and cannot be replaced.",
          );
        submissionId = existing.id;
      } else {
        const created = await tx.submission.create({
          data: {
            assignmentId,
            studentId: user.studentProfile!.id,
            note,
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
          select: { id: true },
        });
        submissionId = created.id;
      }
      await tx.submissionPage.deleteMany({ where: { submissionId } });
      await tx.submissionPage.createMany({
        data: uploaded.map((page) => ({ ...page, submissionId })),
      });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "Submitted answer pages",
          entityType: "Submission",
          entityId: submissionId,
          metadata: { pageCount: uploaded.length },
        },
      });
    });
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
  return { ok: true as const };
}

export async function generateFeedbackAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const submissionId = text(form, "submissionId");
  const submission = await db.submission.findFirst({
    where: {
      id: submissionId,
      assignment: { class: { teacherId: user.teacherProfile!.id } },
    },
    include: {
      assignment: { include: { class: true } },
    },
  });
  if (!submission) fail("/teacher/review", "Submission not found.");
  const generated = await generateAI({
    type: "FEEDBACK",
    topic: submission.assignment.topic ?? submission.assignment.title,
    subject: submission.assignment.class.subject,
    grade: submission.assignment.class.grade,
    audience: "teacher",
    details:
      "Use supportive, specific language. Do not decide marks or infer personal learner information.",
  });
  await db.feedback.create({
    data: { submissionId, content: generated.content, isAiSuggested: true },
  });
  revalidatePath(`/teacher/review/${submissionId}`);
}

export async function saveReviewAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const submissionId = text(form, "submissionId");
  const submission = await db.submission.findFirst({
    where: {
      id: submissionId,
      assignment: { class: { teacherId: user.teacherProfile!.id } },
    },
    include: { assignment: { select: { maxMarks: true } } },
  });
  if (!submission) fail("/teacher/review", "Submission not found.");
  const parsed = reviewSchema.safeParse({
    submissionId,
    marks: text(form, "marks"),
    maxMarks: submission.assignment.maxMarks,
    feedback: text(form, "feedback"),
    publish: form.get("publish") === "on",
  });
  if (!parsed.success)
    fail(
      `/teacher/review/${text(form, "submissionId")}`,
      parsed.error.issues[0]?.message ?? "Check the review.",
    );
  const pendingSuggestion = await db.feedback.findFirst({
    where: {
      submissionId: submission.id,
      isAiSuggested: true,
      approved: false,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const feedbackWrite = pendingSuggestion
    ? db.feedback.updateMany({
        where: {
          submissionId: submission.id,
          isAiSuggested: true,
          approved: false,
        },
        data: { content: parsed.data.feedback, approved: true },
      })
    : db.feedback.create({
        data: {
          submissionId: submission.id,
          content: parsed.data.feedback,
          approved: true,
        },
      });
  await db.$transaction([
    db.result.upsert({
      where: { submissionId: submission.id },
      update: {
        marks: parsed.data.marks,
        published: parsed.data.publish,
        publishedAt: parsed.data.publish ? new Date() : null,
      },
      create: {
        submissionId: submission.id,
        marks: parsed.data.marks,
        published: parsed.data.publish,
        publishedAt: parsed.data.publish ? new Date() : null,
      },
    }),
    feedbackWrite,
    db.submission.update({
      where: { id: submission.id },
      data: { status: parsed.data.publish ? "PUBLISHED" : "REVIEWED" },
    }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: parsed.data.publish ? "Published result" : "Saved review",
        entityType: "Submission",
        entityId: submission.id,
      },
    }),
  ]);
  redirect(
    `/teacher/review/${submission.id}?success=${parsed.data.publish ? "Result published" : "Review saved"}`,
  );
}

export async function markAttendanceAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const classId = text(form, "classId");
  const dateResult = attendanceDateSchema.safeParse(text(form, "date"));
  if (!dateResult.success)
    fail(
      "/teacher/attendance",
      dateResult.error.issues[0]?.message ?? "Enter a valid date.",
    );
  const date = dateResult.data;
  const classroom = await db.classRoom.findFirst({
    where: { id: classId, teacherId: user.teacherProfile!.id },
    include: { enrollments: true },
  });
  if (!classroom) fail("/teacher/attendance", "Class not found.");
  const records = classroom.enrollments.map((e) => ({
    studentId: e.studentId,
    status: attendanceStatusSchema.safeParse(
      text(form, `status-${e.studentId}`),
    ),
  }));
  const invalid = records.find((record) => !record.status.success);
  if (invalid) fail("/teacher/attendance", "An attendance status is invalid.");
  await db.$transaction(
    records.map((record) =>
      db.attendanceRecord.upsert({
        where: {
          classId_studentId_date: {
            classId,
            studentId: record.studentId,
            date,
          },
        },
        update: { status: record.status.data! },
        create: {
          classId,
          studentId: record.studentId,
          date,
          status: record.status.data!,
        },
      }),
    ),
  );
  redirect("/teacher/attendance?success=Attendance saved");
}

export async function submitQuizAction(form: FormData) {
  const user = await requireUser("STUDENT");
  const quizId = text(form, "quizId");
  const lockdownViolations = Math.min(
    100,
    Math.max(0, Number.parseInt(text(form, "lockdownViolations"), 10) || 0),
  );
  const quiz = await db.quiz.findFirst({
    where: {
      id: quizId,
      published: true,
      class: { enrollments: { some: { studentId: user.studentProfile!.id } } },
    },
    include: { questions: true },
  });
  if (!quiz) fail("/student/quizzes", "Quiz not found.");
  const answers: Record<string, string> = {};
  let score = 0;
  let max = 0;
  for (const question of quiz.questions) {
    const answer = text(form, `answer-${question.id}`);
    if (!answer)
      fail(
        `/student/quizzes/${quiz.id}`,
        "Answer every question before submitting.",
      );
    const options = Array.isArray(question.options)
      ? question.options.filter(
          (option): option is string => typeof option === "string",
        )
      : [];
    if (!options.includes(answer))
      fail(`/student/quizzes/${quiz.id}`, "One quiz answer is invalid.");
    answers[question.id] = answer;
    max += question.marks;
    if (answer === question.correctAnswer) score += question.marks;
  }
  const attempt = await db.quizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId: user.studentProfile!.id,
      answers,
      score,
    },
  });
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: "Completed quiz",
      entityType: "QuizAttempt",
      entityId: attempt.id,
      metadata: { score, max, lockdownViolations },
    },
  });
  redirect(`/student/quizzes/${quiz.id}?attempt=${attempt.id}`);
}
