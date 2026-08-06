import { describe, expect, it } from "vitest";
import {
  generateParentAccessCode,
  PARENT_ACCESS_CODE_LENGTH,
} from "./parent-access";

describe("generateParentAccessCode", () => {
  it("creates an uppercase, unambiguous access code", () => {
    const code = generateParentAccessCode();
    expect(code).toHaveLength(PARENT_ACCESS_CODE_LENGTH);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
  });

  it("creates distinct codes across a practical sample", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateParentAccessCode()),
    );
    expect(codes.size).toBe(100);
  });
});
