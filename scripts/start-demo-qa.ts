import { spawn, spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const baseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;
if (!baseUrl) throw new Error("A PostgreSQL connection URL is required for the QA demo server.");
const schema = `edugrade_demo_qa_server_${process.pid}`;
const isolated = new URL(baseUrl);
isolated.searchParams.set("schema", schema);
isolated.searchParams.set("options", `-c search_path=${schema},public`);
const port = process.env.DEMO_QA_PORT ?? "3128";
const childEnv: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: isolated.toString(),
  AUTH_SECRET:
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32
      ? process.env.AUTH_SECRET
      : "edugrade-demo-qa-auth-secret-2026-only",
  NODE_ENV: "production",
  PORT: port,
  PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
};

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: childEnv,
    stdio: "inherit",
  });
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}.`);
}

async function cleanup() {
  const admin = new PrismaClient({ datasourceUrl: baseUrl });
  try {
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await admin.$disconnect();
  }
}

async function main() {
  run("npx", ["prisma", "migrate", "deploy"]);
  run("npm", ["run", "db:seed"]);
  run("npm", ["run", "db:verify-demo"]);
  const server = spawn("npm", ["run", "start", "--", "-p", port], {
    cwd: process.cwd(),
    env: childEnv,
    stdio: "inherit",
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.kill("SIGTERM");
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  const exitCode = await new Promise<number>((resolve) =>
    server.on("exit", (code) => resolve(code ?? 0)),
  );
  await cleanup();
  process.exitCode = stopping ? 0 : exitCode;
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await cleanup().catch(() => undefined);
  process.exitCode = 1;
});
