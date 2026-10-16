import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { criarProvider, type Cache } from "@/lib/ai/provider";
import { ErroIA } from "@/lib/domain/erros";
const schema = z.object({ resposta: z.string() });
function setup() {
  const cache: Cache = {
    ler: vi.fn().mockResolvedValue(null),
    gravar: vi.fn().mockResolvedValue(undefined),
  };
  const gemini = vi.fn().mockResolvedValue('{"resposta":"sim"}');
  const groq = vi.fn().mockResolvedValue('{"resposta":"alternativa"}');
  return {
    gemini,
    groq,
    cache,
    embedding: vi
      .fn()
      .mockResolvedValue(
        Array.from({ length: 768 }, (_, i) => (i === 0 ? 2 : 0)),
      ),
    timeoutMs: 20,
  };
}
afterEach(() => vi.useRealTimers());
describe("Provider de IA", () => {
  it("valida o JSON e o contrato de saída", async () => {
    const d = setup();
    expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
      resposta: "sim",
    });
    expect(d.groq).not.toHaveBeenCalled();
  });
  it("repete uma vez quando o JSON é inválido", async () => {
    const d = setup();
    d.gemini
      .mockResolvedValueOnce("texto")
      .mockResolvedValueOnce('{"resposta":"corrigido"}');
    expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
      resposta: "corrigido",
    });
    expect(d.gemini).toHaveBeenCalledTimes(2);
  });
  it("usa outro provedor real se Gemini continua incompatível após a correção", async () => {
    const d = setup();
    d.gemini.mockResolvedValue('{"resposta":123}');
    expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
      resposta: "alternativa",
    });
    expect(d.gemini).toHaveBeenCalledTimes(2);
    expect(d.groq).toHaveBeenCalledTimes(1);
  });
  it("usa Groq em erro 429", async () => {
    const d = setup();
    d.gemini.mockRejectedValue(new ErroIA("Limite", 429));
    expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
      resposta: "alternativa",
    });
  });
  it("aborta Gemini após o limite e usa Groq", async () => {
    const d = setup();
    d.gemini.mockImplementation(() => new Promise(() => {}));
    expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
      resposta: "alternativa",
    });
    const signal = d.gemini.mock.calls[0][2] as AbortSignal;
    expect(signal.aborted).toBe(true);
  });
  it("não encobre falhas de autenticação com fallback", async () => {
    const d = setup();
    d.gemini.mockRejectedValue(new ErroIA("Sem acesso", 403));
    await expect(criarProvider(d).gerar("Pergunta", schema)).rejects.toThrow(
      "Sem acesso",
    );
    expect(d.groq).not.toHaveBeenCalled();
  });
  it("lê o cache antes de chamar provedores", async () => {
    const d = setup();
    vi.mocked(d.cache.ler).mockResolvedValue({ resposta: "cache" });
    expect(
      await criarProvider(d).gerar("Pergunta", schema, { cache: true }),
    ).toEqual({ resposta: "cache" });
    expect(d.gemini).not.toHaveBeenCalled();
  });
  it("grava cache e isola versões de prompt", async () => {
    const d = setup();
    const p = criarProvider(d);
    await p.gerar("Pergunta", schema, { cache: true, versao: "1" });
    await p.gerar("Pergunta", schema, { cache: true, versao: "2" });
    const calls = vi.mocked(d.cache.gravar).mock.calls;
    expect(calls[0][0]).not.toBe(calls[1][0]);
    expect(calls[0][1]).toEqual({ resposta: "sim" });
  });
  it("normaliza embeddings e valida dimensão", async () => {
    const d = setup();
    const p = criarProvider(d);
    expect((await p.embed("Saber"))[0]).toBe(1);
    d.embedding.mockResolvedValue([1, 2]);
    await expect(p.embed("Saber")).rejects.toThrow();
  });
  it("rejeita vetores nulos", async () => {
    const d = setup();
    d.embedding.mockResolvedValue(Array(768).fill(0));
    await expect(criarProvider(d).embed("Saber")).rejects.toThrow(
      "Embedding nulo",
    );
  });
});

describe("Resiliência real da IA", () => {
  it.each([500, 502, 503, 504])(
    "usa Groq quando Gemini responde %s",
    async (status) => {
      const d = setup();
      d.gemini.mockRejectedValue(new ErroIA("Temporário", status));
      expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
        resposta: "alternativa",
      });
    },
  );
  it("recupera falha de rede sem retornar uma resposta simulada", async () => {
    const d = setup();
    d.gemini.mockRejectedValue(new TypeError("fetch failed"));
    expect(await criarProvider(d).gerar("Pergunta", schema)).toEqual({
      resposta: "alternativa",
    });
  });
  it("responde mesmo se leitura e gravação do cache falham", async () => {
    const d = setup();
    vi.mocked(d.cache.ler).mockRejectedValue(new Error("banco indisponível"));
    vi.mocked(d.cache.gravar).mockRejectedValue(
      new Error("banco indisponível"),
    );
    expect(
      await criarProvider(d).gerar("Pergunta", schema, { cache: true }),
    ).toEqual({ resposta: "sim" });
  });
  it("ignora resposta antiga incompatível e gera uma nova", async () => {
    const d = setup();
    vi.mocked(d.cache.ler).mockResolvedValue({ resposta: 42 });
    expect(
      await criarProvider(d).gerar("Pergunta", schema, { cache: true }),
    ).toEqual({ resposta: "sim" });
  });
  it("o prazo total também interrompe o provedor de reserva", async () => {
    vi.useFakeTimers();
    const d = setup();
    d.gemini.mockImplementation(() => new Promise(() => {}));
    d.groq.mockImplementation(() => new Promise(() => {}));
    const p = criarProvider(d).gerar("Pergunta", schema, { prazoMs: 100 });
    const check = expect(p).rejects.toMatchObject({ status: 408 });
    await vi.advanceTimersByTimeAsync(100);
    await check;
    expect((d.groq.mock.calls[0][2] as AbortSignal).aborted).toBe(true);
  });
  it("cancelar a busca interrompe a chamada e não inicia outro provedor", async () => {
    const d = setup();
    d.gemini.mockImplementation(() => new Promise(() => {}));
    const c = new AbortController();
    const p = criarProvider(d).gerar("Pergunta", schema, { signal: c.signal });
    const check = expect(p).rejects.toMatchObject({ status: 408 });
    c.abort();
    await check;
    expect(d.groq).not.toHaveBeenCalled();
  });
  it("falha de ambos os provedores chega à interface, sem inventar conteúdo", async () => {
    const d = setup();
    d.gemini.mockRejectedValue(new ErroIA("Quota", 429));
    d.groq.mockRejectedValue(new ErroIA("Quota reserva", 429));
    await expect(criarProvider(d).gerar("Pergunta", schema)).rejects.toThrow(
      "Quota reserva",
    );
  });
});

describe("Fundamentação antes de reutilizar ou gravar cache", () => {
  it("descarta cache sem suporte e gera resposta novamente", async () => {
    const d = setup();
    vi.mocked(d.cache.ler).mockResolvedValue({ resposta: "inventada" });
    const validar = (r: unknown) => {
      if (schema.parse(r).resposta === "inventada")
        throw new ErroIA("Sem evidência", 422);
    };
    expect(
      await criarProvider(d).gerar("Pergunta", schema, {
        cache: true,
        validar,
      }),
    ).toEqual({ resposta: "sim" });
    expect(d.gemini).toHaveBeenCalledOnce();
  });
  it("corrige conteúdo sem suporte antes de armazenar, mesmo com JSON válido", async () => {
    const d = setup();
    d.gemini
      .mockResolvedValueOnce('{"resposta":"inventada"}')
      .mockResolvedValueOnce('{"resposta":"sim"}');
    const validar = (r: unknown) => {
      if (schema.parse(r).resposta === "inventada")
        throw new ErroIA("Sem evidência", 422);
    };
    expect(
      await criarProvider(d).gerar("Pergunta", schema, {
        cache: true,
        validar,
      }),
    ).toEqual({ resposta: "sim" });
    expect(vi.mocked(d.cache.gravar).mock.calls.map((c) => c[1])).toEqual([
      { resposta: "sim" },
    ]);
  });
  it("cache lento não impede geração real", async () => {
    vi.useFakeTimers();
    const d = setup();
    vi.mocked(d.cache.ler).mockImplementation(() => new Promise(() => {}));
    const p = criarProvider(d).gerar("Pergunta", schema, { cache: true });
    await vi.advanceTimersByTimeAsync(500);
    expect(await p).toEqual({ resposta: "sim" });
  });
});
