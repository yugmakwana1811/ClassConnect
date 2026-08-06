import { topicPerformance, type TopicPerformance } from "./analytics";

export type StudentScoreInput = {
  kind: "assignment" | "quiz";
  title: string;
  marks: number;
  maxMarks: number;
  date: Date;
  topic?: string | null;
};

export type StudentPerformanceSummary = {
  overallAverage: number | null;
  assignmentAverage: number | null;
  quizAverage: number | null;
  completionRate: number | null;
  scoredCount: number;
  assignmentCount: number;
  quizCount: number;
  trend: Array<{
    kind: StudentScoreInput["kind"];
    title: string;
    score: number;
    date: Date;
  }>;
  topics: TopicPerformance[];
};

function percentage(marks: number, maxMarks: number) {
  if (!Number.isFinite(marks) || !Number.isFinite(maxMarks) || maxMarks <= 0)
    return null;
  return Math.round(Math.max(0, Math.min(100, (marks / maxMarks) * 100)));
}

function average(values: number[]) {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
}

export function studentPerformanceSummary(
  scores: StudentScoreInput[],
  submittedCount: number,
  expectedCount: number,
): StudentPerformanceSummary {
  const validScores = scores
    .map((item) => ({ item, score: percentage(item.marks, item.maxMarks) }))
    .filter(
      (entry): entry is { item: StudentScoreInput; score: number } =>
        entry.score !== null,
    );
  const assignmentScores = validScores
    .filter(({ item }) => item.kind === "assignment")
    .map(({ score }) => score);
  const quizScores = validScores
    .filter(({ item }) => item.kind === "quiz")
    .map(({ score }) => score);
  const trend = validScores
    .sort((a, b) => a.item.date.getTime() - b.item.date.getTime())
    .slice(-8)
    .map(({ item, score }) => ({
      kind: item.kind,
      title: item.title,
      score,
      date: item.date,
    }));

  return {
    overallAverage: average(validScores.map(({ score }) => score)),
    assignmentAverage: average(assignmentScores),
    quizAverage: average(quizScores),
    completionRate:
      expectedCount > 0
        ? Math.round(
            (Math.max(0, Math.min(submittedCount, expectedCount)) /
              expectedCount) *
              100,
          )
        : null,
    scoredCount: validScores.length,
    assignmentCount: assignmentScores.length,
    quizCount: quizScores.length,
    trend,
    topics: topicPerformance(
      validScores
        .filter(({ item }) => item.kind === "assignment")
        .map(({ item }) => ({
          topic: item.topic,
          title: item.title,
          marks: item.marks,
          maxMarks: item.maxMarks,
        })),
    ),
  };
}
