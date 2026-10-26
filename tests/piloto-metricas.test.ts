import { describe, it, expect } from "vitest";
import {
  avaliacaoFaiscaInput,
  mapaDeSaberes,
  consolidarIndicadores,
  resumoParaApresentacao,
  noExpediente,
  planilhaIndicadores,
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
  it("mede as Faíscas marcadas no expediente, no horário de Brasília", () => {
    // 13h UTC de terça = 10h em Brasília; 22h UTC = 19h; sábado fica fora.
    expect(noExpediente("2026-10-20T13:00:00Z")).toBe(true);
    expect(noExpediente("2026-10-20T22:00:00Z")).toBe(false);
    expect(noExpediente("2026-10-24T13:00:00Z")).toBe(false);
    const i = consolidarIndicadores({
      ...base,
      faiscas: [
        { id: "f1", solicitante_id: A, convidada_id: C, status: "realizada", horario: "2026-10-20T13:00:00Z" },
        { id: "f2", solicitante_id: C, convidada_id: A, status: "aceita", horario: "2026-10-20T22:00:00Z" },
        { id: "f3", solicitante_id: A, convidada_id: B, status: "aceita", horario: null },
        { id: "f4", solicitante_id: B, convidada_id: C, status: "pendente", horario: "2026-10-24T13:00:00Z" },
      ],
    });
    // Só conexões com horário entram na conta: 1 de 2.
    expect(i.no_expediente).toBe(50);
    expect(resumoParaApresentacao(i)).toContain("50% das Faíscas marcadas no horário de trabalho");
  });
  it("não inventa percentuais sem dados e sinaliza migração pendente", () => {
    const i = consolidarIndicadores({ ...base, faiscas: [], avaliacoes: null });
    expect(i.taxa_aceite).toBeNull();
    expect(i.entre_regionais).toBeNull();
    expect(i.no_expediente).toBeNull();
    expect(i.avaliacoes).toBeNull();
    expect(resumoParaApresentacao(i)).toContain("taxa de aceite —");
  });
  it("planilha abre no Excel em português e não executa fórmulas", () => {
    const i = consolidarIndicadores({
      ...base,
      perfis: [{ id: A, area: "Operações", regional: "Pará", interesses: ["=HIPERLINK(\"x\")"] }],
      faiscas: [{ id: "f1", solicitante_id: A, convidada_id: B, status: "realizada" }],
    });
    const csv = planilhaIndicadores(i, new Date("2026-10-27T12:00:00Z"));
    expect(csv.startsWith("\uFEFF\"Grupo\";\"Indicador\";\"Valor\"")).toBe(true);
    expect(csv).toContain('"Avaliações";"Utilidade média (1 a 5)";"4,5"');
    expect(csv).toContain(`"'=HIPERLINK(""x"")"`);
    expect(csv).not.toMatch(/;"=/);
  });
  it("avaliação aceita somente escala de 1 a 5", () => {
    const ok = { faisca_id: A, utilidade: 5, voltaria: true };
    expect(avaliacaoFaiscaInput.parse(ok)).toEqual(ok);
    expect(() => avaliacaoFaiscaInput.parse({ ...ok, utilidade: 6 })).toThrow();
    expect(() => avaliacaoFaiscaInput.parse({ ...ok, utilidade: 2.5 })).toThrow();
  });
});
describe("Mapa de saberes do piloto", () => {
  it("mostra oferta, saberes concentrados e lacunas sem expor objetivos", () => {
    const m = mapaDeSaberes([
      { id: A, area: "x", regional: "y", interesses: ["Gestão de projetos", "Excel"], objetivos: ["Aprender negociação com fornecedores"] },
      { id: B, area: "x", regional: "y", interesses: ["Gestão de projetos"], objetivos: ["Melhorar negociação de contratos", "Aprender Excel avançado"] },
      { id: C, area: "x", regional: "y", interesses: ["Segurança em campo"], objetivos: ["Liderar projetos maiores"] },
    ]);
    expect(m.oferta[0]).toEqual({ saber: "Gestão de projetos", pessoas: 2 });
    expect(m.concentrados).toEqual(["Excel", "Segurança em campo"]);
    expect(m.objetivos).toBe(4);
    // Negociação ninguém oferece; Excel e projetos têm quem ofereça.
    expect(m.objetivos_sem_par).toBe(2);
    expect(m.temas_sem_par).toEqual([{ tema: "negociação", pessoas: 2 }]);
  });
});
