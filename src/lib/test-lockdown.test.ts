import { describe, expect, it } from "vitest";
import { isBlockedTestShortcut } from "./test-lockdown";

const key = (
  value: string,
  modifiers: Partial<{
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  }> = {},
) => ({
  key: value,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

describe("test lockdown shortcuts", () => {
  it.each(["F5", "F6", "F11", "F12"])("blocks %s", (value) => {
    expect(isBlockedTestShortcut(key(value))).toBe(true);
  });

  it.each(["t", "n", "w", "l", "r", "p", "u"])(
    "blocks control/meta + %s",
    (value) => {
      expect(
        isBlockedTestShortcut(key(value, { ctrlKey: true })),
      ).toBe(true);
      expect(
        isBlockedTestShortcut(key(value, { metaKey: true })),
      ).toBe(true);
    },
  );

  it("blocks tab and window navigation combinations", () => {
    expect(isBlockedTestShortcut(key("Tab", { ctrlKey: true }))).toBe(true);
    expect(isBlockedTestShortcut(key("Tab", { metaKey: true }))).toBe(true);
    expect(isBlockedTestShortcut(key("Tab", { altKey: true }))).toBe(true);
    expect(
      isBlockedTestShortcut(key("ArrowLeft", { altKey: true })),
    ).toBe(true);
  });

  it("keeps ordinary answer navigation available", () => {
    expect(isBlockedTestShortcut(key("Tab"))).toBe(false);
    expect(isBlockedTestShortcut(key("ArrowDown"))).toBe(false);
    expect(isBlockedTestShortcut(key(" "))).toBe(false);
  });
});
