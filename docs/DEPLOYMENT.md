# ClassConnect deployment

ClassConnect is a Next.js 16 application designed for Node.js 24, PostgreSQL, and private object storage. The production deployment currently uses Vercel, Neon Postgres, and private Vercel Blob storage.

## Required environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local` or paste production values into source code.

- `DATABASE_URL`: pooled PostgreSQL connection string with TLS enabled.
- `AUTH_SECRET`: at least 32 random bytes; signs session-token hashes and authentication throttle keys.
- `BLOB_READ_WRITE_TOKEN`: private Vercel Blob token used for teaching resources and answer pages.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: stable 32-byte base64 key shared by all production instances.
- `OPENROUTER_API_KEY`: optional server-only OpenRouter credential. The app uses deterministic, teaching-safe fallback generation when absent. Subject-aware model routing and failover use a server-controlled allowlist; there is no model-selection environment variable or client input.

Generate application secrets locally with `openssl rand -base64 32`. Add values through `vercel env add` or the Vercel project settings; do not pass secret values on a command line that is recorded in shell history. Never commit an OpenRouter key or expose it with a `NEXT_PUBLIC_` prefix.

## Fresh environment

1. Create a PostgreSQL database and a private Blob store.
2. Configure the environment variables above.
3. Install dependencies with `npm ci`.
4. Apply versioned migrations with `npm run db:deploy`.
5. Optionally load the expo scenario once with `npm run db:seed`.
6. Validate with `npm run check`.
7. Deploy with `vercel --prod` or connect the GitHub repository to Vercel.

The seed is idempotent and is not required for normal user registration. Do not run it automatically on every deployment.

## Existing database baseline

The first checked-in migration is a baseline for databases that predate migration tracking. For an existing database whose schema already matches `prisma/schema.prisma`, run `npx prisma migrate resolve --applied 20260722000000_baseline` exactly once. Fresh databases should use `npm run db:deploy` normally.

## Release checks

Before production promotion:

- Run `npm run check` and `npm audit --omit=dev`.
- Run `npx prisma migrate status` against the target database.
- Confirm `/api/health` reports `database: connected`, `auth: configured`, `storage: configured`, `serverActions: configured`, and either `ai: configured` or the documented `ai: fallback` mode.
- Exercise teacher, student, and parent registration; class enrollment; parent linking; assignment upload/review; result publication; quizzes; and streamed AI output.
- Inspect production error logs after the deployment.

Rollback application code through Vercel deployment promotion. Database migrations require a reviewed forward-fix migration; never use destructive schema reset commands against production.
