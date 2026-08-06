# EduGrade AI

EduGrade AI is a Next.js 16 classroom workspace for teachers, students, and parents. It combines class and assignment management, private answer-page review, quizzes, attendance, role-scoped learning analytics, parent progress visibility, and server-streamed AI teaching support.

## Local setup

1. Copy `.env.example` to `.env.local` and configure PostgreSQL. Private Blob storage is required in production; local development uses protected filesystem storage when a Blob token is absent.
2. Install and prepare the database:

   ```bash
   npm ci
   npm run db:deploy
   npm run db:seed # optional demo data
   ```

3. Start the app with `npm run dev`.

The full quality gate is `npm run check`. See [deployment guidance](docs/DEPLOYMENT.md), [manual regression paths](docs/TESTING.md), and the [implemented product scope](docs/FEATURES.md).

Never use a production database for destructive or experimental testing.
