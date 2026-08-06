import { describe, expect, it } from "vitest";
import {
  getAuthSecret,
  hasValidServerActionKey,
  productionConfiguration,
} from "./runtime-config";

describe("runtime configuration", () => {
  it("allows the documented development fallback only outside production", () => {
    expect(getAuthSecret({ NODE_ENV: "development" })).toBe(
      "development-only-change-me",
    );
    expect(() => getAuthSecret({ NODE_ENV: "production" })).toThrow(
      /AUTH_SECRET/,
    );
    expect(() =>
      getAuthSecret({ NODE_ENV: "production", AUTH_SECRET: "too-short" }),
    ).toThrow(/32 characters/);
  });

  it("accepts only base64 AES key lengths supported by Next.js", () => {
    expect(hasValidServerActionKey(Buffer.alloc(32).toString("base64"))).toBe(
      true,
    );
    expect(hasValidServerActionKey(Buffer.alloc(17).toString("base64"))).toBe(
      false,
    );
    expect(hasValidServerActionKey(undefined)).toBe(false);
  });

  it("requires auth, private storage, and stable actions in production", () => {
    expect(productionConfiguration({ NODE_ENV: "production" }).ready).toBe(
      false,
    );
    expect(
      productionConfiguration({
        NODE_ENV: "production",
        AUTH_SECRET: "a".repeat(32),
        BLOB_READ_WRITE_TOKEN: "blob-token",
        NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
      }).ready,
    ).toBe(true);
  });
});
