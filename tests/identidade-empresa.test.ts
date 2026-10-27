import { afterEach, describe, expect, it, vi } from "vitest";
import { areasEmpresa, empresaCliente, logoEmpresa, regionaisEmpresa } from "@/lib/identidade";
afterEach(() => vi.unstubAllEnvs());
describe("Personalização da empresa cliente", () => {
  it("sem configuração, nada aparece", () => {
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_NOME", "");
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_LOGO", "");
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_AREAS", "");
    expect(empresaCliente()).toBeNull();
    expect(logoEmpresa()).toBeNull();
    expect(areasEmpresa()).toEqual([]);
  });
  it("logo só aceita arquivo próprio ou https", () => {
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_LOGO", "/clientes/empresa.svg");
    expect(logoEmpresa()).toBe("/clientes/empresa.svg");
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_LOGO", "https://cdn.empresa.com.br/logo.png");
    expect(logoEmpresa()).toBe("https://cdn.empresa.com.br/logo.png");
    for (const ruim of ["http://empresa.com/logo.png", "javascript:alert(1)", "data:image/png;base64,AAA", "https://x.com/a\" onerror=\"x"]) {
      vi.stubEnv("NEXT_PUBLIC_EMPRESA_LOGO", ruim);
      expect(logoEmpresa()).toBeNull();
    }
  });
  it("áreas e regionais viram listas sem repetição nem vazios", () => {
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_AREAS", " Operações, Comercial,,Operações , T");
    vi.stubEnv("NEXT_PUBLIC_EMPRESA_REGIONAIS", "Maranhão,Pará");
    expect(areasEmpresa()).toEqual(["Operações", "Comercial"]);
    expect(regionaisEmpresa()).toEqual(["Maranhão", "Pará"]);
  });
});
