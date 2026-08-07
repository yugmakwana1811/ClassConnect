export function assignmentStatusLabel(status: string) {
  if (status === "DRAFT") return "Draft";
  if (status === "PUBLISHED") return "Published";
  if (status === "CLOSED") return "Closed";
  return status;
}

export function submissionStatusLabel(
  submission:
    | { status: string; submittedAt?: Date | string | null }
    | null
    | undefined,
  dueAt: Date | string,
) {
  if (!submission) return "Not Started";
  if (submission.status === "DRAFT") return "In Progress";
  if (submission.status === "SUBMITTED")
    return submission.submittedAt &&
      new Date(submission.submittedAt) > new Date(dueAt)
      ? "Submitted Late"
      : "Awaiting Review";
  if (submission.status === "REVIEWED") return "Graded";
  if (submission.status === "PUBLISHED") return "Feedback Published";
  return submission.status;
}
