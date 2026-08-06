import "server-only";

const DEVELOPMENT_AUTH_SECRET = "development-only-change-me";
const MIN_AUTH_SECRET_LENGTH = 32;

type RuntimeEnvironment = {
  NODE_ENV?: string;
  AUTH_SECRET?: string;
  BLOB_READ_WRITE_TOKEN?: string;
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY?: string;
};

export function getAuthSecret(env: RuntimeEnvironment = process.env) {
  const secret = env.AUTH_SECRET?.trim();
  if (env.NODE_ENV === "production" && (!secret || secret.length < MIN_AUTH_SECRET_LENGTH))
    throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  return secret || DEVELOPMENT_AUTH_SECRET;
}

export function hasValidServerActionKey(value: string | undefined) {
  const encoded = value?.trim();
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
  try {
    const bytes = Buffer.from(encoded, "base64");
    const normalized = encoded.replace(/=+$/, "");
    return (
      [16, 24, 32].includes(bytes.length) &&
      bytes.toString("base64").replace(/=+$/, "") === normalized
    );
  } catch {
    return false;
  }
}

export function productionConfiguration(env: RuntimeEnvironment = process.env) {
  const authConfigured = Boolean(
    env.AUTH_SECRET?.trim() &&
      env.AUTH_SECRET.trim().length >= MIN_AUTH_SECRET_LENGTH,
  );
  const storageConfigured = Boolean(env.BLOB_READ_WRITE_TOKEN?.trim());
  const serverActionsConfigured = hasValidServerActionKey(
    env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
  );
  return {
    authConfigured,
    storageConfigured,
    serverActionsConfigured,
    ready:
      env.NODE_ENV !== "production" ||
      (authConfigured && storageConfigured && serverActionsConfigured),
  };
}
