/** Regressão com casos exclusivamente fictícios; não lê perfis do banco. */
import { criarProvider } from "@/lib/ai/provider";
import { gerarGemini } from "@/lib/ai/gemini";
import { gerarGroq } from "@/lib/ai/groq";
import { prompt } from "@/lib/ai/prompts/contexto";
import * as ranking from "@/lib/ai/prompts/ranquear";
import { indicacoes } from "@/lib/schemas/entities";
import { validarIndicacoes } from "@/lib/ai/curadora";
import { casosCuradoria } from "./casos-curadoria";
async function main() {
  const solicitante_id = "00000000-0000-4000-8000-000000007099";
  for (const caso of casosCuradoria) {
    if (
      new Set(caso.candidatas.map((c) => c.profile_id)).size !==
        caso.candidatas.length ||
      caso.esperadas.some(
        (id) => !caso.candidatas.some((c) => c.profile_id === id),
      )
    )
      throw new Error("Caso de avaliação inconsistente.");
  }
  if (!process.argv.includes("--live")) {
    console.log(
      `${casosCuradoria.length} casos fictícios validados. Zero chamadas de IA executadas. Use --live para avaliar os provedores reais.`,
    );
    return;
  }
  if (!process.env.GEMINI_API_KEY || !process.env.GROQ_API_KEY) {
    console.error(
      "Avaliação remota não executada: Gemini e Groq precisam estar configurados neste processo. Nenhuma chave foi exibida.",
    );
    process.exitCode = 1;
    return;
  }
  let falhas = 0;
  const provider = criarProvider({
    gemini: gerarGemini,
    groq: gerarGroq,
    embedding: async () => {
      throw new Error("Esta avaliação não gera embeddings.");
    },
    cache: { ler: async () => null, gravar: async () => {} },
  });
  for (const caso of casosCuradoria) {
    const inicio = Date.now();
    try {
      const entrada = {
        pedido: caso.pedido,
        candidatas: caso.candidatas,
        solicitante_id,
      };
      const resposta = await provider.gerar(
        prompt(ranking.instrucao, entrada),
        indicacoes,
        {
          versao: ranking.versao,
          validar: (resultado) => {
            validarIndicacoes({ ...entrada, indicacoes: resultado });
          },
        },
      );
      const ids = resposta.map((i) => i.profile_id);
      const ok = caso.esperadas.length
        ? caso.esperadas.every((id) => ids.includes(id)) &&
          ids.every((id) => caso.esperadas.includes(id))
        : ids.length === 0;
      if (!ok) falhas++;
      console.log(
        JSON.stringify({
          caso: caso.nome,
          status: ok ? "passou" : "revisar_adequacao",
          duracao_ms: Date.now() - inicio,
          indicacoes: ids.length,
        }),
      );
    } catch {
      falhas++;
      console.log(
        JSON.stringify({
          caso: caso.nome,
          status: "falhou",
          duracao_ms: Date.now() - inicio,
        }),
      );
    }
  }
  console.log(
    `${casosCuradoria.length - falhas}/${casosCuradoria.length} casos aprovados. É uma regressão pequena com textos fictícios; não certifica todos os pedidos ou disponibilidade por seis dias.`,
  );
  process.exitCode = falhas ? 1 : 0;
}
void main().catch(() => {
  console.error("Avaliação interrompida; nenhum dado privado foi exibido.");
  process.exitCode = 1;
});
