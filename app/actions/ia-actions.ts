"use server";
import { assistentePitch } from "@/lib/ai/pitch";
export async function matchFaisca(
  pedido: string,
  excluir?: string,
  contexto?: unknown,
) {
  return assistentePitch.matchFaisca(pedido, excluir, contexto);
}
export async function gerarPauta(
  tema: string,
  perfilA: string,
  perfilB: string,
  contexto?: unknown,
) {
  return assistentePitch.gerarPauta(tema, perfilA, perfilB, contexto);
}
export async function gerarDicaEQuiz(aprendizado: string) {
  return assistentePitch.gerarDicaEQuiz(aprendizado);
}
