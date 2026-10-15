import { describe, it, expect } from "vitest";
import {
  criarEstadoInicial,
  selecionarConexao,
  aceitarConviteState,
  concluirEncontroState,
  autorizarState,
  publicarState,
  cancelarEncontroState,
  restaurarEstado,
  comJornada,
  retomarEncontroState,
} from "@/lib/demo/estado";
import { CARLA_ID, ANA_ID, perfisDemo } from "@/lib/demo/catalogo";
import { estadoDemoSchema } from "@/lib/demo/schemas";
const AGORA = new Date("2026-10-15T10:00:00Z");
const ID = "30000000-0000-4000-8000-000000000001";
const OUTRO = "30000000-0000-4000-8000-000000000002";
const pauta = {
  perguntas: [
    "Qual o objetivo?",
    "Que experiência ajuda?",
    "Qual o próximo passo?",
  ],
  fonte: "demonstracao" as const,
};
const resultado = {
  titulo: "Apresentação com propósito",
  dica: "Uma troca para construir apresentações com objetivos e decisões claras.",
  saber_reconhecido: "Apresentar projetos",
  perguntas: Array.from({ length: 3 }, () => ({
    pergunta: "Qual objetivo?",
    alternativas: ["A", "B", "C", "D"],
    correta: 1,
  })),
  fonte: "demonstracao" as const,
};
function aceita() {
  let s = criarEstadoInicial();
  s.jornada.pedido = "Quero apresentar um projeto";
  s = selecionarConexao(s, {
    perfil_sugerido_id: CARLA_ID,
    motivo_conexao: "Uma experiência de apresentação.",
    evidencia: perfisDemo[1].evidencia,
    fonte: "demonstracao",
  });
  return aceitarConviteState(
    s,
    { id: ID, horario: "2026-10-16T12:00:00Z", pauta },
    AGORA,
  );
}
function concluida() {
  let s = aceita();
  s = comJornada(s, {
    ...s.jornada,
    aprendizado: "Aprendi a estruturar objetivo e decisão.",
  });
  return concluirEncontroState(s, resultado);
}
describe("Ciclo de apresentação com identidade estável", () => {
  it("conclui apenas um encontro válido e reseta consentimentos ao alterar o resumo", () => {
    const s = concluida();
    expect(s.convites[0].status).toBe("realizada");
    expect(s.jornada.convite_id).toBe(ID);
    expect(s.convites[0].rascunho?.resultado?.titulo).toBe(resultado.titulo);
    const autorizado = autorizarState(s, "ana", true);
    expect(
      concluirEncontroState(autorizado, resultado).jornada.consentimento_ana,
    ).toBe(false);
  });
  it("publica no encontro corrente mesmo quando existe um convite mais recente", () => {
    let s = concluida();
    s = autorizarState(autorizarState(s, "ana", true), "convidada", true);
    s.convites.push({ ...s.convites[0], id: OUTRO, rascunho: null });
    const result = publicarState(s, AGORA);
    expect(result.publicacoes[0].id).toBe(ID);
    expect(result.publicacoes[0].perfil_id).toBe(CARLA_ID);
    expect(result.convites.find((c) => c.id === OUTRO)?.id).toBe(OUTRO);
    expect(publicarState(result).publicacoes).toHaveLength(1);
  });
  it("nunca publica sem os dois consentimentos e sem conclusão", () => {
    expect(() => publicarState(aceita())).toThrow("Conclua");
    expect(() => publicarState(concluida())).toThrow("duas");
    expect(() =>
      publicarState(autorizarState(concluida(), "ana", true)),
    ).toThrow("duas");
  });
  it("impede aceite duplicado e horários passados", () => {
    const s = aceita();
    expect(
      aceitarConviteState(
        s,
        { id: OUTRO, horario: "2026-10-16T13:00:00Z", pauta },
        AGORA,
      ).convites,
    ).toHaveLength(1);
    expect(() =>
      aceitarConviteState(
        s,
        { id: OUTRO, horario: "2020-01-01T12:00:00Z", pauta },
        AGORA,
      ),
    ).toThrow("futuro");
  });
  it("cancelamento invalida a retomada e não cancela encontros concluídos", () => {
    const s = cancelarEncontroState(aceita(), ID);
    expect(s.jornada.convite_id).toBeNull();
    expect(() => retomarEncontroState(s, ID)).toThrow("ativa");
    expect(() => cancelarEncontroState(concluida(), ID)).toThrow("aceitos");
  });
  it("retoma rascunho e consentimentos do encontro selecionado", () => {
    let s = concluida();
    s = autorizarState(s, "ana", true);
    s = { ...s, jornada: { ...criarEstadoInicial().jornada } };
    const retomado = retomarEncontroState(s, ID);
    expect(retomado.jornada.resultado?.titulo).toBe(resultado.titulo);
    expect(retomado.jornada.consentimento_ana).toBe(true);
    expect(retomado.jornada.consentimento_convidada).toBe(false);
  });
  it("bloqueia autoindicação e referência a convidada diferente", () => {
    expect(() =>
      selecionarConexao(criarEstadoInicial(), {
        perfil_sugerido_id: ANA_ID,
        motivo_conexao: "Uma conexão inválida.",
        evidencia: "Evidência de exemplo",
        fonte: "demonstracao",
      }),
    ).toThrow("válida");
    const s = concluida();
    s.convites[0].perfil_id = perfisDemo[2].id;
    expect(() => publicarState(s)).toThrow("ativo");
  });
});
describe("Migração de dados sem perder o progresso", () => {
  it("migra v1 e associa apenas o convite correspondente", () => {
    const atual = aceita();
    const antiga = {
      ...atual,
      versao: 1,
      jornada: { ...atual.jornada, convite_id: undefined },
      posts: undefined,
      comentarios: undefined,
      curtidas: undefined,
      notificacoes_lidas: undefined,
    };
    const migrada = restaurarEstado(antiga);
    expect(migrada.versao).toBe(2);
    expect(migrada.jornada.convite_id).toBe(ID);
    expect(migrada.posts).toEqual([]);
  });
  it("não associa rascunho antigo ao último convite de outra pessoa", () => {
    const antiga = { ...aceita(), versao: 1 };
    antiga.convites[0].perfil_id = perfisDemo[2].id;
    antiga.convites[0].rascunho=null;
    const migrada = restaurarEstado(antiga);
    expect(migrada.jornada.convite_id).toBeNull();
    expect(migrada.jornada.step).toBe(2);
  });
  it("rejeita versões desconhecidas e dados malformados", () => {
    expect(() => restaurarEstado({ versao: 99 })).toThrow();
    expect(() =>
      estadoDemoSchema.parse({
        ...criarEstadoInicial(),
        convites: [{ id: "inválido" }],
      }),
    ).toThrow();
  });
});
