export function groupReviewItemsByAssignment<
  T extends { assignment: { id: string } },
>(items: readonly T[]) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const current = groups.get(item.assignment.id);

    if (current) {
      current.push(item);
    } else {
      groups.set(item.assignment.id, [item]);
    }
  }

  return Array.from(groups, ([assignmentId, submissions]) => ({
    assignmentId,
    submissions,
  }));
}
