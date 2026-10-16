import { consumirIA } from "@/lib/piloto/ia";
import { createHash } from "node:crypto";
import { z } from "zod";
import { ErroIA } from "@/lib/domain/erros";
import { getDb, verificarErro } from "@/lib/db/client";
import { dimensaoEmbedding } from "@/lib/config";
import { gerarGemini, embedGemini } from "./gemini";
import { gerarGroq } from "./groq";
export type Gerador = (
  prompt: string,
  schema: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<string>;
export interface Cache {
  ler(chave: string): Promise<unknown | null>;
  gravar(chave: string, resposta: unknown): Promise<void>;
}
export interface DependenciasIA {
  gemini: Gerador;
  groq: Gerador;
  embedding: (texto: string, signal?: AbortSignal) => Promise<number[]>;
  cache: Cache;
  timeoutMs?: number;
}
export interface OpcoesIA {
  cache?: boolean;
  versao?: string;
  prazoMs?: number;
  signal?: AbortSignal;
  validar?: (resultado: unknown) => void;
}
const cacheDb: Cache = {
  async ler(chave) {
    const { data, error } = await getDb()
      .from("ia_cache")
      .select("resposta")
      .eq("chave", chave)
      .maybeSingle();
    verificarErro(error);
    return data?.resposta ?? null;
  },
  async gravar(chave, resposta) {
    const { error } = await getDb()
      .from("ia_cache")
      .upsert(
        { chave, resposta: z.json().parse(resposta) },
        { onConflict: "chave" },
      );
    verificarErro(error);
  },
};
// Cache é uma otimização; sua indisponibilidade não deve invalidar uma resposta real.
async function cacheOpcional<T>(acao: () => Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      acao(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 500);
      }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
async function comLimite<T>(
  acao: (signal: AbortSignal) => Promise<T>,
  tempo: number,
  externo?: AbortSignal,
): Promise<T> {
  if (externo?.aborted) throw new ErroIA("Tempo limite da IA excedido.", 408);
  const controller = new AbortController();
  const signal = externo
    ? AbortSignal.any([controller.signal, externo])
    : controller.signal;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let interromper: (() => void) | undefined;
  try {
    return await Promise.race([
      acao(signal),
      new Promise<never>((_, reject) => {
        interromper = () =>
          reject(new ErroIA("Tempo limite da IA excedido.", 408));
        signal.addEventListener("abort", interromper, { once: true });
        timer = setTimeout(() => controller.abort(), Math.max(1, tempo));
        if (signal.aborted) interromper();
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (interromper) signal.removeEventListener("abort", interromper);
    controller.abort();
  }
}
export function criarProvider(deps: DependenciasIA) {
  return {
    async gerar<T>(
      prompt: string,
      schema: z.ZodType<T>,
      opcoes: OpcoesIA = {},
    ): Promise<T> {
      z.string().min(1).parse(prompt);
      return comLimite(
        async (signal) => {
          const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
          const chave = createHash("sha256")
            .update(
              JSON.stringify([
                prompt,
                opcoes.versao ?? "1",
                jsonSchema,
                process.env.GEMINI_MODEL,
                process.env.GROQ_MODEL,
              ]),
            )
            .digest("hex");
          if (opcoes.cache) {
            const valor = await cacheOpcional(() => deps.cache.ler(chave));
            const cached = schema.safeParse(valor);
            if (valor !== null && cached.success) {
              try {
                opcoes.validar?.(cached.data);
                return cached.data;
              } catch {
                /* Uma resposta sem fundamentação não é reutilizada. */
              }
            }
          }
          async function tentar(gerador: Gerador, tempo: number): Promise<T> {
            return comLimite(
              async (tentativaSignal) => {
                for (let tentativa = 0; tentativa < 2; tentativa++) {
                  if (tentativaSignal.aborted)
                    throw new ErroIA("Tempo limite da IA excedido.", 408);
                  const resposta = await gerador(
                    prompt +
                      (tentativa
                        ? "\nCorrija a saída anterior: responda apenas JSON válido no schema fornecido."
                        : ""),
                    jsonSchema,
                    tentativaSignal,
                  );
                  try {
                    const resultado = schema.parse(JSON.parse(resposta));
                    opcoes.validar?.(resultado);
                    return resultado;
                  } catch {
                    if (tentativa === 1)
                      throw new ErroIA(
                        "A IA não conseguiu retornar uma resposta válida após duas tentativas.",
                        422,
                      );
                  }
                }
                throw new ErroIA("Não foi possível gerar a resposta.");
              },
              tempo,
              signal,
            );
          }
          let result: T;
          try {
            result = await tentar(deps.gemini, deps.timeoutMs ?? 8000);
          } catch (error) {
            const status = error instanceof ErroIA ? error.status : undefined;
            const temporario =
              status === 408 ||
              status === 429 ||
              status === 422 ||
              (status !== undefined && status >= 500 && status <= 599) ||
              error instanceof TypeError;
            if (!temporario || signal.aborted) throw error;
            // O prazo externo abrange cache e ambos os provedores, sem reiniciar o relógio.
            result = await tentar(deps.groq, opcoes.prazoMs ?? 18000);
          }
          if (opcoes.cache && !signal.aborted)
            await cacheOpcional(() => deps.cache.gravar(chave, result));
          return schema.parse(result);
        },
        opcoes.prazoMs ?? 18000,
        opcoes.signal,
      );
    },
    async embed(
      texto: string,
      opcoes: Pick<OpcoesIA, "signal"> = {},
    ): Promise<number[]> {
      z.string().trim().min(1).max(20000).parse(texto);
      return comLimite(
        async (signal) => {
          const chave =
            "embed:" +
            createHash("sha256")
              .update(
                JSON.stringify([
                  process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
                  dimensaoEmbedding(),
                  texto,
                ]),
              )
              .digest("hex");
          const schema = z
            .array(z.number().finite())
            .length(dimensaoEmbedding());
          const cached = schema.safeParse(
            await cacheOpcional(() => deps.cache.ler(chave)),
          );
          const valores = cached.success
            ? cached.data
            : schema.parse(await deps.embedding(texto, signal));
          const norma = Math.sqrt(valores.reduce((sum, x) => sum + x * x, 0));
          if (!norma) throw new ErroIA("Embedding nulo retornado pela IA.");
          const normalizado = valores.map((x) => x / norma);
          if (!cached.success && !signal.aborted)
            await cacheOpcional(() => deps.cache.gravar(chave, normalizado));
          return schema.parse(normalizado);
        },
        10000,
        opcoes.signal,
      );
    },
  };
}
const provider = criarProvider({
  gemini: gerarGemini,
  groq: gerarGroq,
  embedding: embedGemini,
  cache: cacheDb,
});
export async function gerar<T>(
  prompt: string,
  schema: z.ZodType<T>,
  opcoes: OpcoesIA = {},
) {
  await consumirIA();
  return provider.gerar(prompt, schema, opcoes);
}
export async function embed(
  texto: string,
  opcoes: Pick<OpcoesIA, "signal"> = {},
) {
  await consumirIA();
  return provider.embed(texto, opcoes);
}
