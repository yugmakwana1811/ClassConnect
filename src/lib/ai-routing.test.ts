import { describe, expect, it } from "vitest";
import { AI_MODELS, selectAIModel } from "./ai-routing";

describe("subject-aware AI routing", () => {
  it.each([
    ["Mathematics", "Quadratic equations", AI_MODELS.reasoning.id],
    ["Physics", "Electricity", AI_MODELS.reasoning.id],
    ["Computer Science", "Python loops", AI_MODELS.reasoning.id],
    ["Accountancy", "Goodwill valuation", AI_MODELS.balanced.id],
    ["Business Studies", "Marketing mix", AI_MODELS.balanced.id],
    ["English", "Poetry analysis", AI_MODELS.language.id],
    ["Assamese", "Poetry analysis", AI_MODELS.language.id],
    ["Tamil", "Grammar", AI_MODELS.language.id],
    ["History", "Nationalism in India", AI_MODELS.language.id],
    ["Social Science", "Indian democracy", AI_MODELS.language.id],
    ["Psychology", "Learning theories", AI_MODELS.language.id],
    ["Data Science", "Data visualisation", AI_MODELS.reasoning.id],
    ["Taxation", "GST basics", AI_MODELS.balanced.id],
  ])("routes %s to its approved model", (subject, topic, expected) => {
    expect(selectAIModel({ subject, topic, type: "EXPLANATION" }).id).toBe(
      expected,
    );
  });

  it("uses language generation for announcements regardless of subject", () => {
    expect(
      selectAIModel({
        subject: "Mathematics",
        topic: "Tomorrow's homework",
        type: "ANNOUNCEMENT",
      }).id,
    ).toBe(AI_MODELS.language.id);
  });
});
