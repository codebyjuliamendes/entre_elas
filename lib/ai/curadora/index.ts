import { pilotoAtivo } from "@/lib/piloto/config";
import { z } from "zod";
import { gerar, embed, type OpcoesIA } from "@/lib/ai/provider";
import { getDb, verificarErro } from "@/lib/db/client";
import * as s from "@/lib/schemas/entities";
import { prompt } from "@/lib/ai/prompts/contexto";
import * as extracao from "@/lib/ai/prompts/extrair-saberes";
import * as interpretacao from "@/lib/ai/prompts/interpretar-pedido";
import * as ranking from "@/lib/ai/prompts/ranquear";
import * as conexoes from "@/lib/ai/prompts/sugerir-conexoes";
import * as pauta from "@/lib/ai/prompts/gerar-pauta";
import * as resumo from "@/lib/ai/prompts/gerar-resumo";
import * as quiz from "@/lib/ai/prompts/gerar-quiz";
import * as mensagens from "@/lib/ai/prompts/sugerir-mensagens";
import * as assuntos from "@/lib/ai/prompts/sugerir-assunto";
import { validarResumoFundamentado } from "@/lib/domain/resumo-fundamentacao";
import { ErroIA } from "@/lib/domain/erros";
export async function extrairSaberes(entrada: unknown) {
  const input = z
    .object({
      texto: s.texto,
      autora: s.id,
      resumo_contexto: s.resumo.nullable().optional(),
    })
    .parse(entrada);
  const result = await gerar(prompt(extracao.instrucao, input), s.extraidos, {
    cache: true,
    versao: extracao.versao,
  });
  if (result.some((x) => !input.texto.includes(x.evidencia)))
    throw new ErroIA("A evidência extraída não consta no texto da autora.");
  return s.extraidos.parse(result);
}
export async function interpretarPedido(
  entrada: unknown,
  opcoes: Pick<OpcoesIA, "signal"> = {},
) {
  const pedido = s.texto.parse(entrada);
  return s.pedidoInterpretado.parse(
    await gerar(
      prompt(interpretacao.instrucao, { pedido }),
      s.pedidoInterpretado,
      { cache: true, versao: interpretacao.versao, prazoMs: 16000, ...opcoes },
    ),
  );
}
export async function buscarCandidatas(
  entrada: unknown,
  opcoes: Pick<OpcoesIA, "signal"> = {},
) {
  const input = z
    .object({ saberes: z.array(s.texto).min(2).max(3), solicitante_id: s.id })
    .parse(entrada);
  const vetor = await embed(input.saberes.join("; "), opcoes);
  const { data, error } = await getDb().rpc(
    pilotoAtivo() ? "buscar_saberes_piloto" : "buscar_saberes",
    {
      query_embedding: JSON.stringify(vetor),
      limite: 10,
      excluir_profile_id: input.solicitante_id,
    },
  );
  verificarErro(error);
  if (pilotoAtivo()) {
    const { data: contas, error: ce } = await getDb()
      .from("piloto_contas")
      .select("profile_id")
      .eq("ia_consentimento", true);
    verificarErro(ce);
    return s.candidatas
      .parse(data)
      .filter((p) => contas?.some((c) => c.profile_id === p.profile_id));
  }
  return s.candidatas.parse(data);
}
export function validarIndicacoes(entrada: unknown) {
  const input = z
    .object({
      indicacoes: s.indicacoes,
      candidatas: s.candidatas,
      solicitante_id: s.id,
    })
    .parse(entrada);
  const vistos = new Set<string>();
  for (const i of input.indicacoes) {
    const c = input.candidatas.find((c) => c.profile_id === i.profile_id);
    if (
      !c ||
      i.profile_id === input.solicitante_id ||
      vistos.has(i.profile_id) ||
      i.evidencias.some((e) => !c.evidencias.includes(e)) ||
      !i.evidencias.some((e) => i.motivo.includes(e))
    )
      throw new ErroIA("Indicação sem candidata ou evidência válida.");
    vistos.add(i.profile_id);
  }
  return s.indicacoes.parse(input.indicacoes);
}
export function diversificar(entrada: unknown) {
  const input = z
    .object({ candidatas: s.candidatas, solicitante_id: s.id })
    .parse(entrada);
  const restantes = input.candidatas.filter(
    (c) => c.profile_id !== input.solicitante_id,
  );
  const escolhidas: s.Candidata[] = [];
  while (restantes.length && escolhidas.length < 10) {
    restantes.sort((a, b) => score(b) - score(a));
    escolhidas.push(restantes.shift()!);
  }
  function score(c: s.Candidata) {
    return (
      c.similaridade +
      (escolhidas.some((x) => x.area === c.area) ? 0 : 0.08) +
      (escolhidas.some((x) => x.regional === c.regional) ? 0 : 0.08)
    );
  }
  return s.candidatas.parse(escolhidas);
}
export async function ranquear(
  entrada: unknown,
  opcoes: Pick<OpcoesIA, "signal"> = {},
) {
  const input = z
    .object({ pedido: s.texto, candidatas: s.candidatas, solicitante_id: s.id })
    .parse(entrada);
  if (!input.candidatas.length) return s.indicacoes.parse([]);
  const candidatas = diversificar(input);
  const result = await gerar(
    prompt(ranking.instrucao, { ...input, candidatas }),
    s.indicacoes,
    { cache: true, versao: ranking.versao, prazoMs: 16000, ...opcoes },
  );
  return validarIndicacoes({ ...input, indicacoes: result });
}
export async function sugerirConexoes(entrada: unknown) {
  const input = z
    .object({ perfil: s.profile, candidatas: s.candidatas })
    .parse(entrada);
  const candidatas = diversificar({
    candidatas: input.candidatas,
    solicitante_id: input.perfil.id,
  });
  if (!candidatas.length) return s.indicacoes.parse([]);
  const result = await gerar(
    prompt(conexoes.instrucao, {
      objetivos: input.perfil.objetivos,
      candidatas,
    }),
    s.indicacoes,
    { cache: true, versao: conexoes.versao },
  );
  return validarIndicacoes({
    indicacoes: result,
    candidatas,
    solicitante_id: input.perfil.id,
  });
}
export async function gerarPauta(entrada: unknown) {
  const input = z
    .object({ perfis: z.array(s.profile).length(2), tema: s.texto })
    .parse(entrada);
  if (pilotoAtivo()) {
    const { permitirIA } = await import("@/lib/piloto/ia");
    await Promise.all(input.perfis.map((p) => permitirIA(p.id)));
  }
  return s.pauta.parse(
    await gerar(
      prompt(pauta.instrucao, {
        tema: input.tema,
        perfis: input.perfis.map(
          ({ nome, cargo, area, regional, interesses, objetivos }) => ({
            nome,
            cargo,
            area,
            regional,
            interesses,
            objetivos,
          }),
        ),
      }),
      s.pauta,
      { cache: true, versao: pauta.versao },
    ),
  );
}
export async function gerarResumo(entrada: unknown) {
  const input = z.object({ anotacoes: z.record(s.id, s.texto) }).parse(entrada);
  if (Object.keys(input.anotacoes).length !== 2)
    throw new ErroIA("São necessárias anotações das duas participantes.");
  const resultado = await gerar(
    prompt(resumo.instrucao, input),
    s.resumoFundamentado,
    {
      cache: true,
      versao: resumo.versao,
      validar: (resultado) => {
        validarResumoFundamentado({
          anotacoes: input.anotacoes,
          resumo: resultado,
        });
      },
    },
  );
  return validarResumoFundamentado({
    anotacoes: input.anotacoes,
    resumo: resultado,
  });
}
export async function gerarQuiz(entrada: unknown) {
  const input = s.texto.parse(entrada);
  return s.quizPerguntas.parse(
    await gerar(prompt(quiz.instrucao, { dica: input }), s.quizPerguntas, {
      cache: true,
      versao: quiz.versao,
    }),
  );
}
export async function sugerirMensagens(entrada: unknown) {
  const input = z
    .object({
      tema: s.texto,
      mensagens: z.array(z.string().max(10000)).max(10),
    })
    .parse(entrada);
  return s.sugestoes.parse(
    await gerar(prompt(mensagens.instrucao, input), s.sugestoes),
  );
}
export async function sugerirAssunto(entrada: unknown) {
  const input = z
    .object({ interesses: z.array(z.array(s.texto)).min(2) })
    .parse(entrada);
  return s.assuntos.parse(
    await gerar(prompt(assuntos.instrucao, input), s.assuntos),
  );
}
