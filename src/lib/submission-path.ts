export function submissionUploadPrefix(assignmentId: string, userId: string) {
  return `submissions/${assignmentId}/${userId}/`;
}
