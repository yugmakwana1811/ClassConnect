import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const baseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;
if (!baseUrl) throw new Error("A PostgreSQL connection URL is required for isolated seed verification.");

const schema = `edugrade_demo_qa_${process.pid}_${Date.now()}`;
if (!/^edugrade_demo_qa_[a-zA-Z0-9_]+$/.test(schema))
  throw new Error("Generated QA schema name is invalid.");
const isolated = new URL(baseUrl);
isolated.searchParams.set("schema", schema);
isolated.searchParams.set("options", `-c search_path=${schema},public`);
const childEnv = {
  ...process.env,
  DATABASE_URL: isolated.toString(),
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

async function main() {
  try {
    run("npx", ["prisma", "migrate", "deploy"]);
    run("npm", ["run", "db:seed"]);
    run("npm", ["run", "db:verify-demo"]);
    run("npm", ["run", "db:seed"]);
    run("npm", ["run", "db:verify-demo"]);
    console.log("Isolated demo seed verification passed twice without duplicates.");
  } finally {
    const admin = new PrismaClient({ datasourceUrl: baseUrl });
    try {
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.$disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
