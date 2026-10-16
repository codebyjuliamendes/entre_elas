import { describe, it, expect } from "vitest";
import { validarResumoFundamentado } from "@/lib/domain/resumo-fundamentacao";
import { resumo } from "@/lib/schemas/entities";
import { uuid } from "@/scripts/fixtures";
const anotacoes = {
  [uuid(1)]: "Aprendi a definir a decisão antes de escolher indicadores.",
  [uuid(2)]: "Compartilhei a importância de conferir as fontes de dados.",
};
const base = {
  aprendizados: [
    "Escolher indicadores a partir da decisão",
    "Conferir as fontes de dados",
  ],
  proximos_passos: ["Sugestão: avaliar um indicador no próximo projeto"],
  rascunho_dica: {
    titulo: "Indicadores com propósito",
    corpo: "Comece pela decisão e confira as fontes de dados.",
  },
  evidencias: [
    {
      aprendizado: 0,
      autora_id: uuid(1),
      trecho: "definir a decisão antes de escolher indicadores",
    },
    {
      aprendizado: 1,
      autora_id: uuid(2),
      trecho: "conferir as fontes de dados",
    },
  ],
};
describe("Síntese fundamentada nas duas participantes", () => {
  it("conserva citações conferidas e aceita sínteses manuais antigas sem alterar o snapshot", () => {
    expect(validarResumoFundamentado({ anotacoes, resumo: base })).toEqual(
      base,
    );
    const manual = {
      aprendizados: base.aprendizados,
      proximos_passos: base.proximos_passos,
      rascunho_dica: base.rascunho_dica,
    };
    expect(resumo.parse(manual)).toEqual(manual);
  });
  it("rejeita citação inventada mesmo quando o formato é válido", () => {
    expect(() =>
      validarResumoFundamentado({
        anotacoes,
        resumo: {
          ...base,
          evidencias: [
            {
              ...base.evidencias[0],
              trecho: "Consegui aumentar o resultado em 50%",
            },
            base.evidencias[1],
          ],
        },
      }),
    ).toThrow("não corresponde");
  });
  it("não permite atribuir um trecho à participante errada", () => {
    expect(() =>
      validarResumoFundamentado({
        anotacoes,
        resumo: {
          ...base,
          evidencias: [
            { ...base.evidencias[0], autora_id: uuid(2) },
            base.evidencias[1],
          ],
        },
      }),
    ).toThrow("não corresponde");
  });
  it("exige base para cada aprendizado e participação das duas autoras", () => {
    expect(() =>
      validarResumoFundamentado({
        anotacoes,
        resumo: {
          ...base,
          aprendizados: [...base.aprendizados, "Aprendizado sem fonte"],
        },
      }),
    ).toThrow("cada aprendizado");
    expect(() =>
      validarResumoFundamentado({
        anotacoes,
        resumo: {
          ...base,
          evidencias: [
            base.evidencias[0],
            { ...base.evidencias[0], aprendizado: 1 },
          ],
        },
      }),
    ).toThrow("duas participantes");
  });
  it("rejeita índice inexistente e terceira pessoa", () => {
    for (const patch of [{ aprendizado: 20 }, { autora_id: uuid(3) }]) {
      expect(() =>
        validarResumoFundamentado({
          anotacoes,
          resumo: {
            ...base,
            evidencias: [
              { ...base.evidencias[0], ...patch },
              base.evidencias[1],
            ],
          },
        }),
      ).toThrow("não corresponde");
    }
  });
});
