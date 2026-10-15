import { describe, it, expect, vi, afterEach } from "vitest";
import { criarAssistente } from "@/lib/demo/assistente";
import { perfisDemo, ANA_ID, CARLA_ID } from "@/lib/demo/catalogo";
import { dicaQuizSchema } from "@/lib/demo/schemas";
afterEach(() => vi.useRealTimers());
describe("IA da apresentação e fallback", () => {
  it("retorna exemplo funcional sem credenciais e não indica a solicitante", async () => {
    const assistente = criarAssistente(
      vi.fn().mockRejectedValue(new Error("Sem chave")),
    );
    const match = await assistente.matchFaisca("Preciso apresentar um projeto");
    expect(match.fonte).toBe("demonstracao");
    expect(match.perfil_sugerido_id).toBe(CARLA_ID);
    expect(match.perfil_sugerido_id).not.toBe(ANA_ID);
    expect(match.evidencia).toBe(perfisDemo[1].evidencia);
  });
  it("escolhe a analista para dados e permite buscar outra candidata", async () => {
    const assistente = criarAssistente(
      vi.fn().mockRejectedValue(new Error("Sem chave")),
    );
    const match = await assistente.matchFaisca("Preciso aprender Excel");
    expect(match.perfil_sugerido_id).toBe(perfisDemo[2].id);
    const outra = await assistente.matchFaisca(
      "Preciso aprender Excel",
      match.perfil_sugerido_id,
    );
    expect(outra.perfil_sugerido_id).toBe(CARLA_ID);
  });
  it("aceita IA somente com candidata e evidência conhecidas", async () => {
    const result = {
      perfil_sugerido_id: CARLA_ID,
      motivo_conexao: "Carla compartilhou uma experiência de apresentação.",
      evidencia: perfisDemo[1].evidencia,
    };
    const gerar = vi.fn().mockResolvedValue(result);
    const assistente = criarAssistente(gerar);
    expect(
      (await assistente.matchFaisca("Preciso apresentar à diretoria")).fonte,
    ).toBe("ia");
    gerar.mockResolvedValue({
      ...result,
      evidencia: "Uma evidência que nunca aconteceu",
    });
    expect(
      (await assistente.matchFaisca("Preciso apresentar à diretoria")).fonte,
    ).toBe("demonstracao");
  });
  it("troca saída inválida por pauta de três perguntas", async () => {
    const assistente = criarAssistente(vi.fn().mockResolvedValue(["uma só"]));
    const pauta = await assistente.gerarPauta(
      "Apresentação de projetos",
      "Ana",
      "Carla",
    );
    expect(pauta.fonte).toBe("demonstracao");
    expect(pauta.perguntas).toHaveLength(3);
  });
  it("tempo limite aborta a chamada e retorna fallback antes de oito segundos", async () => {
    vi.useFakeTimers();
    const gerar = vi.fn().mockImplementation(() => new Promise(() => {}));
    const promise = criarAssistente(gerar).matchFaisca(
      "Apresentação de projetos",
    );
    await vi.advanceTimersByTimeAsync(7500);
    expect((await promise).fonte).toBe("demonstracao");
    expect((gerar.mock.calls[0][2] as AbortSignal).aborted).toBe(true);
  });
  it("quota e falhas geram dica e quiz válidos sem perder o aprendizado", async () => {
    const assistente = criarAssistente(
      vi.fn().mockRejectedValue(new Error("429")),
    );
    const aprendizado = "Aprendi a apresentar projetos com objetivos claros.";
    const result = await assistente.gerarDicaEQuiz(aprendizado);
    expect(result.fonte).toBe("demonstracao");
    expect(result.dica).toContain(aprendizado);
    expect(result.perguntas).toHaveLength(3);
    expect(dicaQuizSchema.safeParse(result).success).toBe(true);
  });
  it("entrada inválida não consome chamada de IA", async () => {
    const gerar = vi.fn();
    const assistente = criarAssistente(gerar);
    await expect(assistente.matchFaisca("")).rejects.toThrow();
    await expect(assistente.gerarDicaEQuiz("curto")).rejects.toThrow();
    expect(gerar).not.toHaveBeenCalled();
  });
});
