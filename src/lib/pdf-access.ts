import type { Role } from "@prisma/client";

export function canRequestPdfVariant(
  role: Role,
  variant: "student" | "teacher",
) {
  return variant === "student" || role === "TEACHER";
}

export function studentCanAccessReport(
  requestedStudentId: string,
  viewerStudentId: string | null | undefined,
) {
  return Boolean(viewerStudentId && requestedStudentId === viewerStudentId);
}
