import { describe, it, expect, vi, afterEach } from "vitest";
import { comFallbackLocal } from "@/lib/demo/fallback";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Resiliência do navegador", () => {
  it("retorna exemplo local quando a conexão falha", async () => {
    expect(
      await comFallbackLocal(
        async () => {
          throw new Error("fetch");
        },
        async () => ({ fonte: "demonstracao" }),
      ),
    ).toEqual({ fonte: "demonstracao" });
  });
  it("não inicia chamada externa quando o navegador está offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const servidor = vi.fn();
    expect(await comFallbackLocal(servidor, async () => "local")).toBe("local");
    expect(servidor).not.toHaveBeenCalled();
  });
  it("limita a espera de transporte a oito segundos", async () => {
    vi.useFakeTimers();
    const p = comFallbackLocal(
      () => new Promise(() => {}),
      async () => "local",
    );
    await vi.advanceTimersByTimeAsync(8000);
    expect(await p).toBe("local");
  });
});
