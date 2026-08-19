import { describe, expect, it } from "vitest";
import { splitMobileNavigation } from "@/lib/mobile-navigation";

describe("mobile workspace navigation", () => {
  it("keeps every teacher module reachable", () => {
    const modules = [
      "Overview",
      "Classes",
      "AI studio",
      "Resources",
      "Assignments",
      "Quizzes",
      "Review work",
      "Announcements",
      "Attendance",
      "Analytics",
    ];
    const { primary, overflow } = splitMobileNavigation(modules);
    expect(primary).toEqual(modules.slice(0, 4));
    expect([...primary, ...overflow]).toEqual(modules);
    expect(overflow).toContain("Analytics");
  });

  it("does not invent overflow items for short role menus", () => {
    const modules = ["Overview", "My children"];
    expect(splitMobileNavigation(modules)).toEqual({
      primary: modules,
      overflow: [],
    });
  });
});
