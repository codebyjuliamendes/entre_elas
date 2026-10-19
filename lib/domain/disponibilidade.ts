import { z } from "zod";
// "Abro Faíscas": quantos convites a pessoa topa receber em 30 dias (0 pausa).
// A regra que vale é a do banco (piloto_criar_convite); esta versão orienta a interface.
export const OPCOES_FAISCAS_POR_MES = [0, 2, 4, 8] as const;
export const faiscasPorMes = z.number().int().min(0).max(20);
export const disponibilidadeSchema = z.object({
  estado: z.enum(["aberta", "sem_vagas", "pausada"]),
  limite: faiscasPorMes,
  vagas: z.number().int().min(0),
});
export type Disponibilidade = z.infer<typeof disponibilidadeSchema>;
export function calcularDisponibilidade(
  limite: number,
  recebidos: number,
): Disponibilidade {
  const l = faiscasPorMes.parse(limite);
  const vagas = Math.max(0, l - z.number().int().min(0).parse(recebidos));
  return disponibilidadeSchema.parse({
    estado: l === 0 ? "pausada" : vagas === 0 ? "sem_vagas" : "aberta",
    limite: l,
    vagas,
  });
}
export function descreverDisponibilidade(d: Disponibilidade) {
  if (d.estado === "pausada") return "Pausou novos convites";
  if (d.estado === "sem_vagas") return "Sem vagas neste mês";
  return d.vagas === 1 ? "1 vaga neste mês" : `${d.vagas} vagas neste mês`;
}
