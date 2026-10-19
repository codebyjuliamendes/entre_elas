import { pilotoAtivo } from "@/lib/piloto/config";
import { comContextoIA } from "@/lib/piloto/ia";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ErroDominio, ErroIA } from "@/lib/domain/erros";
export async function resposta(acao: () => Promise<unknown>) {
  const requestId = randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Request-Id": requestId };
  try {
    return NextResponse.json(await comContextoIA(acao), { headers });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          erro: error.issues[0]?.message || "Dados inválidos.",
          detalhes: error.issues.map((i) => ({
            campo: i.path.join("."),
            mensagem: i.message,
          })),
          request_id: requestId,
        },
        { status: 400, headers },
      );
    if (error instanceof ErroDominio)
      return NextResponse.json(
        { erro: error.message, request_id: requestId },
        { status: error.status, headers },
      );
    if (error instanceof ErroIA)
      return NextResponse.json(
        { erro: error.message, request_id: requestId },
        { status: error.status === 408 ? 504 : 502, headers },
      );
    console.error(
      JSON.stringify({
        evento: "operacao_indisponivel",
        request_id: requestId,
        classe: error instanceof Error ? error.name : "desconhecido",
      }),
    );
    return NextResponse.json(
      {
        erro: "Operação indisponível. Tente novamente em instantes.",
        request_id: requestId,
      },
      { status: 503, headers },
    );
  }
}
const LIMITE = 100_000;
export async function corpo(
  request: Request,
  limite = LIMITE,
): Promise<Record<string, unknown>> {
  const origem = request.headers.get("origin");
  const origemEsperada =
    pilotoAtivo() && process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : new URL(request.url).origin;
  if (
    (origem && origem !== origemEsperada) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ErroDominio("Origem da requisição não permitida.", 403);
  const tipo = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (
    tipo !== "application/json" &&
    !/^application\/[a-z0-9.+-]+\+json$/.test(tipo ?? "")
  )
    throw new ErroDominio("Envie o corpo como application/json.", 415);
  const tamanho = request.headers.get("content-length");
  if (tamanho !== null && (!/^\d+$/.test(tamanho) || Number(tamanho) > limite))
    throw new ErroDominio("Requisição muito grande ou tamanho inválido.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ErroDominio("Corpo JSON inválido.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let texto = "",
    bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limite) {
        await reader.cancel();
        throw new ErroDominio("Requisição muito grande.", 413);
      }
      texto += decoder.decode(value, { stream: true });
    }
    texto += decoder.decode();
  } catch (error) {
    if (error instanceof ErroDominio) throw error;
    throw new ErroDominio("Corpo JSON inválido.");
  } finally {
    reader.releaseLock();
  }
  try {
    return z.record(z.string(), z.unknown()).parse(JSON.parse(texto));
  } catch {
    throw new ErroDominio("Corpo JSON inválido.");
  }
}
export type RotaAcao = { params: Promise<{ acao: string }> };
