import { describe, it, expect } from "vitest";
import { avaliarIndexacao } from "@/lib/domain/perfil-indexacao";
const base = {
  consentimento: true,
  interesses: ["Dados", "Comunicação"],
  saberes: [{ fonte: "perfil", saber: "Dados", embedding: "[1,0]" }],
};
describe("Estado da indexação do perfil", () => {
  it("mostra quais saberes ainda não foram indexados", () => {
    expect(avaliarIndexacao(base)).toEqual({
      estado: "pendente",
      total: 2,
      indexados: 1,
      pendentes: ["Comunicação"],
    });
  });
  it("não confunde saber de outra fonte ou sem vetor com perfil pronto", () => {
    expect(
      avaliarIndexacao({
        ...base,
        saberes: [
          ...base.saberes,
          { fonte: "faisca", saber: "Comunicação", embedding: "[1,0]" },
          { fonte: "perfil", saber: "Comunicação", embedding: null },
        ],
      }).estado,
    ).toBe("pendente");
  });
  it("respeita consentimento e perfil vazio, sem anunciar indexação inexistente", () => {
    expect(avaliarIndexacao({ ...base, consentimento: false }).estado).toBe(
      "sem_consentimento",
    );
    expect(avaliarIndexacao({ ...base, interesses: [] }).estado).toBe(
      "sem_saberes",
    );
  });
  it("ignora saber removido e conta um interesse duplicado uma vez", () => {
    expect(
      avaliarIndexacao({ ...base, interesses: ["Dados", "Dados"] }),
    ).toEqual({ estado: "pronto", total: 1, indexados: 1, pendentes: [] });
  });
});
