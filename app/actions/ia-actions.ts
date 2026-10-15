"use server";
import { assistentePitch } from "@/lib/ai/pitch";
export async function matchFaisca(pedido: string, excluir?: string) {
  return assistentePitch.matchFaisca(pedido, excluir);
}
export async function gerarPauta(
  tema: string,
  perfilA: string,
  perfilB: string,
) {
  return assistentePitch.gerarPauta(tema, perfilA, perfilB);
}
export async function gerarDicaEQuiz(aprendizado: string) {
  return assistentePitch.gerarDicaEQuiz(aprendizado);
}
