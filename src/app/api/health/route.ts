import { checkDatabaseConnection } from "@/lib/db";
import { productionConfiguration } from "@/lib/runtime-config";

export async function GET() {
  const database = await checkDatabaseConnection();
  const configuration = productionConfiguration();
  const aiConfigured = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  const ready = database.ok && configuration.ready;
  return Response.json(
    {
      status: ready ? "ready" : "degraded",
      database: database.ok ? "connected" : "unavailable",
      auth: configuration.authConfigured ? "configured" : "unavailable",
      storage: configuration.storageConfigured ? "configured" : "unavailable",
      serverActions: configuration.serverActionsConfigured
        ? "configured"
        : "unavailable",
      ai: aiConfigured ? "configured" : "fallback",
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
