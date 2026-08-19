import { describe, expect, it } from "vitest";
import { createClassCode } from "./class-code";

describe("class codes", () => {
  it("creates six-character codes without ambiguous characters", () => {
    for (let index = 0; index < 50; index += 1)
      expect(createClassCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
