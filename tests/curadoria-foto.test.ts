import { describe, it, expect, vi } from "vitest";
import { analisarConexao, explicarConexao } from "@/lib/demo/curadoria";
import { criarAssistente } from "@/lib/demo/assistente";
import { criarEstadoInicial, restaurarEstado } from "@/lib/demo/estado";
import { fotoLocalSchema, prepararFoto } from "@/lib/demo/foto";
import { CARLA_ID, ANA_ID } from "@/lib/demo/catalogo";
const contexto = {
  objetivos: ["Desenvolver minha liderança"],
  saberes: ["Segurança em campo"],
};
describe("Curadoria contextual e foto local", () => {
  it("prioriza pedido explícito sobre objetivos e exclui solicitante/candidata recusada", () => {
    const r = analisarConexao({ pedido: "Preciso aprender Excel", contexto });
    expect(r.candidatas[0].slug).toBe("daniela");
    expect(
      analisarConexao({
        pedido:
          "Quero transformar dados e indicadores em uma apresentação clara",
      }).candidatas[0].slug,
    ).toBe("daniela");
    expect(r.candidatas.some((p) => p.id === ANA_ID)).toBe(false);
    const outra = analisarConexao({
      pedido: "Preciso aprender Excel",
      contexto,
      excluir: r.candidatas[0].id,
    });
    expect(outra.candidatas.some((p) => p.slug === "daniela")).toBe(false);
  });
  it("objetivos desempataram um pedido aberto e tema desconhecido não vira expertise", () => {
    const r = analisarConexao({
      pedido: "Quero uma troca para me desenvolver",
      contexto,
    });
    expect(r.candidatas[0].slug).toBe("gabriela");
    const explicacao = explicarConexao({
      pedido: "Quero aprender astronomia",
      perfil_id: CARLA_ID,
    });
    expect(explicacao.limite).toContain("Catálogo limitado");
  });
  it("envia somente objetivos e saberes validados, sem foto nem bio", async () => {
    const gerar = vi.fn().mockRejectedValue(new Error("sem chave"));
    await criarAssistente(gerar).matchFaisca(
      "Preciso apresentar um projeto",
      undefined,
      { ...contexto, foto: "foto privada", bio: "bio privada" },
    );
    const prompt = gerar.mock.calls[0][0] as string;
    expect(prompt).toContain("Desenvolver minha liderança");
    expect(prompt).not.toContain("foto privada");
    expect(prompt).not.toContain("bio privada");
  });
  it("pauta local se adapta ao desafio e à experiência da convidada", async () => {
    const a = criarAssistente(vi.fn().mockRejectedValue(new Error("offline")));
    const r = await a.gerarPauta(
      "Preciso aprender Excel",
      "Ana Ribeiro",
      "Daniela Costa",
      contexto,
    );
    expect(r.perguntas[0]).toContain("indicadores");
    expect(r.perguntas[1]).toContain("excel");
  });
  it("recusa síntese de IA com trecho inventado e aceita trecho literal", async () => {
    const texto = "Aprendi a organizar indicadores antes de montar os slides.";
    const local = await criarAssistente(
      vi.fn().mockRejectedValue(new Error()),
    ).gerarDicaEQuiz(texto);
    const gerar = vi.fn().mockResolvedValue({
      ...local,
      trecho_aprendizado: "Uma conquista que nunca foi relatada",
    });
    const a = criarAssistente(gerar);
    expect((await a.gerarDicaEQuiz(texto)).fonte).toBe("demonstracao");
    gerar.mockResolvedValue({
      ...local,
      trecho_aprendizado: "organizar indicadores antes de montar os slides",
    });
    expect((await a.gerarDicaEQuiz(texto)).fonte).toBe("ia");
  });
  it("migra perfis sem foto e impede SVG, URL externa e arquivo excessivo", async () => {
    const state = criarEstadoInicial();
    const { foto: omitida, ...perfil } = state.perfil;
    void omitida;
    expect(restaurarEstado({ ...state, perfil }).perfil.foto).toBeNull();
    expect(
      fotoLocalSchema.safeParse("data:image/svg+xml;base64,PHN2Zz4=").success,
    ).toBe(false);
    expect(
      fotoLocalSchema.safeParse("https://example.com/foto.jpg").success,
    ).toBe(false);
    await expect(
      prepararFoto(new File(["x"], "foto.svg", { type: "image/svg+xml" })),
    ).rejects.toThrow("JPEG");
    await expect(
      prepararFoto(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "foto.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("5 MB");
  });
});
