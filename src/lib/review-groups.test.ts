import { describe, expect, it } from "vitest";
import { groupReviewItemsByAssignment } from "@/lib/review-groups";

describe("groupReviewItemsByAssignment", () => {
  it("creates one ordered group per assignment", () => {
    const groups = groupReviewItemsByAssignment([
      { id: "submission-1", assignment: { id: "assignment-b" } },
      { id: "submission-2", assignment: { id: "assignment-a" } },
      { id: "submission-3", assignment: { id: "assignment-b" } },
    ]);

    expect(groups.map((group) => group.assignmentId)).toEqual([
      "assignment-b",
      "assignment-a",
    ]);
    expect(groups[0].submissions.map((submission) => submission.id)).toEqual([
      "submission-1",
      "submission-3",
    ]);
  });

  it("returns no menu groups when there is no submitted work", () => {
    expect(groupReviewItemsByAssignment([])).toEqual([]);
  });
});
