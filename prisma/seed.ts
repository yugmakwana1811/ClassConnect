import {
  AIContentType,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import {
  buildDemoAttendance,
  buildDemoSubmissions,
  demoQuizAttempts,
  demoQuizQuestionId,
  DEMO_ASSIGNMENTS,
  DEMO_CLASSES,
  DEMO_GENERATED_PDF_PREFIX,
  DEMO_PASSWORD,
  DEMO_QUIZZES,
  DEMO_RESOURCES,
  DEMO_SCHOOL,
  DEMO_STUDENTS,
  DEMO_SUBMISSION_PAGE_PREFIX,
} from "../src/lib/demo-catalog";

loadEnvConfig(process.cwd());

const db = new PrismaClient();

const teacherUserId = "demo-teacher-user";
const teacherProfileId = "demo-teacher-profile";

async function seedUsers(passwordHash: string) {
  const teacher = await db.user.upsert({
    where: { email: "teacher@edugrade.ai" },
    update: {
      passwordHash,
      name: "Meera Sharma",
      role: Role.TEACHER,
    },
    create: {
      id: teacherUserId,
      email: "teacher@edugrade.ai",
      passwordHash,
      name: "Meera Sharma",
      role: Role.TEACHER,
    },
  });
  const teacherProfile = await db.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: { school: DEMO_SCHOOL, subject: "Commerce" },
    create: {
      id: teacherProfileId,
      userId: teacher.id,
      school: DEMO_SCHOOL,
      subject: "Commerce",
    },
  });

  const students = new Map<string, { userId: string; profileId: string }>();
  for (const student of DEMO_STUDENTS) {
    const user = await db.user.upsert({
      where: { email: student.email },
      update: {
        passwordHash,
        name: student.name,
        role: Role.STUDENT,
      },
      create: {
        id: student.userId,
        email: student.email,
        passwordHash,
        name: student.name,
        role: Role.STUDENT,
      },
    });
    const profile = await db.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        school: DEMO_SCHOOL,
        grade: "12",
        rollNumber: student.rollNumber,
        parentAccessCode: student.parentAccessCode,
      },
      create: {
        id: student.profileId,
        userId: user.id,
        school: DEMO_SCHOOL,
        grade: "12",
        rollNumber: student.rollNumber,
        parentAccessCode: student.parentAccessCode,
      },
    });
    students.set(student.key, { userId: user.id, profileId: profile.id });
  }

  const parent = await db.user.upsert({
    where: { email: "parent@edugrade.ai" },
    update: {
      passwordHash,
      name: "Kavita Mehta",
      role: Role.PARENT,
    },
    create: {
      id: "demo-parent-user",
      email: "parent@edugrade.ai",
      passwordHash,
      name: "Kavita Mehta",
      role: Role.PARENT,
    },
  });
  const parentProfile = await db.parentProfile.upsert({
    where: { userId: parent.id },
    update: { school: DEMO_SCHOOL },
    create: {
      id: "demo-parent-profile",
      userId: parent.id,
      school: DEMO_SCHOOL,
    },
  });
  await db.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parentProfile.id,
        studentId: students.get("arjun")!.profileId,
      },
    },
    update: { relationship: "Mother" },
    create: {
      id: "demo-parent-student",
      parentId: parentProfile.id,
      studentId: students.get("arjun")!.profileId,
      relationship: "Mother",
    },
  });
  return { teacher, teacherProfile, students };
}

async function seedClasses(
  teacherId: string,
  students: Map<string, { userId: string; profileId: string }>,
) {
  for (const classroom of DEMO_CLASSES) {
    const record = await db.classRoom.upsert({
      where: { code: classroom.code },
      update: {
        name: classroom.name,
        subject: classroom.subject,
        grade: "12",
        description: classroom.description,
        teacherId,
      },
      create: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        grade: "12",
        code: classroom.code,
        description: classroom.description,
        teacherId,
      },
    });
    for (const student of DEMO_STUDENTS) {
      await db.classEnrollment.upsert({
        where: {
          classId_studentId: {
            classId: record.id,
            studentId: students.get(student.key)!.profileId,
          },
        },
        update: {},
        create: {
          id: `demo-enrollment-${classroom.code.toLowerCase()}-${student.key}`,
          classId: record.id,
          studentId: students.get(student.key)!.profileId,
          joinedAt: new Date("2026-06-15T03:30:00.000Z"),
        },
      });
    }
  }
}

async function removeSupersededFixtures() {
  await db.assignment.deleteMany({
    where: {
      id: {
        in: [
          "demo-assignment",
          "review-assignment-partnership-test",
          "review-assignment-cash-flow",
          "review-assignment-goodwill",
        ],
      },
    },
  });
  await db.quiz.deleteMany({
    where: {
      id: { in: ["review-quiz-accounting-concepts"] },
    },
  });
  await db.resource.deleteMany({
    where: {
      classId: "demo-class",
      title: {
        in: [
          "Partnership Fundamentals - Quick Notes",
          "Partnership Fundamentals — Quick Notes",
          "Goodwill Adjustment Practice",
        ],
      },
    },
  });
}

async function seedAssignments() {
  for (const assignment of DEMO_ASSIGNMENTS) {
    await db.assignment.upsert({
      where: { id: assignment.id },
      update: {
        classId: assignment.classId,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        type: assignment.type,
        maxMarks: assignment.maxMarks,
        dueAt: new Date(assignment.dueAt),
        status: assignment.status,
        topic: assignment.topic,
      },
      create: {
        id: assignment.id,
        classId: assignment.classId,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        type: assignment.type,
        maxMarks: assignment.maxMarks,
        dueAt: new Date(assignment.dueAt),
        status: assignment.status,
        topic: assignment.topic,
        createdAt: new Date(assignment.issuedAt),
      },
    });
    await db.assignmentAttachment.upsert({
      where: { id: assignment.attachmentId },
      update: {
        assignmentId: assignment.id,
        name: `${assignment.title}.pdf`,
        url: `${DEMO_GENERATED_PDF_PREFIX}assignment/${assignment.id}`,
        mimeType: "application/pdf",
        size: 1,
      },
      create: {
        id: assignment.attachmentId,
        assignmentId: assignment.id,
        name: `${assignment.title}.pdf`,
        url: `${DEMO_GENERATED_PDF_PREFIX}assignment/${assignment.id}`,
        mimeType: "application/pdf",
        size: 1,
      },
    });
  }
}

async function seedResources() {
  for (const resource of DEMO_RESOURCES) {
    await db.resource.upsert({
      where: { id: resource.id },
      update: {
        classId: resource.classId,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        url: `${DEMO_GENERATED_PDF_PREFIX}resource/${resource.id}`,
        mimeType: "application/pdf",
        size: 1,
      },
      create: {
        id: resource.id,
        classId: resource.classId,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        url: `${DEMO_GENERATED_PDF_PREFIX}resource/${resource.id}`,
        mimeType: "application/pdf",
        size: 1,
        createdAt: new Date("2026-08-01T03:30:00.000Z"),
      },
    });
  }
}

async function seedSubmissions(
  students: Map<string, { userId: string; profileId: string }>,
) {
  for (const fixture of buildDemoSubmissions()) {
    const student = students.get(fixture.studentKey)!;
    const submission = await db.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: fixture.assignmentId,
          studentId: student.profileId,
        },
      },
      update: {
        status: fixture.status,
        note: fixture.note,
        submittedAt: fixture.submittedAt
          ? new Date(fixture.submittedAt)
          : null,
      },
      create: {
        id: fixture.id,
        assignmentId: fixture.assignmentId,
        studentId: student.profileId,
        status: fixture.status,
        note: fixture.note,
        submittedAt: fixture.submittedAt
          ? new Date(fixture.submittedAt)
          : null,
      },
    });
    await db.submissionPage.deleteMany({ where: { submissionId: submission.id } });
    await db.submissionPage.createMany({
      data: Array.from({ length: fixture.pageCount }, (_, index) => ({
        id: `${submission.id}-page-${index + 1}`,
        submissionId: submission.id,
        pageNumber: index + 1,
        name: `${fixture.studentKey}-${fixture.assignmentId}-page-${index + 1}.svg`,
        url: `${DEMO_SUBMISSION_PAGE_PREFIX}${submission.id}/${index + 1}`,
        mimeType: "image/svg+xml",
        size: 1,
      })),
    });
    if (fixture.marks === null) {
      await db.result.deleteMany({ where: { submissionId: submission.id } });
    } else {
      await db.result.upsert({
        where: { submissionId: submission.id },
        update: {
          marks: fixture.marks,
          published: fixture.resultPublished,
          publishedAt: fixture.resultPublished
            ? new Date("2026-08-06T11:30:00.000Z")
            : null,
          teacherNote: fixture.feedback,
        },
        create: {
          id: `${submission.id}-result`,
          submissionId: submission.id,
          marks: fixture.marks,
          published: fixture.resultPublished,
          publishedAt: fixture.resultPublished
            ? new Date("2026-08-06T11:30:00.000Z")
            : null,
          teacherNote: fixture.feedback,
        },
      });
    }
    const feedbackId = `${submission.id}-feedback`;
    if (fixture.feedback) {
      await db.feedback.upsert({
        where: { id: feedbackId },
        update: {
          content: fixture.feedback,
          approved: true,
          isAiSuggested: false,
        },
        create: {
          id: feedbackId,
          submissionId: submission.id,
          content: fixture.feedback,
          approved: true,
          isAiSuggested: false,
          createdAt: new Date("2026-08-06T10:30:00.000Z"),
        },
      });
    } else {
      await db.feedback.deleteMany({ where: { id: feedbackId } });
    }
  }
}

async function seedQuizzes(
  students: Map<string, { userId: string; profileId: string }>,
) {
  for (const quiz of DEMO_QUIZZES) {
    await db.quiz.upsert({
      where: { id: quiz.id },
      update: {
        classId: quiz.classId,
        title: quiz.title,
        description: quiz.description,
        published: quiz.published,
        timeLimit: quiz.timeLimit,
      },
      create: {
        id: quiz.id,
        classId: quiz.classId,
        title: quiz.title,
        description: quiz.description,
        published: quiz.published,
        timeLimit: quiz.timeLimit,
        createdAt: new Date("2026-07-20T03:30:00.000Z"),
      },
    });
    await db.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
    await db.quizQuestion.createMany({
      data: quiz.questions.map((question, index) => ({
        id: demoQuizQuestionId(quiz.id, index),
        quizId: quiz.id,
        prompt: question.prompt,
        options: question.options,
        correctAnswer: question.answer,
        explanation: `Review ${quiz.topic.toLowerCase()} and connect the answer to the class example.`,
        marks: question.marks,
        order: index,
      })),
    });
  }
  for (const attempt of demoQuizAttempts()) {
    await db.quizAttempt.upsert({
      where: { id: attempt.id },
      update: {
        quizId: attempt.quizId,
        studentId: students.get(attempt.studentKey)!.profileId,
        answers: attempt.answers,
        score: attempt.score,
        submittedAt: new Date(attempt.submittedAt),
      },
      create: {
        id: attempt.id,
        quizId: attempt.quizId,
        studentId: students.get(attempt.studentKey)!.profileId,
        answers: attempt.answers,
        score: attempt.score,
        submittedAt: new Date(attempt.submittedAt),
      },
    });
  }
}

async function seedAttendance(
  students: Map<string, { userId: string; profileId: string }>,
) {
  for (const record of buildDemoAttendance()) {
    const date = new Date(`${record.date}T00:00:00.000Z`);
    const studentId = students.get(record.studentKey)!.profileId;
    await db.attendanceRecord.upsert({
      where: {
        classId_studentId_date: {
          classId: record.classId,
          studentId,
          date,
        },
      },
      update: { status: record.status },
      create: {
        id: `demo-attendance-${record.classId}-${record.studentKey}-${record.date}`,
        classId: record.classId,
        studentId,
        date,
        status: record.status,
      },
    });
  }
}

async function seedCommunicationAndActivity(
  students: Map<string, { userId: string; profileId: string }>,
) {
  const announcements = [
    {
      id: "demo-announcement-revision-clinic",
      classId: "demo-class",
      title: "Partnership revision clinic on Wednesday",
      content: "Bring one ratio or goodwill doubt. We will solve two original board-style questions together.",
    },
    {
      id: "demo-announcement-commerce-week",
      classId: "demo-class-business",
      title: "Commerce application week",
      content: "Use examples from our fictional enterprises and keep evidence separate from your recommendation.",
    },
    {
      id: "demo-announcement-ip-lab",
      classId: "demo-class-ip",
      title: "IP lab submission reminder",
      content: "Include readable code, output and one interpretation below each task before submission.",
    },
  ];
  for (const announcement of announcements) {
    await db.announcement.upsert({
      where: { id: announcement.id },
      update: announcement,
      create: {
        ...announcement,
        authorId: teacherUserId,
        publishedAt: new Date("2026-08-05T03:30:00.000Z"),
      },
    });
  }

  await db.aIContentGeneration.upsert({
    where: { id: "demo-ai-teacher-lesson" },
    update: {
      prompt: { topic: "Admission of a partner", grade: "12", subject: "Accountancy" },
      output: "A 45-minute lesson sequence using ratio cards, one worked example and a misconception check.",
      approved: true,
    },
    create: {
      id: "demo-ai-teacher-lesson",
      userId: teacherUserId,
      type: AIContentType.LESSON_PLAN,
      prompt: { topic: "Admission of a partner", grade: "12", subject: "Accountancy" },
      output: "A 45-minute lesson sequence using ratio cards, one worked example and a misconception check.",
      approved: true,
      createdAt: new Date("2026-08-04T05:30:00.000Z"),
    },
  });

  for (const [studentIndex, student] of DEMO_STUDENTS.entries()) {
    const account = students.get(student.key)!;
    const prompts = [
      {
        type: AIContentType.DOUBT_HELP,
        topic: student.improvements[0],
        details: `Why does ${student.improvements[0]} change the final answer?`,
        output: `Start from the definition, identify the affected values and test the change using one small worked example. Then compare it with your previous method.`,
      },
      {
        type: AIContentType.REVISION_HELP,
        topic: student.strengths[0],
        details: `Create a short revision checklist for ${student.strengths[0]}.`,
        output: `Use a three-step checklist: recall the rule, apply it to one fresh example and explain the result in one precise sentence.`,
      },
    ];
    for (const [promptIndex, prompt] of prompts.entries()) {
      await db.aIContentGeneration.upsert({
        where: { id: `demo-ai-${student.key}-${promptIndex + 1}` },
        update: {
          type: prompt.type,
          prompt: {
            topic: prompt.topic,
            subject: promptIndex === 0 ? "Accountancy" : "Commerce",
            grade: "12",
            details: prompt.details,
          },
          output: prompt.output,
          approved: true,
        },
        create: {
          id: `demo-ai-${student.key}-${promptIndex + 1}`,
          userId: account.userId,
          type: prompt.type,
          prompt: {
            topic: prompt.topic,
            subject: promptIndex === 0 ? "Accountancy" : "Commerce",
            grade: "12",
            details: prompt.details,
          },
          output: prompt.output,
          approved: true,
          createdAt: new Date(Date.UTC(2026, 7, 1 + studentIndex, 7 + promptIndex)),
        },
      });
    }
  }

  const activities: Array<{
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: Date;
  }> = [
    {
      id: "demo-activity-teacher-published-work",
      userId: teacherUserId,
      action: "Published Class 12 Commerce assessments",
      entityType: "Assignment",
      entityId: DEMO_ASSIGNMENTS[0].id,
      createdAt: new Date("2026-08-05T05:30:00.000Z"),
    },
    {
      id: "demo-activity-teacher-reviewed-work",
      userId: teacherUserId,
      action: "Published learner feedback",
      entityType: "Submission",
      entityId: buildDemoSubmissions().find((item) => item.status === "PUBLISHED")!.id,
      createdAt: new Date("2026-08-06T10:30:00.000Z"),
    },
  ];
  for (const student of DEMO_STUDENTS) {
    activities.push({
      id: `demo-activity-${student.key}-viewed-feedback`,
      userId: students.get(student.key)!.userId,
      action: "Viewed published feedback",
      entityType: "Result",
      entityId: null,
      createdAt: new Date("2026-08-06T12:30:00.000Z"),
    });
  }
  for (const activity of activities) {
    await db.activityLog.upsert({
      where: { id: activity.id },
      update: {
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        createdAt: activity.createdAt,
      },
      create: activity,
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const { teacher, teacherProfile, students } = await seedUsers(passwordHash);
  await seedClasses(teacherProfile.id, students);
  await removeSupersededFixtures();
  await seedAssignments();
  await seedResources();
  await seedSubmissions(students);
  await seedQuizzes(students);
  await seedAttendance(students);
  await seedCommunicationAndActivity(students);

  const [studentCount, assignmentCount, quizCount, resourceCount, submissionCount] =
    await Promise.all([
      db.classEnrollment.count({ where: { classId: "demo-class" } }),
      db.assignment.count({ where: { id: { in: DEMO_ASSIGNMENTS.map((item) => item.id) } } }),
      db.quiz.count({ where: { id: { in: DEMO_QUIZZES.map((item) => item.id) } } }),
      db.resource.count({ where: { id: { in: DEMO_RESOURCES.map((item) => item.id) } } }),
      db.submission.count({ where: { id: { startsWith: "demo-submission-" } } }),
    ]);
  console.log(
    `ClassConnect demo seeded: ${studentCount} students, ${assignmentCount} assessments, ${quizCount} quizzes, ${resourceCount} resources, ${submissionCount} submissions.`,
  );
  console.log(`Demo teacher: ${teacher.email}. Shared demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("ClassConnect demo seed failed", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
