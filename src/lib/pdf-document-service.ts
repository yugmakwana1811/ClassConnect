import "server-only";

import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import {
  demoAssignmentById,
  demoQuizById,
  demoResourceById,
  DEMO_SCHOOL,
} from "@/lib/demo-catalog";
import {
  AcademicPdfDocument,
  generateAcademicPdf,
  PdfQuestion,
} from "@/lib/pdf-generator";
import { pdfFilenameForDocument } from "@/lib/pdf-filenames";
import {
  canRequestPdfVariant,
  studentCanAccessReport,
} from "@/lib/pdf-access";

export type PdfViewer = {
  id: string;
  role: Role;
  teacherProfileId?: string;
  studentProfileId?: string;
  parentProfileId?: string;
};

export type ProtectedPdfKind =
  | "assignment"
  | "quiz"
  | "resource"
  | "submission"
  | "report";

export class PdfAccessError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 404,
  ) {
    super(message);
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function date(value?: Date | string | null) {
  return value ? dateFormatter.format(new Date(value)) : undefined;
}

function friendlySubmissionStatus(
  status: string,
  submittedAt: Date | null,
  dueAt: Date,
) {
  if (status === "DRAFT") return "In Progress";
  if (status === "SUBMITTED")
    return submittedAt && submittedAt > dueAt
      ? "Submitted Late - Awaiting Review"
      : "Submitted - Awaiting Review";
  if (status === "REVIEWED") return "Graded - Feedback Private";
  if (status === "PUBLISHED") return "Feedback Published";
  return status;
}

function assignmentSections(
  assignmentId: string,
  description: string,
  instructions: string | null,
  maxMarks: number,
) {
  const fixture = demoAssignmentById(assignmentId);
  if (fixture)
    return [
      {
        heading: fixture.type === "Test" ? "Section A" : "Questions and tasks",
        questions: fixture.questions.map((question) => ({
          ...question,
          answerLines: Math.min(6, Math.max(2, Math.ceil(question.marks / 2))),
        })),
      },
    ];
  return [
    {
      heading: "Assignment brief",
      body: [description, instructions || "Complete the task using the class guidance provided."],
      questions: [
        {
          prompt: "Complete the assigned work and attach your response using the required format.",
          marks: maxMarks,
          answerLines: 6,
        },
      ],
    },
  ];
}

async function assignmentPdf(
  id: string,
  viewer: PdfViewer,
  variant: AcademicPdfDocument["variant"],
) {
  if (!canRequestPdfVariant(viewer.role, variant))
    throw new PdfAccessError("Teacher material is not available to this account.", 403);
  const assignment = await db.assignment.findFirst({
    where: {
      id,
      ...(viewer.role === "TEACHER"
        ? { class: { teacherId: viewer.teacherProfileId } }
        : viewer.role === "STUDENT"
          ? {
              status: { in: ["PUBLISHED", "CLOSED"] },
              class: {
                enrollments: { some: { studentId: viewer.studentProfileId } },
              },
            }
          : { id: "__parents-cannot-open-assignment-pdfs__" }),
    },
    include: { class: true },
  });
  if (!assignment) throw new PdfAccessError("Assessment PDF not found.", 404);
  const fixture = demoAssignmentById(id);
  const document: AcademicPdfDocument = {
    title: assignment.title,
    subtitle: assignment.description,
    documentType: assignment.type,
    school: DEMO_SCHOOL,
    className: assignment.class.name,
    subject: assignment.class.subject,
    topic: assignment.topic ?? assignment.title,
    date: date(fixture?.issuedAt ?? assignment.createdAt),
    dueDate: date(assignment.dueAt),
    durationMinutes:
      assignment.type === "Test" ? fixture?.durationMinutes : undefined,
    estimatedMinutes:
      assignment.type !== "Test" ? fixture?.durationMinutes : undefined,
    maxMarks: assignment.maxMarks,
    objective: fixture?.objective ?? assignment.description,
    instructions:
      fixture?.generalInstructions ??
      [assignment.instructions || "Complete every task and show relevant working."],
    sections: assignmentSections(
      assignment.id,
      assignment.description,
      assignment.instructions,
      assignment.maxMarks,
    ),
    rubric: fixture?.rubric,
    teacherNote: fixture?.teacherNote,
    variant,
  };
  return {
    bytes: await generateAcademicPdf(document),
    filename: pdfFilenameForDocument(`assignment:${id}`, assignment.title),
    title: assignment.title,
  };
}

async function quizPdf(
  id: string,
  viewer: PdfViewer,
  variant: AcademicPdfDocument["variant"],
) {
  if (!canRequestPdfVariant(viewer.role, variant))
    throw new PdfAccessError("Quiz answer keys are teacher-only.", 403);
  const quiz = await db.quiz.findFirst({
    where: {
      id,
      ...(viewer.role === "TEACHER"
        ? { class: { teacherId: viewer.teacherProfileId } }
        : viewer.role === "STUDENT"
          ? {
              published: true,
              class: {
                enrollments: { some: { studentId: viewer.studentProfileId } },
              },
            }
          : { id: "__parents-cannot-open-quiz-pdfs__" }),
    },
    include: { class: true, questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) throw new PdfAccessError("Quiz PDF not found.", 404);
  const fixture = demoQuizById(id);
  const questions: PdfQuestion[] = quiz.questions.map((question) => ({
    prompt: question.prompt,
    marks: question.marks,
    options: Array.isArray(question.options)
      ? question.options.filter((option): option is string => typeof option === "string")
      : [],
    answer: question.correctAnswer,
    explanation: question.explanation ?? undefined,
  }));
  const document: AcademicPdfDocument = {
    title: quiz.title,
    subtitle: quiz.description ?? "Printable concept check",
    documentType: variant === "teacher" ? "Quiz answer key" : "Printable quiz",
    className: quiz.class.name,
    subject: quiz.class.subject,
    topic: fixture?.topic,
    date: date(quiz.createdAt),
    durationMinutes: quiz.timeLimit ?? undefined,
    maxMarks: questions.reduce((sum, question) => sum + question.marks, 0),
    objective: quiz.description ?? "Check understanding of the current unit.",
    instructions: [
      "Choose the best answer for every question.",
      "Do not consult the answer key while attempting the student version.",
      "Write your name and roll number before beginning.",
    ],
    sections: [{ heading: "Questions", questions }],
    variant,
  };
  return {
    bytes: await generateAcademicPdf(document),
    filename: pdfFilenameForDocument(`quiz:${id}`, quiz.title),
    title: quiz.title,
  };
}

async function resourcePdf(id: string, viewer: PdfViewer) {
  const resource = await db.resource.findFirst({
    where: {
      id,
      ...(viewer.role === "TEACHER"
        ? { class: { teacherId: viewer.teacherProfileId } }
        : viewer.role === "STUDENT"
          ? {
              class: {
                enrollments: { some: { studentId: viewer.studentProfileId } },
              },
            }
          : { id: "__parents-cannot-open-resource-pdfs__" }),
    },
    include: { class: true },
  });
  if (!resource) throw new PdfAccessError("Resource PDF not found.", 404);
  const fixture = demoResourceById(id);
  const document: AcademicPdfDocument = {
    title: resource.title,
    subtitle: resource.description ?? undefined,
    documentType: resource.type,
    className: resource.class.name,
    subject: resource.class.subject,
    date: date(resource.createdAt),
    objective: resource.description ?? "Support independent review and practice.",
    instructions: ["Use this sheet with your own class notes.", "Attempt each prompt before checking worked examples."],
    sections:
      fixture?.sections ?? [
        {
          heading: "Resource notes",
          body: [resource.description ?? "Teacher-provided learning resource."],
        },
      ],
    variant: "student",
  };
  return {
    bytes: await generateAcademicPdf(document),
    filename: pdfFilenameForDocument(`resource:${id}`, resource.title),
    title: resource.title,
  };
}

async function submissionPdf(id: string, viewer: PdfViewer) {
  const submission = await db.submission.findFirst({
    where: {
      id,
      ...(viewer.role === "TEACHER"
        ? { assignment: { class: { teacherId: viewer.teacherProfileId } } }
        : viewer.role === "STUDENT"
          ? { studentId: viewer.studentProfileId }
          : { id: "__parents-cannot-open-submission-pdfs__" }),
    },
    include: {
      assignment: { include: { class: true } },
      student: { include: { user: true } },
      pages: true,
      result: true,
      feedback: { where: { approved: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!submission) throw new PdfAccessError("Submission PDF not found.", 404);
  const canSeeResult =
    viewer.role === "TEACHER" || Boolean(submission.result?.published);
  const sections = [
    {
      heading: "Submission summary",
      body: [
        `Student: ${submission.student.user.name} (${submission.student.rollNumber ?? "Roll number not set"})`,
        `Status: ${friendlySubmissionStatus(submission.status, submission.submittedAt, submission.assignment.dueAt)}`,
        `Submitted: ${date(submission.submittedAt) ?? "Work in progress"}`,
        `Answer pages: ${submission.pages.length}`,
        submission.note || "No student note was added.",
      ],
    },
    ...(canSeeResult && submission.result
      ? [
          {
            heading: "Result and feedback",
            body: [
              `Marks: ${Number(submission.result.marks)} / ${submission.assignment.maxMarks}`,
              submission.feedback[0]?.content ?? submission.result.teacherNote ?? "No feedback has been published.",
            ],
          },
        ]
      : []),
  ];
  const document: AcademicPdfDocument = {
    title: `${submission.assignment.title} - ${submission.student.user.name}`,
    documentType: "Student submission",
    className: submission.assignment.class.name,
    subject: submission.assignment.class.subject,
    topic: submission.assignment.topic ?? undefined,
    dueDate: date(submission.assignment.dueAt),
    maxMarks: submission.assignment.maxMarks,
    sections,
    variant: viewer.role === "TEACHER" ? "teacher" : "student",
  };
  return {
    bytes: await generateAcademicPdf(document),
    filename: pdfFilenameForDocument(
      `submission:${id}`,
      `${submission.assignment.title} ${submission.student.user.name}`,
    ),
    title: document.title,
  };
}

async function reportPdf(id: string, viewer: PdfViewer) {
  if (
    viewer.role === "STUDENT" &&
    !studentCanAccessReport(id, viewer.studentProfileId)
  )
    throw new PdfAccessError("Student report not found.", 404);
  const student = await db.studentProfile.findFirst({
    where: {
      id,
      ...(viewer.role === "TEACHER"
        ? { enrollments: { some: { class: { teacherId: viewer.teacherProfileId } } } }
        : viewer.role === "STUDENT"
          ? {}
          : viewer.role === "PARENT"
            ? { parents: { some: { parentId: viewer.parentProfileId } } }
            : { id: "__unknown-viewer__" }),
    },
    include: {
      user: true,
      enrollments: { include: { class: true } },
      submissions: {
        include: {
          assignment: true,
          result: true,
          feedback: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { submittedAt: "desc" },
      },
      quizAttempts: { include: { quiz: { include: { questions: true } } } },
      attendance: true,
    },
  });
  if (!student) throw new PdfAccessError("Student report not found.", 404);
  const expectedAssignments = await db.assignment.count({
    where: {
      status: { not: "DRAFT" },
      class: { enrollments: { some: { studentId: student.id } } },
    },
  });
  const completedAssignments = student.submissions.filter(
    (item) => item.assignment.status !== "DRAFT" && item.status !== "DRAFT",
  ).length;
  const completionRate = expectedAssignments
    ? Math.round((completedAssignments / expectedAssignments) * 100)
    : 0;
  const published = student.submissions.filter((item) => item.result?.published);
  const assessmentAverage = published.length
    ? Math.round(
        published.reduce(
          (sum, item) => sum + (Number(item.result!.marks) / item.assignment.maxMarks) * 100,
          0,
        ) / published.length,
      )
    : 0;
  const quizMaximum = student.quizAttempts.reduce(
    (sum, attempt) =>
      sum + attempt.quiz.questions.reduce((inner, question) => inner + question.marks, 0),
    0,
  );
  const quizScore = student.quizAttempts.reduce(
    (sum, attempt) => sum + Number(attempt.score),
    0,
  );
  const attendanceRate = student.attendance.length
    ? Math.round(
        (student.attendance.filter((item) =>
          ["PRESENT", "LATE"].includes(item.status),
        ).length /
          student.attendance.length) *
          100,
      )
    : 0;
  const sections = [
    {
      heading: "Progress snapshot",
      body: [
        `Published assessment average: ${published.length ? `${assessmentAverage}%` : "No published results"}`,
        `Assignment completion: ${completedAssignments} of ${expectedAssignments} assigned (${completionRate}%)`,
        `Quiz performance: ${quizMaximum ? `${Math.round((quizScore / quizMaximum) * 100)}% across ${student.quizAttempts.length} attempts` : "No quiz attempts"}`,
        `Attendance: ${student.attendance.length ? `${attendanceRate}% across ${student.attendance.length} records` : "No attendance records"}`,
      ],
    },
    {
      heading: "Recent assessed work",
      body: published.slice(0, 10).map(
        (item) =>
          `${item.assignment.title}: ${Number(item.result!.marks)} / ${item.assignment.maxMarks}${item.feedback[0] ? ` - ${item.feedback[0].content}` : ""}`,
      ),
    },
    {
      heading: "Enrolled subjects",
      body: student.enrollments.map(
        (item) => `${item.class.subject} - ${item.class.name}`,
      ),
    },
  ];
  const document: AcademicPdfDocument = {
    title: `${student.user.name} - Progress Report`,
    subtitle: `${student.rollNumber ?? "Class 12 learner"} | Evidence from live ClassConnect records`,
    documentType: "Student progress report",
    school: student.school ?? DEMO_SCHOOL,
    className: "Class 12 Commerce",
    subject: "Commerce programme",
    date: date(new Date()),
    sections,
    teacherNote:
      "Discuss trends with the learner and use classroom evidence before deciding support actions.",
    variant: viewer.role === "TEACHER" ? "teacher" : "student",
  };
  return {
    bytes: await generateAcademicPdf(document),
    filename: pdfFilenameForDocument(`report:${id}`, `${student.user.name} Progress Report`),
    title: document.title,
  };
}

export async function buildProtectedPdf(
  kind: ProtectedPdfKind,
  id: string,
  viewer: PdfViewer,
  requestedVariant: "student" | "teacher",
) {
  if (kind === "assignment") return assignmentPdf(id, viewer, requestedVariant);
  if (kind === "quiz") return quizPdf(id, viewer, requestedVariant);
  if (kind === "resource") return resourcePdf(id, viewer);
  if (kind === "submission") return submissionPdf(id, viewer);
  if (kind === "report") return reportPdf(id, viewer);
  throw new PdfAccessError("Unknown PDF type.", 404);
}
