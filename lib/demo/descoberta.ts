import { z } from "zod";
import { perfisDemo, ANA_ID, perfilDemoSchema } from "./catalogo";
import { normalizar } from "./texto";
import { analisarConexao } from "./curadoria";
export { normalizar };
const stop = new Set([
  "para",
  "como",
  "quero",
  "aprender",
  "minha",
  "meu",
  "uma",
  "com",
  "sobre",
  "preciso",
  "ajuda",
  "mais",
  "que",
  "por",
  "ter",
  "primeiro",
]);
export function filtrarPessoas(entrada: unknown) {
  const input = z
    .object({
      busca: z.string().max(1500).default(""),
      area: z.string().default("todas"),
      regional: z.string().default("todas"),
    })
    .parse(entrada);
  const termos = normalizar(input.busca)
    .split(/\W+/)
    .filter((t) => t.length > 2 && !stop.has(t));
  return z
    .array(perfilDemoSchema)
    .parse(
      perfisDemo.filter(
        (p) =>
          p.id !== ANA_ID &&
          (input.area === "todas" || p.area === input.area) &&
          (input.regional === "todas" || p.regional === input.regional) &&
          termos.every((t) =>
            normalizar(
              [
                p.nome,
                p.cargo,
                p.area,
                p.regional,
                ...p.saberes,
                ...p.tags,
              ].join(" "),
            ).includes(t),
          ),
      ),
    );
}
export function recomendarPessoa(pedido: string, excluir?: string) {
  return perfilDemoSchema.parse(
    analisarConexao({ pedido, excluir }).candidatas[0],
  );
}
