import { z } from "zod";
const resultado = z.object({
  estado: z.enum(["sem_consentimento", "sem_saberes", "pendente", "pronto"]),
  total: z.number().int().nonnegative(),
  indexados: z.number().int().nonnegative(),
  pendentes: z.array(z.string()),
});
export function avaliarIndexacao(entrada: unknown) {
  const input = z
    .object({
      consentimento: z.boolean(),
      interesses: z.array(z.string()),
      saberes: z.array(
        z.object({
          fonte: z.string(),
          saber: z.string(),
          embedding: z.string().nullable(),
        }),
      ),
    })
    .parse(entrada);
  const interesses = [...new Set(input.interesses)];
  const pendentes = interesses.filter(
    (saber) =>
      !input.saberes.some(
        (s) =>
          s.fonte === "perfil" && s.saber === saber && s.embedding !== null,
      ),
  );
  return resultado.parse({
    estado: !input.consentimento
      ? "sem_consentimento"
      : !interesses.length
        ? "sem_saberes"
        : pendentes.length
          ? "pendente"
          : "pronto",
    total: interesses.length,
    indexados: interesses.length - pendentes.length,
    pendentes,
  });
}
export type EstadoIndexacao = z.infer<typeof resultado>;
