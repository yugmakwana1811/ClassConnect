import { isCbseLanguageSubject } from "./education";

export const AI_MODELS = {
  reasoning: {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    maxTokens: 4_096,
    reasoning: { max_tokens: 1_024, exclude: true },
    temperature: 0.25,
  },
  balanced: {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    maxTokens: 4_096,
    reasoning: { max_tokens: 1_024, exclude: true },
    temperature: 0.25,
  },
  language: {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    maxTokens: 4_096,
    reasoning: { max_tokens: 1_024, exclude: true },
    temperature: 0.25,
  },
  fallback: {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super",
    maxTokens: 4_096,
    reasoning: { max_tokens: 768, exclude: true },
    temperature: 0.25,
  },
} as const;

export type AIModelConfig = (typeof AI_MODELS)[keyof typeof AI_MODELS];

type RoutingInput = {
  subject: string;
  topic: string;
  type: string;
};

const stemPattern =
  /\b(math(?:ematic)?s?|algebra|geometry|trigonometry|calculus|statistics|physics|chemistry|biology|biotechnology|science|computer|coding|programming|informatics|data science|artificial intelligence|engineering|electronics?|electrical|automotive|agriculture|horticulture|medical diagnostics|health care|web applications?|geospatial|pharmaceutical)\b/i;
const commercePattern =
  /\b(account(?:ancy|ing)?|book keeping|business|commerce|economics?|entrepreneurship|finance|financial markets?|marketing|salesmanship|retail|banking|insurance|taxation|office procedures|business administration)\b/i;
const languageHumanitiesPattern =
  /\b(language|literature|grammar|writing|history|geography|political|civics|social science|humanities|psychology|sociology|legal studies|fine arts?|painting|music|dance|mass media|library|knowledge tradition|physical education|home science|tourism|photography|design)\b/i;

export function selectAIModel(input: RoutingInput): AIModelConfig {
  const routingText = `${input.subject} ${input.topic}`;
  if (input.type === "ANNOUNCEMENT") return AI_MODELS.language;
  if (isCbseLanguageSubject(input.subject)) return AI_MODELS.language;
  if (commercePattern.test(routingText)) return AI_MODELS.balanced;
  if (languageHumanitiesPattern.test(routingText)) return AI_MODELS.language;
  if (stemPattern.test(routingText)) return AI_MODELS.reasoning;
  return AI_MODELS.balanced;
}

export function getAIModelCandidates(input: RoutingInput): AIModelConfig[] {
  const primary = selectAIModel(input);
  const secondary = AI_MODELS.fallback;
  return primary.id === secondary.id ? [primary] : [primary, secondary];
}
