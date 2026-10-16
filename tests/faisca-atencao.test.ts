import { describe, it, expect } from "vitest";
import { listarAtencaoFaiscas } from "@/lib/domain/faisca-atencao";
import { faisca } from "@/lib/schemas/entities";
import { uuid } from "@/scripts/fixtures";
const base = faisca.parse({
  id: uuid(950),
  solicitante_id: uuid(1),
  convidada_id: uuid(2),
  pedido: "Quero aprender a comunicar ideias",
  tema: "Comunicação",
  horarios_propostos: ["2050-01-01T12:00:00Z"],
  horario: null,
  status: "pendente",
  pauta: null,
  anotacoes: {},
  resumo: null,
  publicacao_autorizada_por: [],
  stream_channel_id: null,
  daily_room_url: null,
  created_at: "2026-10-15T12:00:00Z",
  updated_at: "2026-10-15T12:00:00Z",
});
function listar(encontros: (typeof base)[], publicadas: string[] = []) {
  return listarAtencaoFaiscas({ encontros, usuaria_id: uuid(1), publicadas });
}
describe("Atenção da participante nas Faíscas", () => {
  it("não transforma espera, recusas ou encontros alheios em pendências próprias", () => {
    expect(
      listar([
        base,
        { ...base, status: "recusada" },
        { ...base, status: "cancelada" },
        { ...base, solicitante_id: uuid(3) },
        { ...base, status: "aceita", anotacoes: { [uuid(1)]: "Minhas notas" } },
        { ...base, status: "realizada", publicacao_autorizada_por: [uuid(1)] },
      ]),
    ).toEqual([]);
  });
  it("prioriza convite recebido e publicação consentida, antes de iniciar conversa", () => {
    const resultado = listar([
      { ...base, status: "aceita" },
      {
        ...base,
        id: uuid(951),
        status: "realizada",
        publicacao_autorizada_por: [uuid(1), uuid(2)],
      },
      {
        ...base,
        id: uuid(952),
        solicitante_id: uuid(2),
        convidada_id: uuid(1),
      },
    ]);
    expect(resultado.map((i) => i.tipo)).toEqual([
      "convite",
      "publicacao",
      "conversa",
    ]);
    expect(resultado[0].pessoa_id).toBe(uuid(2));
  });
  it("considera revisão individual, síntese com duas notas e publicação já feita", () => {
    const encontros = [
      { ...base, status: "realizada" as const },
      {
        ...base,
        id: uuid(951),
        status: "aceita" as const,
        anotacoes: { [uuid(1)]: "Uma nota", [uuid(2)]: "Outra nota" },
      },
    ];
    expect(listar(encontros).map((i) => i.tipo)).toEqual([
      "revisao",
      "sintese",
    ]);
    expect(listar(encontros, [base.id]).map((i) => i.tipo)).toEqual([
      "sintese",
    ]);
  });
  it("ordena conversas pelo horário, independentemente da ordem recebida do servidor", () => {
    const tarde = {
      ...base,
      status: "aceita" as const,
      horario: "2050-01-01T15:00:00Z",
    };
    const cedo = { ...tarde, id: uuid(951), horario: "2050-01-01T12:00:00Z" };
    expect(listar([tarde, cedo]).map((i) => i.faisca_id)).toEqual([
      cedo.id,
      tarde.id,
    ]);
  });
});
