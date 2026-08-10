"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { quizSchema } from "@/lib/validation";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}
function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function revalidateQuizWorkspaces() {
  revalidatePath("/teacher", "layout");
  revalidatePath("/student", "layout");
}

export async function createQuizAction(form: FormData) {
  const user = await requireUser("TEACHER");
  let questions: unknown = null;
  try {
    questions = JSON.parse(value(form, "questions"));
  } catch {
    fail("/teacher/quizzes/new", "The quiz questions could not be read.");
  }
  const rawTimeLimit = value(form, "timeLimit").trim();
  const parsed = quizSchema.safeParse({
    classId: value(form, "classId"),
    title: value(form, "title"),
    description: value(form, "description"),
    timeLimit: rawTimeLimit ? rawTimeLimit : undefined,
    publish: form.get("publish") === "on",
    questions,
  });
  if (!parsed.success)
    fail(
      "/teacher/quizzes/new",
      parsed.error.issues[0]?.message ?? "Check the quiz details.",
    );
  const classroom = await db.classRoom.findFirst({
    where: { id: parsed.data.classId, teacherId: user.teacherProfile!.id },
    select: { id: true },
  });
  if (!classroom)
    fail("/teacher/quizzes/new", "You cannot create a quiz for that class.");
  const quiz = await db.$transaction(async (tx) => {
    const created = await tx.quiz.create({
      data: {
        classId: parsed.data.classId,
        title: parsed.data.title,
        description: parsed.data.description,
        timeLimit: parsed.data.timeLimit,
        published: parsed.data.publish,
        questions: {
          create: parsed.data.questions.map((question, order) => ({
            ...question,
            order,
          })),
        },
      },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: parsed.data.publish
          ? "Created and published quiz"
          : "Created quiz draft",
        entityType: "Quiz",
        entityId: created.id,
        metadata: { questionCount: parsed.data.questions.length },
      },
    });
    return created;
  });
  revalidateQuizWorkspaces();
  redirect(`/teacher/quizzes/${quiz.id}?success=Quiz saved`);
}

export async function publishQuizAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = value(form, "id");
  const quiz = await db.quiz.findFirst({
    where: {
      id,
      published: false,
      class: { teacherId: user.teacherProfile!.id },
    },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz) fail("/teacher/quizzes", "Quiz not found or already published.");
  if (!quiz._count.questions)
    fail(
      `/teacher/quizzes/${id}`,
      "Add at least one question before publishing.",
    );
  await db.$transaction([
    db.quiz.update({ where: { id }, data: { published: true } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Published quiz",
        entityType: "Quiz",
        entityId: id,
      },
    }),
  ]);
  revalidateQuizWorkspaces();
  redirect(`/teacher/quizzes/${id}?success=Quiz published`);
}

export async function deleteQuizAction(form: FormData) {
  const user = await requireUser("TEACHER");
  const id = value(form, "id");
  const quiz = await db.quiz.findFirst({
    where: {
      id,
      published: false,
      class: { teacherId: user.teacherProfile!.id },
    },
    include: { _count: { select: { attempts: true } } },
  });
  if (!quiz)
    fail("/teacher/quizzes", "Only an unpublished quiz draft can be deleted.");
  if (quiz._count.attempts)
    fail(
      `/teacher/quizzes/${id}`,
      "A quiz with learner attempts cannot be deleted.",
    );
  await db.$transaction([
    db.quiz.delete({ where: { id } }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "Deleted quiz draft",
        entityType: "Quiz",
        entityId: id,
      },
    }),
  ]);
  revalidateQuizWorkspaces();
  redirect("/teacher/quizzes?success=Quiz draft deleted");
}
