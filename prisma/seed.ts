import {
  AIContentType,
  AssignmentStatus,
  AttendanceStatus,
  PrismaClient,
  Role,
  SubmissionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import { statSync } from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

const db = new PrismaClient();

function reviewAsset(filename: string) {
  const relativePath = path.join("demo", "review", filename);
  return {
    url: `/${relativePath.split(path.sep).join("/")}`,
    size: statSync(path.join(process.cwd(), "public", relativePath)).size,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash("EduGrade@123", 12);
  const teacher = await db.user.upsert({
    where: { email: "teacher@edugrade.ai" },
    update: { passwordHash },
    create: {
      id: "demo-teacher-user",
      email: "teacher@edugrade.ai",
      passwordHash,
      name: "Meera Sharma",
      role: Role.TEACHER,
    },
  });
  const student = await db.user.upsert({
    where: { email: "student@edugrade.ai" },
    update: { passwordHash },
    create: {
      id: "demo-student-user",
      email: "student@edugrade.ai",
      passwordHash,
      name: "Arjun Mehta",
      role: Role.STUDENT,
    },
  });
  const parent = await db.user.upsert({
    where: { email: "parent@edugrade.ai" },
    update: { passwordHash, role: Role.PARENT },
    create: {
      id: "demo-parent-user",
      email: "parent@edugrade.ai",
      passwordHash,
      name: "Kavita Mehta",
      role: Role.PARENT,
    },
  });
  const teacherProfile = await db.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      id: "demo-teacher-profile",
      userId: teacher.id,
      school: "Vidya Bharati Senior Secondary School",
      subject: "Accountancy",
    },
  });
  const studentProfile = await db.studentProfile.upsert({
    where: { userId: student.id },
    update: { parentAccessCode: "ARJUN2P4KM" },
    create: {
      id: "demo-student-profile",
      userId: student.id,
      school: "Vidya Bharati Senior Secondary School",
      grade: "12",
      rollNumber: "12-C-17",
      parentAccessCode: "ARJUN2P4KM",
    },
  });
  const parentProfile = await db.parentProfile.upsert({
    where: { userId: parent.id },
    update: { school: "Vidya Bharati Senior Secondary School" },
    create: {
      id: "demo-parent-profile",
      userId: parent.id,
      school: "Vidya Bharati Senior Secondary School",
    },
  });
  await db.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parentProfile.id,
        studentId: studentProfile.id,
      },
    },
    update: { relationship: "Mother" },
    create: {
      id: "demo-parent-student",
      parentId: parentProfile.id,
      studentId: studentProfile.id,
      relationship: "Mother",
    },
  });
  const classroom = await db.classRoom.upsert({
    where: { code: "ACC12D" },
    update: {},
    create: {
      id: "demo-class",
      name: "Class 12 Commerce",
      subject: "Accountancy",
      grade: "12",
      code: "ACC12D",
      description:
        "CBSE Accountancy · Partnership Firms & Company Accounts",
      teacherId: teacherProfile.id,
    },
  });
  await db.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId: classroom.id,
        studentId: studentProfile.id,
      },
    },
    update: {},
    create: { classId: classroom.id, studentId: studentProfile.id },
  });

  // Remove only superseded fixture records. User-created classroom work is untouched.
  await db.assignment.deleteMany({
    where: {
      classId: classroom.id,
      OR: [
        { id: "demo-assignment" },
        {
          title: {
            in: [
              "Partnership Fundamentals Test",
              "Expo Verification Practice",
              "Upload Flow Retest",
              "Final Upload Verification",
            ],
          },
        },
      ],
    },
  });
  await db.quiz.deleteMany({
    where: {
      classId: classroom.id,
      title: "Partnership Concepts Check",
    },
  });

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 5);
  dueAt.setHours(17, 0, 0, 0);

  const partnershipPaper = reviewAsset("partnership-unit-test.pdf");
  const partnershipAnswerOne = reviewAsset(
    "partnership-unit-test-answer-1.png",
  );
  const partnershipAnswerTwo = reviewAsset(
    "partnership-unit-test-answer-2.png",
  );
  const partnershipTest = await db.assignment.upsert({
    where: { id: "review-assignment-partnership-test" },
    update: {
      dueAt,
      title: "Partnership Adjustments Unit Test",
      description:
        "A structured unit test covering admission, goodwill, revaluation and capital accounts.",
      instructions:
        "Answer all questions, show working notes, and upload pages in order.",
      type: "Test",
      maxMarks: 40,
      status: AssignmentStatus.PUBLISHED,
      topic: "Partnership Adjustments",
    },
    create: {
      id: "review-assignment-partnership-test",
      classId: classroom.id,
      title: "Partnership Adjustments Unit Test",
      description:
        "A structured unit test covering admission, goodwill, revaluation and capital accounts.",
      instructions:
        "Answer all questions, show working notes, and upload pages in order.",
      type: "Test",
      maxMarks: 40,
      dueAt,
      status: AssignmentStatus.PUBLISHED,
      topic: "Partnership Adjustments",
    },
  });
  await db.assignmentAttachment.upsert({
    where: { id: "review-paper-partnership-test" },
    update: {
      assignmentId: partnershipTest.id,
      name: "Partnership_Adjustments_Unit_Test.pdf",
      url: partnershipPaper.url,
      mimeType: "application/pdf",
      size: partnershipPaper.size,
    },
    create: {
      id: "review-paper-partnership-test",
      assignmentId: partnershipTest.id,
      name: "Partnership_Adjustments_Unit_Test.pdf",
      url: partnershipPaper.url,
      mimeType: "application/pdf",
      size: partnershipPaper.size,
    },
  });
  const partnershipSubmission = await db.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: partnershipTest.id,
        studentId: studentProfile.id,
      },
    },
    update: {
      status: SubmissionStatus.SUBMITTED,
      note: "Completed all four questions. Working notes are on page 2.",
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    create: {
      id: "review-submission-partnership-test",
      assignmentId: partnershipTest.id,
      studentId: studentProfile.id,
      status: SubmissionStatus.SUBMITTED,
      note: "Completed all four questions. Working notes are on page 2.",
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });
  await db.submissionPage.upsert({
    where: {
      submissionId_pageNumber: {
        submissionId: partnershipSubmission.id,
        pageNumber: 1,
      },
    },
    update: {
      name: "Partnership_Test_Answer_Page_1.png",
      url: partnershipAnswerOne.url,
      mimeType: "image/png",
      size: partnershipAnswerOne.size,
    },
    create: {
      id: "review-page-partnership-1",
      submissionId: partnershipSubmission.id,
      pageNumber: 1,
      name: "Partnership_Test_Answer_Page_1.png",
      url: partnershipAnswerOne.url,
      mimeType: "image/png",
      size: partnershipAnswerOne.size,
    },
  });
  await db.submissionPage.upsert({
    where: {
      submissionId_pageNumber: {
        submissionId: partnershipSubmission.id,
        pageNumber: 2,
      },
    },
    update: {
      name: "Partnership_Test_Answer_Page_2.png",
      url: partnershipAnswerTwo.url,
      mimeType: "image/png",
      size: partnershipAnswerTwo.size,
    },
    create: {
      id: "review-page-partnership-2",
      submissionId: partnershipSubmission.id,
      pageNumber: 2,
      name: "Partnership_Test_Answer_Page_2.png",
      url: partnershipAnswerTwo.url,
      mimeType: "image/png",
      size: partnershipAnswerTwo.size,
    },
  });
  await db.result.deleteMany({
    where: { submissionId: partnershipSubmission.id },
  });
  await db.feedback.deleteMany({
    where: { submissionId: partnershipSubmission.id },
  });

  const cashFlowPaper = reviewAsset("cash-flow-assignment.pdf");
  const cashFlowAnswer = reviewAsset("cash-flow-assignment-answer.png");
  const cashFlowAssignment = await db.assignment.upsert({
    where: { id: "review-assignment-cash-flow" },
    update: {
      dueAt,
      title: "Cash Flow Statement Assignment",
      description:
        "Prepare a complete cash flow statement under AS 3 using the indirect method.",
      instructions:
        "Classify each item and include supporting calculations.",
      type: "Assignment",
      maxMarks: 25,
      status: AssignmentStatus.PUBLISHED,
      topic: "Cash Flow Statements",
    },
    create: {
      id: "review-assignment-cash-flow",
      classId: classroom.id,
      title: "Cash Flow Statement Assignment",
      description:
        "Prepare a complete cash flow statement under AS 3 using the indirect method.",
      instructions:
        "Classify each item and include supporting calculations.",
      type: "Assignment",
      maxMarks: 25,
      dueAt,
      status: AssignmentStatus.PUBLISHED,
      topic: "Cash Flow Statements",
    },
  });
  await db.assignmentAttachment.upsert({
    where: { id: "review-paper-cash-flow" },
    update: {
      assignmentId: cashFlowAssignment.id,
      name: "Cash_Flow_Statement_Assignment.pdf",
      url: cashFlowPaper.url,
      mimeType: "application/pdf",
      size: cashFlowPaper.size,
    },
    create: {
      id: "review-paper-cash-flow",
      assignmentId: cashFlowAssignment.id,
      name: "Cash_Flow_Statement_Assignment.pdf",
      url: cashFlowPaper.url,
      mimeType: "application/pdf",
      size: cashFlowPaper.size,
    },
  });
  const cashFlowSubmission = await db.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: cashFlowAssignment.id,
        studentId: studentProfile.id,
      },
    },
    update: {
      status: SubmissionStatus.REVIEWED,
      note: "Statement and calculations are included on one page.",
      submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
    create: {
      id: "review-submission-cash-flow",
      assignmentId: cashFlowAssignment.id,
      studentId: studentProfile.id,
      status: SubmissionStatus.REVIEWED,
      note: "Statement and calculations are included on one page.",
      submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
  });
  await db.submissionPage.upsert({
    where: {
      submissionId_pageNumber: {
        submissionId: cashFlowSubmission.id,
        pageNumber: 1,
      },
    },
    update: {
      name: "Cash_Flow_Assignment_Answer.png",
      url: cashFlowAnswer.url,
      mimeType: "image/png",
      size: cashFlowAnswer.size,
    },
    create: {
      id: "review-page-cash-flow-1",
      submissionId: cashFlowSubmission.id,
      pageNumber: 1,
      name: "Cash_Flow_Assignment_Answer.png",
      url: cashFlowAnswer.url,
      mimeType: "image/png",
      size: cashFlowAnswer.size,
    },
  });
  await db.result.upsert({
    where: { submissionId: cashFlowSubmission.id },
    update: {
      marks: 21,
      published: false,
      publishedAt: null,
      teacherNote:
        "Accurate classification and calculation. Review the presentation of the final reconciliation.",
    },
    create: {
      submissionId: cashFlowSubmission.id,
      marks: 21,
      published: false,
      teacherNote:
        "Accurate classification and calculation. Review the presentation of the final reconciliation.",
    },
  });
  await db.feedback.deleteMany({
    where: { submissionId: cashFlowSubmission.id },
  });
  await db.feedback.create({
    data: {
      submissionId: cashFlowSubmission.id,
      content:
        "Your operating, investing and financing classifications are accurate. The supporting calculations are clear. Add a final reconciliation line linking the net increase to opening and closing cash before publication.",
      approved: true,
    },
  });

  const goodwillPaper = reviewAsset("goodwill-worksheet.pdf");
  const goodwillAnswer = reviewAsset("goodwill-worksheet-answer.png");
  const goodwillWorksheet = await db.assignment.upsert({
    where: { id: "review-assignment-goodwill" },
    update: {
      dueAt,
      title: "Goodwill Valuation Worksheet",
      description:
        "Practice average-profit and super-profit methods with a concept check.",
      instructions: "Show each formula and calculation before the final answer.",
      type: "Worksheet",
      maxMarks: 20,
      status: AssignmentStatus.PUBLISHED,
      topic: "Goodwill Valuation",
    },
    create: {
      id: "review-assignment-goodwill",
      classId: classroom.id,
      title: "Goodwill Valuation Worksheet",
      description:
        "Practice average-profit and super-profit methods with a concept check.",
      instructions: "Show each formula and calculation before the final answer.",
      type: "Worksheet",
      maxMarks: 20,
      dueAt,
      status: AssignmentStatus.PUBLISHED,
      topic: "Goodwill Valuation",
    },
  });
  await db.assignmentAttachment.upsert({
    where: { id: "review-paper-goodwill" },
    update: {
      assignmentId: goodwillWorksheet.id,
      name: "Goodwill_Valuation_Worksheet.pdf",
      url: goodwillPaper.url,
      mimeType: "application/pdf",
      size: goodwillPaper.size,
    },
    create: {
      id: "review-paper-goodwill",
      assignmentId: goodwillWorksheet.id,
      name: "Goodwill_Valuation_Worksheet.pdf",
      url: goodwillPaper.url,
      mimeType: "application/pdf",
      size: goodwillPaper.size,
    },
  });
  const goodwillSubmission = await db.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: goodwillWorksheet.id,
        studentId: studentProfile.id,
      },
    },
    update: {
      status: SubmissionStatus.PUBLISHED,
      note: "All calculations and the concept response are included.",
      submittedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
    },
    create: {
      id: "review-submission-goodwill",
      assignmentId: goodwillWorksheet.id,
      studentId: studentProfile.id,
      status: SubmissionStatus.PUBLISHED,
      note: "All calculations and the concept response are included.",
      submittedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
    },
  });
  await db.submissionPage.upsert({
    where: {
      submissionId_pageNumber: {
        submissionId: goodwillSubmission.id,
        pageNumber: 1,
      },
    },
    update: {
      name: "Goodwill_Worksheet_Answer.png",
      url: goodwillAnswer.url,
      mimeType: "image/png",
      size: goodwillAnswer.size,
    },
    create: {
      id: "review-page-goodwill-1",
      submissionId: goodwillSubmission.id,
      pageNumber: 1,
      name: "Goodwill_Worksheet_Answer.png",
      url: goodwillAnswer.url,
      mimeType: "image/png",
      size: goodwillAnswer.size,
    },
  });
  await db.result.upsert({
    where: { submissionId: goodwillSubmission.id },
    update: {
      marks: 18,
      published: true,
      publishedAt: new Date(),
      teacherNote:
        "Methods and calculations are correct. The concept explanation is concise and relevant.",
    },
    create: {
      submissionId: goodwillSubmission.id,
      marks: 18,
      published: true,
      publishedAt: new Date(),
      teacherNote:
        "Methods and calculations are correct. The concept explanation is concise and relevant.",
    },
  });
  await db.feedback.deleteMany({
    where: { submissionId: goodwillSubmission.id },
  });
  await db.feedback.create({
    data: {
      submissionId: goodwillSubmission.id,
      content:
        "Both valuation methods are calculated correctly and your abnormal-item explanation is accurate. Keep the same formula-first structure in the next partnership assessment.",
      approved: true,
    },
  });

  const quiz = await db.quiz.upsert({
    where: { id: "review-quiz-accounting-concepts" },
    update: {
      classId: classroom.id,
      title: "Accounting Concepts Review Quiz",
      description:
        "A four-question check covering partnerships, goodwill and cash flow.",
      published: true,
      timeLimit: 12,
    },
    create: {
      id: "review-quiz-accounting-concepts",
      classId: classroom.id,
      title: "Accounting Concepts Review Quiz",
      description:
        "A four-question check covering partnerships, goodwill and cash flow.",
      published: true,
      timeLimit: 12,
    },
  });
  await db.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
  await db.quizQuestion.createMany({
    data: [
      {
        id: "review-quiz-question-1",
        quizId: quiz.id,
        order: 1,
        prompt:
          "In the absence of a partnership deed, profits are shared:",
        options: ["In capital ratio", "Equally", "In old ratio", "By seniority"],
        correctAnswer: "Equally",
        explanation:
          "The Partnership Act provides equal profit sharing when the deed is silent.",
        marks: 1,
      },
      {
        id: "review-quiz-question-2",
        quizId: quiz.id,
        order: 2,
        prompt: "Super profit equals:",
        options: [
          "Average profit minus normal profit",
          "Normal profit minus average profit",
          "Capital employed minus liabilities",
          "Sales minus drawings",
        ],
        correctAnswer: "Average profit minus normal profit",
        explanation:
          "Super profit is the maintainable profit earned above normal profit.",
        marks: 1,
      },
      {
        id: "review-quiz-question-3",
        quizId: quiz.id,
        order: 3,
        prompt:
          "Purchase of machinery is classified in the cash flow statement as:",
        options: [
          "Operating inflow",
          "Operating outflow",
          "Investing outflow",
          "Financing outflow",
        ],
        correctAnswer: "Investing outflow",
        explanation:
          "Purchasing a long-term asset is an investing cash outflow.",
        marks: 1,
      },
      {
        id: "review-quiz-question-4",
        quizId: quiz.id,
        order: 4,
        prompt: "Interest on drawings is a:",
        options: ["Gain to the firm", "Loss to the firm", "Liability", "Reserve"],
        correctAnswer: "Gain to the firm",
        explanation:
          "It is charged to partners and credited to the appropriation account.",
        marks: 1,
      },
    ],
  });
  await db.quizAttempt.upsert({
    where: { id: "review-quiz-attempt-accounting-concepts" },
    update: {
      quizId: quiz.id,
      studentId: studentProfile.id,
      answers: {
        "review-quiz-question-1": "Equally",
        "review-quiz-question-2": "Average profit minus normal profit",
        "review-quiz-question-3": "Operating outflow",
        "review-quiz-question-4": "Gain to the firm",
      },
      score: 3,
      submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
    create: {
      id: "review-quiz-attempt-accounting-concepts",
      quizId: quiz.id,
      studentId: studentProfile.id,
      answers: {
        "review-quiz-question-1": "Equally",
        "review-quiz-question-2": "Average profit minus normal profit",
        "review-quiz-question-3": "Operating outflow",
        "review-quiz-question-4": "Gain to the firm",
      },
      score: 3,
      submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
  });

  if (
    (await db.announcement.count({ where: { classId: classroom.id } })) === 0
  ) {
    await db.announcement.createMany({
      data: [
        {
          classId: classroom.id,
          authorId: teacher.id,
          title: "Revision clinic on Wednesday",
          content:
            "Bring your partnership adjustment doubts. We will solve two board-style questions together.",
        },
        {
          classId: classroom.id,
          authorId: teacher.id,
          title: "Test submission checklist",
          content:
            "Upload clear, well-lit images in page order and verify every preview before submitting.",
        },
      ],
    });
  }
  if ((await db.resource.count({ where: { classId: classroom.id } })) === 0) {
    await db.resource.createMany({
      data: [
        {
          classId: classroom.id,
          title: "Partnership Fundamentals — Quick Notes",
          description: "Key formulas, journal entries, and common mistakes.",
          type: "Notes",
          url: "/demo/partnership-notes.txt",
          mimeType: "text/plain",
          size: 2200,
        },
        {
          classId: classroom.id,
          title: "Goodwill Adjustment Practice",
          description: "Five graduated board-style questions.",
          type: "Worksheet",
          url: "/demo/goodwill-practice.txt",
          mimeType: "text/plain",
          size: 1600,
        },
      ],
    });
  }
  if (
    (await db.attendanceRecord.count({ where: { classId: classroom.id } })) ===
    0
  ) {
    for (let days = 1; days <= 8; days++) {
      const date = new Date();
      date.setDate(date.getDate() - days * 2);
      date.setHours(0, 0, 0, 0);
      await db.attendanceRecord.create({
        data: {
          classId: classroom.id,
          studentId: studentProfile.id,
          date,
          status:
            days === 5 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
        },
      });
    }
  }
  if (
    (await db.aIContentGeneration.count({ where: { userId: teacher.id } })) ===
    0
  ) {
    await db.aIContentGeneration.create({
      data: {
        userId: teacher.id,
        type: AIContentType.LESSON_PLAN,
        prompt: { topic: "Goodwill valuation", grade: "12" },
        output:
          "A structured 45-minute lesson plan covering goodwill valuation methods.",
        approved: true,
      },
    });
  }
  await db.activityLog.createMany({
    data: [
      {
        userId: teacher.id,
        action: "Seeded realistic review work",
        entityType: "Submission",
        entityId: partnershipSubmission.id,
      },
      {
        userId: teacher.id,
        action: "Generated lesson plan",
        entityType: "AIContentGeneration",
      },
      {
        userId: student.id,
        action: "Viewed feedback",
        entityType: "Result",
        entityId: goodwillSubmission.id,
      },
    ],
  });
  console.log(
    "EduGrade AI demo data seeded. Password for all demo accounts: EduGrade@123",
  );
}

main().finally(() => db.$disconnect());
