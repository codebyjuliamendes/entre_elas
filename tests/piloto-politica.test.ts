import { afterEach, describe, it, expect, vi } from "vitest";
import { exigirEmail, lider, pilotoAtivo } from "@/lib/piloto/config";
import { perfilPilotoSchema } from "@/lib/piloto/acoes";
afterEach(() => vi.unstubAllEnvs());
describe("Política de admissão do piloto", () => {
  it("produção usa dados reais por padrão e exige apresentação explícita", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_MODE", "");
    expect(pilotoAtivo()).toBe(true);
    vi.stubEnv("APP_MODE", "apresentacao");
    expect(pilotoAtivo()).toBe(false);
  });
  it("aceita qualquer e-mail válido no piloto sem lista de convites", () => {
    vi.stubEnv("APP_MODE", "piloto");
    expect(exigirEmail("  NOVA@exemplo.com  ")).toBe("nova@exemplo.com");
    expect(exigirEmail("outra@empresa.com")).toBe("outra@empresa.com");
    expect(() => exigirEmail("email inválido")).toThrow();
    vi.stubEnv("APP_MODE", "apresentacao");
    expect(pilotoAtivo()).toBe(false);
    expect(() => exigirEmail("nova@exemplo.com")).toThrow(
      "não está habilitado",
    );
  });
  it("cadastro aberto não concede acesso à liderança", () => {
    vi.stubEnv("APP_MODE", "piloto");
    vi.stubEnv("PILOT_LEADER_EMAILS", "pessoa@banca.test");
    expect(exigirEmail("visitante@qualquer.com")).toBe(
      "visitante@qualquer.com",
    );
    expect(lider("visitante@qualquer.com")).toBe(false);
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
