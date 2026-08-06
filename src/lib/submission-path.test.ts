import { describe, expect, it } from "vitest";
import { submissionUploadPrefix } from "./submission-path";

describe("submission upload paths", () => {
  it("isolates each student's files within an assignment", () => {
    expect(submissionUploadPrefix("assignment-1", "student-1")).toBe(
      "submissions/assignment-1/student-1/",
    );
    expect(submissionUploadPrefix("assignment-1", "student-1")).not.toBe(
      submissionUploadPrefix("assignment-1", "student-2"),
    );
  });
});
