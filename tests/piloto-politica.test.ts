import { afterEach, describe, it, expect, vi } from "vitest";
import { exigirEmail, lider, pilotoAtivo } from "@/lib/piloto/config";
import { perfilPilotoSchema } from "@/lib/piloto/acoes";
afterEach(() => vi.unstubAllEnvs());
describe("Política de admissão do piloto", () => {
  it("lista vazia nunca libera cadastro e a demo não habilita o piloto", () => {
    vi.stubEnv("APP_MODE", "piloto");
    vi.stubEnv("PILOT_ALLOWED_EMAILS", "");
    expect(() => exigirEmail("pessoa@banca.test")).toThrow("convidadas");
    vi.stubEnv("APP_MODE", "apresentacao");
    vi.stubEnv("PILOT_ALLOWED_EMAILS", "pessoa@banca.test");
    expect(pilotoAtivo()).toBe(false);
    expect(() => exigirEmail("pessoa@banca.test")).toThrow();
  });
  it("aceita somente o email verificado da lista e liderança explicitamente configurada", () => {
    vi.stubEnv("APP_MODE", "piloto");
    vi.stubEnv("PILOT_ALLOWED_EMAILS", " pessoa@banca.test, outra@banca.test ");
    vi.stubEnv("PILOT_LEADER_EMAILS", "pessoa@banca.test");
    expect(exigirEmail("PESSOA@banca.test")).toBe("pessoa@banca.test");
    expect(() => exigirEmail("visitante@banca.test")).toThrow();
    expect(lider("outra@banca.test")).toBe(false);
    expect(lider("pessoa@banca.test")).toBe(true);
  });
  it("perfil não aceita identidade, permissões ou fotos dentro do rascunho de IA", () => {
    const p = perfilPilotoSchema.parse({
      nome: "Pessoa Teste",
      cargo: "Analista",
      area: "Dados",
      cidade: "Recife",
      regional: "Nordeste",
      id: "id-alheio",
      auth_user_id: "outra-conta",
      papel: "lider",
      foto: "foto-privada",
      interesses: ["Indicadores"],
      objetivos: ["Aprender comunicação"],
    });
    expect(p).not.toHaveProperty("id");
    expect(p).not.toHaveProperty("papel");
    expect(p).not.toHaveProperty("foto");
  });
});
