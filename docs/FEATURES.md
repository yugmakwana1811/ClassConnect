# EduGrade AI production scope

## Implemented

- Self-service teacher, student, and parent registration with strong password policy, show-password controls, hashed credentials, persistent database sessions, HTTP-only cookies, role-protected routes, login throttling, profile editing, password changes, and other-session invalidation.
- Teacher class creation, list-level opening, assignment shortcuts, renaming, permanent deletion with exact-name confirmation and uploaded-file cleanup, secure six-character enrollment codes, code rotation, student enrollment, roster viewing, and teacher-controlled removal.
- Assignment draft creation and editing, optional private attachments, publishing, closing submissions, deadline validation in the India classroom timezone, and persistent status tracking.
- Private multi-image handwritten answer uploads with type/size validation, ordered previews, removal before final submission, metadata persistence, and protected teacher/student file routes.
- Teacher review queues for real test, assignment, and worksheet files; protected question-paper and answer-page viewing; auto-graded quiz-attempt evidence; editable AI feedback suggestions; mark validation; draft review state; teacher-controlled result publication; and student result history.
- Teacher-authored quizzes with 1–20 validated multiple-choice questions, unique options, explanations, draft/publish/delete lifecycle, student attempts, deterministic scoring, retry support, attempt analytics, and test-only fullscreen lockdown that blocks in-app navigation and common window/tab actions while pausing on focus, visibility, or fullscreen loss.
- AI lesson plans, explanations, notes, questions, quiz drafts, revision sheets, announcements, feedback suggestions, student doubt help, and revision support through a replaceable server-only service abstraction. Output streams as it is generated; provider and model metadata remain server-side.
- Private resource uploads, resource deletion, announcements and deletion, attendance records, activity logs, loading states, error boundaries, empty states, confirmation dialogs, and responsive role-specific navigation.
- Teacher and student dashboards and analytics calculated from persistent assignments, results, attendance, quizzes, AI learning history, and activity data. Topic insights show evidence counts and remain advisory.
- Parent-student linking through revocable student-controlled access codes, with relationship-scoped parent dashboards, marks, quiz performance, attendance, AI Studio learning history, announcements, and a compact expandable activity timeline.
- Versioned PostgreSQL baseline migration, idempotent expo seed, environment template, CI quality gate, deployment instructions, testing instructions, health endpoint, security headers, and private Vercel Blob integration.

## Deliberate limitations

- AI output is assistive only. It does not autonomously grade handwriting or make final academic decisions; teachers review, edit, set marks, and publish.
- Live generation uses OpenRouter through a server-only, subject-aware allowlist with failover. Users and environment variables cannot select a model. Without `OPENROUTER_API_KEY`, or when the provider is unavailable, the server uses deterministic curriculum-safe templates without exposing provider details to users.
- The configured free model endpoint must not receive personal or confidential information. AI prompts warn users accordingly, and automated feedback prompts exclude student names and answer content.
- Quiz duration is a suggested pacing target, not a server-enforced countdown. This avoids claiming timed-exam enforcement that is not implemented.
- Signed-in users can change their sign-in email after current-password verification; the address is entered twice, must be unique, is audit-logged, and other sessions are revoked. Mailbox ownership verification and automated email-based password recovery remain unavailable because no transactional email provider is configured; locked-out users still require verified support assistance.
- Notifications are currently in-app announcements and dashboard states; email, SMS, and push delivery are not configured.
- The product is optimized for CBSE classrooms in the `Asia/Kolkata` timezone and provides classroom learning analytics, not a school-wide SIS, fee, transport, or billing system.
