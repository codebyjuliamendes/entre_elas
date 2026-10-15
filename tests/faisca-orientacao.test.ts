import { describe, it, expect } from "vitest";
import { orientarFaisca } from "@/lib/domain/faisca-orientacao";
import { faisca } from "@/lib/schemas/entities";
import { uuid } from "@/scripts/fixtures";
const base = faisca.parse({
  id: uuid(900),
  solicitante_id: uuid(1),
  convidada_id: uuid(2),
  pedido: "Compartilhar experiências",
  tema: "Indicadores",
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
const orientar = (
  patch: Partial<typeof base>,
  usuaria = uuid(1),
  publicada = false,
) =>
  orientarFaisca({
    encontro: { ...base, ...patch },
    usuaria_id: usuaria,
    publicada,
  });
describe("Orientação da Faísca conforme a situação real", () => {
  it("distingue receber um convite de aguardar a resposta", () => {
    expect(orientar({}).titulo).toContain("Aguardando");
    expect(orientar({}, uuid(2)).titulo).toBe("Você recebeu um convite");
    expect(() => orientar({}, uuid(3))).toThrow("participantes");
  });
  it("orienta sobre anotações individuais e síntese sem publicar antecipadamente", () => {
    expect(orientar({ status: "aceita" }).titulo).toContain("Conversem");
    expect(
      orientar({
        status: "aceita",
        anotacoes: { [uuid(1)]: "Uma experiência" },
      }).titulo,
    ).toBe("Suas anotações estão salvas");
    expect(
      orientar({
        status: "aceita",
        anotacoes: {
          [uuid(1)]: "Uma experiência",
          [uuid(2)]: "Outra experiência",
        },
      }).descricao,
    ).toContain("ainda não publica");
  });
  it("mostra consentimento pendente, publicação disponível e dica já publicada", () => {
    expect(orientar({ status: "realizada" }).titulo).toContain("Revise");
    expect(
      orientar({ status: "realizada", publicacao_autorizada_por: [uuid(1)] })
        .titulo,
    ).toContain("Aguardando");
    expect(
      orientar({
        status: "realizada",
        publicacao_autorizada_por: [uuid(1), uuid(2)],
      }).titulo,
    ).toContain("pronta para publicar");
    expect(orientar({ status: "realizada" }, uuid(1), true).titulo).toBe(
      "Conhecimento compartilhado",
    );
  });
});
