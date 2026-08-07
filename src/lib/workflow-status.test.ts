import { describe, expect, it } from "vitest";
import { submissionStatusLabel } from "./workflow-status";

describe("submission workflow labels", () => {
  const dueAt = new Date("2026-08-07T10:00:00.000Z");

  it("derives user-facing states from actual records", () => {
    expect(submissionStatusLabel(null, dueAt)).toBe("Not Started");
    expect(submissionStatusLabel({ status: "DRAFT" }, dueAt)).toBe("In Progress");
    expect(
      submissionStatusLabel(
        { status: "SUBMITTED", submittedAt: "2026-08-07T09:00:00.000Z" },
        dueAt,
      ),
    ).toBe("Awaiting Review");
    expect(
      submissionStatusLabel(
        { status: "SUBMITTED", submittedAt: "2026-08-07T11:00:00.000Z" },
        dueAt,
      ),
    ).toBe("Submitted Late");
    expect(submissionStatusLabel({ status: "REVIEWED" }, dueAt)).toBe("Graded");
    expect(submissionStatusLabel({ status: "PUBLISHED" }, dueAt)).toBe("Feedback Published");
  });
});
