import { describe, it, expect } from "vitest";
import { normalizarRetorno, rotaPiloto } from "@/lib/piloto/retorno";
describe("Retomada segura após autenticação", () => {
  it("mantém somente aba e identificador válido do encontro", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(
      normalizarRetorno(`/piloto?aba=faiscas&encontro=${id}&token=segredo`),
    ).toBe(`/piloto?aba=faiscas&encontro=${id}`);
    expect(rotaPiloto({ aba: ["perfil"], encontro: "invalido" })).toBe(
      "/piloto",
    );
  });
  it("rejeita redirecionamentos externos, outros caminhos e URLs de protocolo relativo", () => {
    for (const entrada of [
      "https://outro.test/piloto",
      "//outro.test/piloto",
      "/piloto/../api/perfis",
      "/piloto-externo",
      "javascript:alert(1)",
      null,
    ])
      expect(normalizarRetorno(entrada)).toBe("/piloto");
  });
});
