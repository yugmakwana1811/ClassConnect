import { describe, expect, it } from "vitest";
import {
  assignmentSchema,
  aiSchema,
  attendanceDateSchema,
  attendanceStatusSchema,
  classNameSchema,
  classSchema,
  emailChangeSchema,
  generatedContentSchema,
  joinClassSchema,
  quizSchema,
  registerSchema,
  reviewSchema,
  submissionNoteSchema,
  uploadedPagesSchema,
} from "./validation";

describe("EduGrade validation", () => {
  it("normalizes valid class codes", () => {
    expect(joinClassSchema.parse({ code: "acc12d" }).code).toBe("ACC12D");
  });
  it("rejects malformed class codes", () => {
    expect(joinClassSchema.safeParse({ code: "A-12" }).success).toBe(false);
  });
  it("prevents marks above the assignment maximum", () => {
    expect(
      reviewSchema.safeParse({
        submissionId: "sub-1",
        marks: 31,
        maxMarks: 30,
        feedback: "Specific and actionable feedback",
        publish: true,
      }).success,
    ).toBe(false);
  });
  it("rejects deadlines in the past", () => {
    expect(
      assignmentSchema.safeParse({
        classId: "class-1",
        title: "Valid assignment",
        description: "A sufficiently detailed learning purpose",
        topic: "Partnership fundamentals",
        type: "Test",
        maxMarks: 30,
        dueAt: "2020-01-01T10:00",
        publish: false,
      }).success,
    ).toBe(false);
  });
  it("interprets assignment deadlines in the India classroom timezone", () => {
    const parsed = assignmentSchema.parse({
      classId: "class-1",
      title: "Future assignment",
      description: "A sufficiently detailed learning purpose",
      topic: "Partnership fundamentals",
      type: "Test",
      maxMarks: 30,
      dueAt: "2099-08-30T10:00",
      publish: false,
    });
    expect(parsed.dueAt.toISOString()).toBe("2099-08-30T04:30:00.000Z");
  });
  it("requires strong matching passwords for registration", () => {
    expect(
      registerSchema.safeParse({
        name: "Aarav Shah",
        email: "aarav@example.com",
        password: "weakpassword",
        confirmPassword: "weakpassword",
        role: "STUDENT",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "Aarav Shah",
        email: "AARAV@example.com",
        password: "StrongPass!42",
        confirmPassword: "StrongPass!42",
        role: "STUDENT",
        grade: "8",
      }).success,
    ).toBe(true);
  });
  it("supports only CBSE Classes 6 through 12", () => {
    expect(
      classSchema.safeParse({
        name: "Class 6 Science",
        subject: "Science",
        grade: "6",
      }).success,
    ).toBe(true);
    expect(
      classSchema.safeParse({
        name: "Class 12 Accountancy",
        subject: "Accountancy",
        grade: "12",
      }).success,
    ).toBe(true);
    expect(
      classSchema.safeParse({
        name: "Class 5 Science",
        subject: "Science",
        grade: "5",
      }).success,
    ).toBe(false);
    expect(
      aiSchema.safeParse({
        type: "EXPLANATION",
        topic: "Fractions in daily life",
        subject: "Mathematics",
        grade: "13",
      }).success,
    ).toBe(false);
  });
  it("normalizes class names and rejects blank-looking names", () => {
    expect(classNameSchema.parse("  Class 11 Commerce  ")).toBe(
      "Class 11 Commerce",
    );
    expect(classNameSchema.safeParse("   ").success).toBe(false);
  });
  it("normalizes matching email changes", () => {
    const parsed = emailChangeSchema.parse({
      newEmail: " New.Address@Example.com ",
      confirmEmail: "new.address@example.com",
      currentPassword: "CurrentPass!42",
    });
    expect(parsed.newEmail).toBe("new.address@example.com");
  });
  it("rejects mismatched email changes", () => {
    expect(
      emailChangeSchema.safeParse({
        newEmail: "first@example.com",
        confirmEmail: "second@example.com",
        currentPassword: "CurrentPass!42",
      }).success,
    ).toBe(false);
  });
  it("rejects quiz questions whose correct answer is not an option", () => {
    expect(
      quizSchema.safeParse({
        classId: "class-1",
        title: "Concept check",
        publish: true,
        questions: [
          {
            prompt: "Which option is correct?",
            options: ["A", "B", "C", "D"],
            correctAnswer: "E",
            explanation: "The selected option follows the governing rule.",
            marks: 1,
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("normalizes attendance dates to UTC midnight", () => {
    expect(attendanceDateSchema.parse("2026-07-21").toISOString()).toBe(
      "2026-07-21T00:00:00.000Z",
    );
  });
  it("rejects forged attendance statuses", () => {
    expect(attendanceStatusSchema.safeParse("REMOTE").success).toBe(false);
  });
  it("rejects empty generated content", () => {
    expect(
      generatedContentSchema.safeParse({
        id: "gen-1",
        output: " ",
        approved: false,
      }).success,
    ).toBe(false);
  });
  it("limits student submission notes", () => {
    expect(submissionNoteSchema.safeParse("x".repeat(501)).success).toBe(false);
  });
  it("accepts ordered uploaded answer pages", () => {
    expect(
      uploadedPagesSchema.safeParse([
        {
          url: "https://example.com/page-1.png",
          name: "page-1.png",
          pageNumber: 1,
        },
        {
          url: "https://example.com/page-2.png",
          name: "page-2.png",
          pageNumber: 2,
        },
      ]).success,
    ).toBe(true);
  });
  it("rejects duplicate or unordered answer pages", () => {
    expect(
      uploadedPagesSchema.safeParse([
        {
          url: "https://example.com/page-2.png",
          name: "page-2.png",
          pageNumber: 2,
        },
        {
          url: "https://example.com/page-1.png",
          name: "page-1.png",
          pageNumber: 1,
        },
      ]).success,
    ).toBe(false);
  });
});
