import { describe, it, expect, vi } from "vitest";
import { corpo, resposta } from "@/lib/api";
import { ErroDominio } from "@/lib/domain/erros";
import { assinarCookie, validarCookie } from "@/lib/auth/current-user";
function request(body: string, headers: Record<string, string> = {}) {
  return new Request("https://entre-elas.test/api/posts", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}
describe("Limites reais de requisição", () => {
  it("aceita objetos JSON e rejeita outro tipo de conteúdo", async () => {
    expect(await corpo(request('{"titulo":"Teste"}'))).toEqual({
      titulo: "Teste",
    });
    await expect(
      corpo(request("{}", { "content-type": "text/plain" })),
    ).rejects.toMatchObject({ status: 415 });
    await expect(corpo(request("[]"))).rejects.toMatchObject({ status: 400 });
  });
  it("mede bytes UTF-8 mesmo sem Content-Length", async () => {
    await expect(
      corpo(request(JSON.stringify({ texto: "💡".repeat(30000) }))),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("rejeita origem cruzada e corpos quebrados", async () => {
    await expect(
      corpo(request("{}", { origin: "https://outro.test" })),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      corpo(request("{}", { "sec-fetch-site": "cross-site" })),
    ).rejects.toMatchObject({ status: 403 });
    await expect(corpo(request("{"))).rejects.toMatchObject({ status: 400 });
  });
  it("marca respostas como privadas e fornece identificador de diagnóstico", async () => {
    const r = await resposta(async () => {
      throw new ErroDominio("Sem permissão.", 403);
    });
    expect(r.status).toBe(403);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("x-request-id")).toBeTruthy();
    expect((await r.json()).request_id).toBe(r.headers.get("x-request-id"));
  });
  it("não devolve nem registra conteúdo de erro que possa conter segredos", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await resposta(async () => {
      throw new Error("chave-que-nao-pode-vazar");
    });
    expect(JSON.stringify(await r.json())).not.toContain("chave-que");
    expect(JSON.stringify(log.mock.calls)).not.toContain("chave-que");
    log.mockRestore();
  });
});
describe("Cookie de demonstração", () => {
  it("rejeita sufixos, assinatura inválida e expiração adulterada", () => {
    vi.stubEnv(
      "DEMO_COOKIE_SECRET",
      "segredo-ficticio-exclusivo-dos-testes-0001",
    );
    try {
      const token = assinarCookie("00000000-0000-4000-8000-000000000001");
      expect(validarCookie(token)).toBe("00000000-0000-4000-8000-000000000001");
      for (const alterado of [
        token + ".extra",
        token.slice(0, -1) + "X",
        token.replace(/\.\d+\./, ".1."),
        "inválido",
      ])
        expect(() => validarCookie(alterado)).toThrow("inválida");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
