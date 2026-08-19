import { describe, expect, it } from "vitest";
import { canRequestPdfVariant, studentCanAccessReport } from "./pdf-access";

describe("teacher PDF variant access", () => {
  it("allows only teachers to request answer keys", () => {
    expect(canRequestPdfVariant("TEACHER", "teacher")).toBe(true);
    expect(canRequestPdfVariant("STUDENT", "teacher")).toBe(false);
    expect(canRequestPdfVariant("PARENT", "teacher")).toBe(false);
  });

  it("allows authenticated roles to request student-safe versions", () => {
    expect(canRequestPdfVariant("TEACHER", "student")).toBe(true);
    expect(canRequestPdfVariant("STUDENT", "student")).toBe(true);
    expect(canRequestPdfVariant("PARENT", "student")).toBe(true);
  });

  it("blocks a student from requesting another learner's report", () => {
    expect(studentCanAccessReport("student-a", "student-a")).toBe(true);
    expect(studentCanAccessReport("student-b", "student-a")).toBe(false);
    expect(studentCanAccessReport("student-a", null)).toBe(false);
  });
});
