import { isCbseLanguageSubject } from "./education";

export const AI_MODELS = {
  reasoning: {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron 3 Ultra",
    maxTokens: 4_096,
    reasoning: { max_tokens: 1_024, exclude: true },
    temperature: 0.25,
  },
  balanced: {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super",
    maxTokens: 3_200,
    reasoning: { max_tokens: 768, exclude: true },
    temperature: 0.3,
  },
  language: {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    maxTokens: 3_200,
    reasoning: null,
    temperature: 0.45,
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
  const secondary =
    primary.id === AI_MODELS.balanced.id
      ? AI_MODELS.reasoning
      : AI_MODELS.balanced;
  return [primary, secondary];
}
