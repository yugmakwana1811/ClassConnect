import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import {
  buildDemoSubmissions,
  DEMO_ASSIGNMENTS,
  DEMO_CLASSES,
  DEMO_QUIZZES,
  DEMO_RESOURCES,
  DEMO_STUDENTS,
} from "../src/lib/demo-catalog";

loadEnvConfig(process.cwd());

const db = new PrismaClient();

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const studentProfiles = await db.studentProfile.findMany({
    where: { id: { in: DEMO_STUDENTS.map((student) => student.profileId) } },
    include: {
      user: true,
      enrollments: { where: { classId: { in: DEMO_CLASSES.map((item) => item.id) } } },
    },
  });
  invariant(studentProfiles.length === DEMO_STUDENTS.length, "Expected all six demo students.");
  for (const student of studentProfiles)
    invariant(
      student.enrollments.length === DEMO_CLASSES.length,
      `${student.user.name} is not enrolled once in every Commerce subject class.`,
    );

  const [assignments, quizzes, resources, submissions] = await Promise.all([
    db.assignment.findMany({
      where: { id: { in: DEMO_ASSIGNMENTS.map((item) => item.id) } },
      include: { attachments: true },
    }),
    db.quiz.findMany({
      where: { id: { in: DEMO_QUIZZES.map((item) => item.id) } },
      include: { questions: true, attempts: true },
    }),
    db.resource.findMany({
      where: { id: { in: DEMO_RESOURCES.map((item) => item.id) } },
    }),
    db.submission.findMany({
      where: { id: { in: buildDemoSubmissions().map((item) => item.id) } },
      include: { assignment: true, result: true, pages: true, feedback: true },
    }),
  ]);
  invariant(assignments.length === DEMO_ASSIGNMENTS.length, "Assessment fixture count is incorrect.");
  invariant(quizzes.length === DEMO_QUIZZES.length, "Quiz fixture count is incorrect.");
  invariant(resources.length === DEMO_RESOURCES.length, "Resource fixture count is incorrect.");
  invariant(submissions.length === buildDemoSubmissions().length, "Submission fixture count is incorrect.");
  invariant(assignments.every((item) => item.attachments.length === 1), "Every demo assessment needs one PDF attachment.");
  invariant(quizzes.every((item) => item.questions.length === 4), "Every demo quiz needs four valid questions.");

  for (const submission of submissions) {
    invariant(submission.pages.length >= 1, `${submission.id} has no answer page.`);
    if (submission.status === "DRAFT")
      invariant(submission.submittedAt === null, `${submission.id} draft has a submitted timestamp.`);
    else invariant(submission.submittedAt !== null, `${submission.id} is missing a submitted timestamp.`);
    if (submission.result) {
      invariant(Number(submission.result.marks) >= 0, `${submission.id} has negative marks.`);
      invariant(
        Number(submission.result.marks) <= submission.assignment.maxMarks,
        `${submission.id} exceeds maximum marks.`,
      );
      invariant(
        submission.result.published === (submission.status === "PUBLISHED"),
        `${submission.id} result publication and workflow status disagree.`,
      );
    }
  }

  const published = submissions.filter((item) => item.result?.published);
  const classAverage = published.length
    ? Math.round(
        published.reduce(
          (sum, item) => sum + (Number(item.result!.marks) / item.assignment.maxMarks) * 100,
          0,
        ) / published.length,
      )
    : 0;
  invariant(classAverage > 0 && classAverage <= 100, "Analytics average is not derived from valid results.");

  console.log(
    JSON.stringify(
      {
        students: studentProfiles.length,
        subjectEnrollments: studentProfiles.reduce((sum, item) => sum + item.enrollments.length, 0),
        assignments: assignments.length,
        quizzes: quizzes.length,
        resources: resources.length,
        submissions: submissions.length,
        publishedResults: published.length,
        classAverage,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
