import { describe, expect, it } from "vitest";
import {
  buildDemoAttendance,
  buildDemoSubmissions,
  demoQuizAttempts,
  DEMO_ASSIGNMENTS,
  DEMO_CLASSES,
  DEMO_PDF_DOCUMENT_KEYS,
  DEMO_QUIZZES,
  DEMO_RESOURCES,
  DEMO_STUDENTS,
} from "./demo-catalog";

describe("Class 12 Commerce demo catalogue", () => {
  it("keeps the existing learner and adds the five requested fictional students", () => {
    expect(DEMO_STUDENTS.map((student) => student.name)).toEqual([
      "Arjun Mehta",
      "Aarav Patel",
      "Diya Shah",
      "Riya Desai",
      "Kabir Mehta",
      "Vivaan Joshi",
    ]);
    expect(new Set(DEMO_STUDENTS.map((student) => student.userId)).size).toBe(6);
    expect(new Set(DEMO_STUDENTS.map((student) => student.parentAccessCode)).size).toBe(6);
  });

  it("contains the requested original Commerce assessment mix", () => {
    const counts = Object.groupBy(DEMO_ASSIGNMENTS, (item) => item.type);
    expect(counts.Assignment).toHaveLength(5);
    expect(counts.Test).toHaveLength(3);
    expect(counts.Worksheet).toHaveLength(3);
    expect(counts.Homework).toHaveLength(2);
    expect(counts.Project).toHaveLength(1);
    expect(counts.Classwork).toHaveLength(1);
    expect(DEMO_QUIZZES).toHaveLength(5);
    expect(DEMO_RESOURCES.filter((item) => item.type === "Revision").length).toBeGreaterThanOrEqual(2);
    expect(new Set(DEMO_CLASSES.map((item) => item.subject))).toEqual(
      new Set(["Accountancy", "Economics", "Business Studies", "Informatics Practices", "English"]),
    );
  });

  it("generates varied, logically valid submission and quiz evidence", () => {
    const submissions = buildDemoSubmissions();
    expect(submissions.length).toBeGreaterThan(35);
    expect(new Set(submissions.map((item) => item.status))).toEqual(
      new Set(["DRAFT", "SUBMITTED", "REVIEWED", "PUBLISHED"]),
    );
    for (const submission of submissions) {
      const assignment = DEMO_ASSIGNMENTS.find((item) => item.id === submission.assignmentId)!;
      const subject = DEMO_CLASSES.find((item) => item.id === assignment.classId)!.subject;
      expect(assignment).toBeTruthy();
      expect(assignment.status).not.toBe("DRAFT");
      if (submission.status === "DRAFT") expect(submission.submittedAt).toBeNull();
      else expect(submission.submittedAt).not.toBeNull();
      if (submission.marks !== null) {
        expect(submission.marks).toBeGreaterThanOrEqual(0);
        expect(submission.marks).toBeLessThanOrEqual(assignment.maxMarks);
      }
      if (subject !== "Accountancy") {
        expect((submission.feedback ?? "").toLowerCase()).not.toContain("goodwill");
      }
      expect(submission.resultPublished).toBe(submission.status === "PUBLISHED");
    }
    const assignedCount = DEMO_ASSIGNMENTS.filter(
      (assignment) => assignment.status !== "DRAFT",
    ).length;
    for (const student of DEMO_STUDENTS) {
      const completedCount = submissions.filter(
        (submission) =>
          submission.studentKey === student.key && submission.status !== "DRAFT",
      ).length;
      expect(completedCount).toBeLessThanOrEqual(assignedCount);
    }
    expect(demoQuizAttempts().length).toBeGreaterThan(15);
    expect(buildDemoAttendance()).toHaveLength(DEMO_CLASSES.length * DEMO_STUDENTS.length * 8);
  });

  it("assigns one stable filename key to every demo document", () => {
    expect(new Set(DEMO_PDF_DOCUMENT_KEYS).size).toBe(DEMO_PDF_DOCUMENT_KEYS.length);
  });
});
