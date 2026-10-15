import { criarAssistente } from "./assistente";
export const assistenteLocal = criarAssistente(async () => {
  throw new Error("Exemplo local de demonstração");
});
export async function comFallbackLocal<T>(
  chamada: () => Promise<T>,
  fallback: () => Promise<T>,
  timeoutMs = 8000,
): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return fallback();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      chamada(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Sem resposta do servidor")),
          timeoutMs,
        );
      }),
    ]);
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}
