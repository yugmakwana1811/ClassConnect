# Testing ClassConnect

Run the complete local gate with:

```bash
npm ci
npm run check
npm audit --omit=dev
```

The gate includes Prisma schema validation, TypeScript checking, ESLint, Vitest unit tests, Prisma Client generation, and a production Next.js build. Prisma CLI commands load the same root `.env*` hierarchy as Next.js, including the gitignored `.env.local` used for local credentials.

For database-backed testing, use an isolated PostgreSQL database or Neon branch. Apply `npm run db:deploy`, optionally run `npm run db:seed`, start with `npm run dev`, and test all three roles. Never point destructive or experimental tests at the production branch.

Core manual regression paths:

1. Register one teacher, one student, and one parent with different email addresses; verify show-password controls and role redirects.
2. Create a class, join it using the generated code, and verify cross-role route protection.
3. From the teacher class list, rename a class, use its new-assignment shortcut, and delete a temporary class only after entering its exact name; verify canceling or a mismatched name preserves the class.
4. Create and publish an assignment with an attachment.
5. Upload multiple answer images, remove/reorder before submission, and finalize.
6. In Review Work, verify Test, Assignment, and Worksheet rows open their protected question files and rendered answer pages; edit feedback, save marks, and publish.
7. Verify completed quizzes appear separately as auto-graded evidence with the correct score and link to the quiz details.
8. Confirm unpublished results remain hidden and published results are visible to the enrolled learner only.
9. Create a quiz with unique options, publish it, attempt it as the learner, and verify scoring/explanations.
10. Start a learner quiz and verify it requires fullscreen, hides workspace navigation, blocks common new-tab/window shortcuts, pauses when fullscreen or focus is lost, resumes only after returning, and releases all restrictions after submission.
11. Update profile details, change a sign-in email and password with current-password verification, and verify other sessions are invalidated.
12. Confirm private file routes return `401` without a session and `404` for unauthorized classroom users.
13. Link the parent with the student's revocable access code; verify only linked-student marks, quizzes, attendance, announcements, AI Studio searches, and activity are visible. Expand and collapse the compact activity timeline, then unlink and confirm access is removed.
14. Generate teacher and student AI output; verify chunks render progressively, the completed record persists, no provider/model name appears, and upstream errors become a generic retry message.
15. Confirm `/api/health` reports database, authentication, private storage, and stable Server Action encryption readiness; AI may explicitly report the supported fallback mode.
