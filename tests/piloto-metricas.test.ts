import { describe, it, expect } from "vitest";
import {
  avaliacaoFaiscaInput,
  consolidarIndicadores,
  resumoParaApresentacao,
} from "@/lib/piloto/metricas";
const A = "00000000-0000-4000-8000-0000000000a1",
  B = "00000000-0000-4000-8000-0000000000b2",
  C = "00000000-0000-4000-8000-0000000000c3";
const base = {
  inicio: "2026-10-18T00:00:00Z",
  contas: [
    { profile_id: A, onboarding: true },
    { profile_id: B, onboarding: true },
    { profile_id: C, onboarding: false },
  ],
  perfis: [
    { id: A, area: "Operações", regional: "Pará" },
    { id: B, area: "Operações", regional: "para " },
    { id: C, area: "Dados", regional: "Maranhão" },
  ],
  saberes_fonte_ids: ["f1", "f9", null],
  dicas_origem_ids: ["f1"],
  inscricoes: 2,
  mensagens: 5,
  avaliacoes: [
    { utilidade: 5, voltaria: true },
    { utilidade: 4, voltaria: false },
  ],
};
describe("Indicadores do piloto", () => {
  it("calcula funil, diversidade e avaliações só com dados recebidos", () => {
    const i = consolidarIndicadores({
      ...base,
      faiscas: [
        { id: "f1", solicitante_id: A, convidada_id: C, status: "realizada" },
        { id: "f2", solicitante_id: C, convidada_id: A, status: "aceita" },
        { id: "f3", solicitante_id: A, convidada_id: B, status: "realizada" },
        { id: "f4", solicitante_id: B, convidada_id: C, status: "recusada" },
        { id: "f5", solicitante_id: B, convidada_id: A, status: "pendente" },
      ],
    });
    expect(i).toMatchObject({
      participantes: 3,
      perfis_completos: 2,
      convites: 5,
      aceitas: 3,
      recusadas: 1,
      realizadas: 2,
      taxa_aceite: 75,
      pessoas_conectadas: 3,
      pares_distintos: 2,
      saberes_reconhecidos: 1,
      dicas_publicadas: 1,
      avaliacoes: { respostas: 2, utilidade_media: 4.5, voltariam: 50 },
    });
    // Regionais comparadas sem acento e sem diferença de caixa: A e B são do Pará.
    expect(i.entre_regionais).toBe(66.7);
    expect(i.entre_areas).toBe(66.7);
  });
  it("não inventa percentuais sem dados e sinaliza migração pendente", () => {
    const i = consolidarIndicadores({ ...base, faiscas: [], avaliacoes: null });
    expect(i.taxa_aceite).toBeNull();
    expect(i.entre_regionais).toBeNull();
    expect(i.avaliacoes).toBeNull();
    expect(resumoParaApresentacao(i)).toContain("taxa de aceite —");
  });
  it("avaliação aceita somente escala de 1 a 5", () => {
    const ok = { faisca_id: A, utilidade: 5, voltaria: true };
    expect(avaliacaoFaiscaInput.parse(ok)).toEqual(ok);
    expect(() => avaliacaoFaiscaInput.parse({ ...ok, utilidade: 6 })).toThrow();
    expect(() => avaliacaoFaiscaInput.parse({ ...ok, utilidade: 2.5 })).toThrow();
  });
});
