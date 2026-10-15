import { z } from "zod";
export const COOKIE_RETORNO = "entre_elas_retorno";
export function rotaPiloto(entrada: unknown) {
  const p = z
    .object({
      aba: z
        .enum([
          "faiscas",
          "rede",
          "comunidades",
          "saberes",
          "agenda",
          "perfil",
          "lideranca",
        ])
        .optional()
        .catch(undefined),
      encontro: z.uuid().optional().catch(undefined),
    })
    .parse(entrada);
  const query = new URLSearchParams();
  if (p.aba) query.set("aba", p.aba);
  if (p.encontro) query.set("encontro", p.encontro);
  return "/piloto" + (query.size ? "?" + query.toString() : "");
}
export function normalizarRetorno(entrada: unknown) {
  const valor = z.string().max(500).catch("/piloto").parse(entrada);
  try {
    const url = new URL(valor, "https://retorno.invalid");
    if (
      url.origin !== "https://retorno.invalid" ||
      url.pathname !== "/piloto" ||
      !valor.startsWith("/piloto")
    )
      return "/piloto";
    return rotaPiloto(Object.fromEntries(url.searchParams));
  } catch {
    return "/piloto";
  }
}
