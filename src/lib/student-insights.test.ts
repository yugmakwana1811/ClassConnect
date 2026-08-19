import { describe, expect, it } from "vitest";
import { studentPerformanceSummary } from "./student-insights";

describe("studentPerformanceSummary", () => {
  it("combines assignment and quiz evidence into bounded averages and a trend", () => {
    const summary = studentPerformanceSummary(
      [
        {
          kind: "assignment",
          title: "Ratios test",
          topic: "Ratios",
          marks: 8,
          maxMarks: 10,
          date: new Date("2026-07-01T10:00:00Z"),
        },
        {
          kind: "quiz",
          title: "Ratios quiz",
          marks: 12,
          maxMarks: 20,
          date: new Date("2026-07-03T10:00:00Z"),
        },
        {
          kind: "assignment",
          title: "Follow-up",
          topic: "Ratios",
          marks: 14,
          maxMarks: 10,
          date: new Date("2026-07-05T10:00:00Z"),
        },
      ],
      3,
      4,
    );

    expect(summary.overallAverage).toBe(80);
    expect(summary.assignmentAverage).toBe(90);
    expect(summary.quizAverage).toBe(60);
    expect(summary.completionRate).toBe(75);
    expect(summary.scoredCount).toBe(3);
    expect(summary.trend.map((item) => item.title)).toEqual([
      "Ratios test",
      "Ratios quiz",
      "Follow-up",
    ]);
    expect(summary.topics).toEqual([
      { topic: "Ratios", average: 90, evidenceCount: 2 },
    ]);
  });

  it("ignores invalid scores and returns null when no expected work exists", () => {
    const summary = studentPerformanceSummary(
      [
        {
          kind: "assignment",
          title: "Invalid",
          marks: 2,
          maxMarks: 0,
          date: new Date("2026-07-01T10:00:00Z"),
        },
      ],
      4,
      0,
    );

    expect(summary.overallAverage).toBeNull();
    expect(summary.completionRate).toBeNull();
    expect(summary.scoredCount).toBe(0);
    expect(summary.trend).toEqual([]);
  });
});
