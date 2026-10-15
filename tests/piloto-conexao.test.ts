import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { api } from "@/lib/piloto/browser";
const dispatch = vi.fn();
beforeEach(() => {
  dispatch.mockReset();
  vi.stubGlobal("window", { dispatchEvent: dispatch });
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe("Transporte do piloto", () => {
  it("compartilha uma renovação entre pedidos simultâneos", async () => {
    let liberar!: (r: Response) => void;
    const renovando = new Promise<Response>((resolve) => {
      liberar = resolve;
    });
    const tentativas = new Map<string, number>();
    const fetch = vi.fn((url: string) => {
      if (url === "/api/auth/renovar") return renovando;
      const n = tentativas.get(url) ?? 0;
      tentativas.set(url, n + 1);
      return Promise.resolve(
        Response.json(n ? { ok: true } : { erro: "expirou" }, {
          status: n ? 200 : 401,
        }),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const a = api("/api/a"),
      b = api("/api/b");
    await vi.waitFor(() =>
      expect(
        fetch.mock.calls.filter(([u]) => u === "/api/auth/renovar"),
      ).toHaveLength(1),
    );
    liberar(Response.json({ ok: true }));
    await expect(Promise.all([a, b])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("falha temporária na renovação não trata a sessão como encerrada", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({}, { status: 401 }))
        .mockResolvedValueOnce(Response.json({}, { status: 503 })),
    );
    await expect(api("/api/dados")).rejects.toThrow("renovar a sessão agora");
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("sessão realmente expirada pede novo login", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({}, { status: 401 }))
        .mockResolvedValueOnce(Response.json({}, { status: 401 })),
    );
    await expect(api("/api/dados")).rejects.toThrow("sessão expirou");
    expect(dispatch.mock.calls[0][0].type).toBe("piloto:login");
  });
  it("não entra em ciclo quando a sessão renovada também é rejeitada", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(Response.json({}, { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    await expect(api("/api/dados")).rejects.toThrow("sessão expirou");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("falha de rede mantém mensagem de recuperação e não repete escrita automaticamente", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);
    await expect(api("/api/faiscas", { pedido: "Uma troca" })).rejects.toThrow(
      "Sem conexão",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("timeout orienta conferir o resultado antes de repetir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("expirou", "TimeoutError")),
    );
    await expect(api("/api/faiscas", { pedido: "Uma troca" })).rejects.toThrow(
      "Confira seus dados",
    );
  });
  it("resposta HTML inesperada não vaza mensagem técnica do parser", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("<html>erro</html>", { status: 502 })),
    );
    await expect(api("/api/dados")).rejects.toThrow(
      "confirmar a resposta do servidor",
    );
  });
});
