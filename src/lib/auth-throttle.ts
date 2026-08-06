import "server-only";

import { createHmac } from "crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function secret() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET)
    throw new Error("AUTH_SECRET is required in production.");
  return process.env.AUTH_SECRET ?? "development-only-change-me";
}

async function clientAddress() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0] ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0] ??
    "unknown"
  ).trim();
}

export async function authThrottleKey(
  scope: "login" | "register" | "email-change" | "parent-link",
  identifier: string,
) {
  const address = await clientAddress();
  return createHmac("sha256", secret())
    .update(`${scope}:${identifier.toLowerCase()}:${address}`)
    .digest("hex");
}

export async function assertAuthAllowed(key: string) {
  const record = await db.authThrottle.findUnique({ where: { key } });
  if (record?.blockedUntil && record.blockedUntil > new Date()) {
    const waitMinutes = Math.max(
      1,
      Math.ceil((record.blockedUntil.getTime() - Date.now()) / 60000),
    );
    throw new Error(
      `Too many attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    );
  }
}

export async function recordAuthFailure(key: string) {
  const now = new Date();
  await db.$transaction(async (tx) => {
    const current = await tx.authThrottle.findUnique({ where: { key } });
    const inWindow =
      current && now.getTime() - current.windowStart.getTime() < WINDOW_MS;
    const attempts = inWindow ? current.attempts + 1 : 1;
    await tx.authThrottle.upsert({
      where: { key },
      create: { key, attempts, windowStart: now },
      update: {
        attempts,
        windowStart: inWindow ? current.windowStart : now,
        blockedUntil:
          attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null,
      },
    });
  });
}

export async function clearAuthFailures(key: string) {
  await db.authThrottle.deleteMany({ where: { key } });
}
