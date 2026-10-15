"use server";
import { pilotoAtivo } from "@/lib/piloto/config";
function exigirApresentacao() {
  if (pilotoAtivo()) throw new Error("Use a curadoria autenticada do piloto.");
}
import { assistentePitch } from "@/lib/ai/pitch";
export async function matchFaisca(
  pedido: string,
  excluir?: string,
  contexto?: unknown,
) {
  exigirApresentacao();
  return assistentePitch.matchFaisca(pedido, excluir, contexto);
}
export async function gerarPauta(
  tema: string,
  perfilA: string,
  perfilB: string,
  contexto?: unknown,
) {
  exigirApresentacao();
  return assistentePitch.gerarPauta(tema, perfilA, perfilB, contexto);
}
export async function gerarDicaEQuiz(aprendizado: string) {
  exigirApresentacao();
  return assistentePitch.gerarDicaEQuiz(aprendizado);
}
