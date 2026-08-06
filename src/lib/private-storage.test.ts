import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteStoredFile,
  readLocalPrivateFile,
  storeFile,
} from "./storage";

const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

describe("development private storage", () => {
  beforeEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  afterEach(() => {
    if (originalBlobToken) process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    else delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("keeps local fallback files behind an opaque private reference", async () => {
    const url = await storeFile(
      new File(["private lesson"], "lesson.txt", { type: "text/plain" }),
      "test-files",
    );
    expect(url).toMatch(/^local-private:\/\/test-files\//);
    expect(url).not.toContain("/public/");
    expect((await readLocalPrivateFile(url)).toString()).toBe("private lesson");
    await deleteStoredFile(url);
    await expect(readLocalPrivateFile(url)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rejects traversal outside the private upload root", async () => {
    await expect(
      readLocalPrivateFile("local-private://../../package.json"),
    ).rejects.toThrow("Invalid local file reference");
  });
});
