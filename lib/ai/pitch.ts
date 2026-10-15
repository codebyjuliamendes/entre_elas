import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { criarAssistente, type GeradorPitch } from "@/lib/demo/assistente";
const gerar: GeradorPitch = async (prompt, schema, signal) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || process.env.PITCH_AI_MODE !== "live")
    throw new Error("Modo de apresentação");
  const provider = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
  });
  const result = await generateObject({
    model: provider(
      process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free",
    ),
    schema,
    prompt,
    abortSignal: signal,
    maxRetries: 0,
    maxOutputTokens: 2500,
    temperature: 0.4,
  });
  return result.object;
};
export const assistentePitch = criarAssistente(gerar);
