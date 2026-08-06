-- Add indexes for foreign-key cleanup and the application's common filtered timelines.
-- This migration is additive and does not alter or remove application data.
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "ClassEnrollment_studentId_idx" ON "ClassEnrollment"("studentId");
CREATE INDEX "AssignmentAttachment_assignmentId_idx" ON "AssignmentAttachment"("assignmentId");
CREATE INDEX "Submission_studentId_status_idx" ON "Submission"("studentId", "status");
CREATE INDEX "Feedback_submissionId_createdAt_idx" ON "Feedback"("submissionId", "createdAt");
CREATE INDEX "Quiz_classId_published_idx" ON "Quiz"("classId", "published");
CREATE INDEX "QuizQuestion_quizId_order_idx" ON "QuizQuestion"("quizId", "order");
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX "QuizAttempt_studentId_submittedAt_idx" ON "QuizAttempt"("studentId", "submittedAt");
CREATE INDEX "Resource_classId_createdAt_idx" ON "Resource"("classId", "createdAt");
CREATE INDEX "Announcement_classId_publishedAt_idx" ON "Announcement"("classId", "publishedAt");
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");
CREATE INDEX "AttendanceRecord_studentId_date_idx" ON "AttendanceRecord"("studentId", "date");
CREATE INDEX "AIContentGeneration_userId_createdAt_idx" ON "AIContentGeneration"("userId", "createdAt");
