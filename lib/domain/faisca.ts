import { permitirIA } from "@/lib/piloto/ia";
import { z } from "zod";
import { getDb, verificarErro } from "@/lib/db/client";
import * as s from "@/lib/schemas/entities";
import { ErroDominio } from "./erros";
import {
  exigirParticipante,
  validarRespostaConvite,
  validarPublicacao,
} from "./regras";
import { obterPerfil } from "./perfil";
import { gerarPauta, gerarResumo, gerarQuiz } from "@/lib/ai/curadora";
import { sincronizarPerfil, criarCanal } from "@/lib/integrations/stream";
import { criarSala, tokenSala, encerrarSala } from "@/lib/integrations/daily";
export async function obterFaisca(entrada: unknown, usuaria: string) {
  const { data, error } = await getDb()
    .from("faiscas")
    .select("*")
    .eq("id", s.id.parse(entrada))
    .maybeSingle();
  verificarErro(error);
  if (!data) throw new ErroDominio("Faísca não encontrada.", 404);
  const f = s.faisca.parse(data);
  exigirParticipante(f, usuaria);
  return f;
}
export async function listarFaiscas(usuaria: string) {
  const u = s.id.parse(usuaria);
  const { data, error } = await getDb()
    .from("faiscas")
    .select("*")
    .or(`solicitante_id.eq.${u},convidada_id.eq.${u}`)
    .order("created_at", { ascending: false });
  verificarErro(error);
  return z.array(s.faisca).parse(data);
}
export async function criarFaisca(entrada: unknown, usuaria: string) {
  const input = s.criarFaiscaInput.parse(entrada);
  const u = s.id.parse(usuaria);
  if (input.solicitante_id !== u || u === input.convidada_id)
    throw new ErroDominio("Solicitante inválida.");
  if (process.env.APP_MODE === "piloto") {
    const chave = z.object({ chave_pedido: s.id }).parse(entrada).chave_pedido;
    const { data, error } = await getDb().rpc("piloto_criar_convite", {
      usuaria_id: u,
      chave,
      dados: input,
    });
    if (error) throw new ErroDominio(error.message, 409);
    return s.faisca.parse(data);
  }
  if (input.horarios_propostos.some((h) => Date.parse(h) <= Date.now()))
    throw new ErroDominio("Proponha horários futuros.");
  await obterPerfil(input.convidada_id);
  const { data, error } = await getDb()
    .from("faiscas")
    .insert(input)
    .select("*")
    .single();
  verificarErro(error);
  return s.faisca.parse(data);
}
async function operar(
  fid: string,
  u: string,
  acao: string,
  dados: Record<string, unknown> = {},
) {
  const { data, error } = await getDb().rpc("operar_faisca", {
    faisca_id: s.id.parse(fid),
    usuaria_id: s.id.parse(u),
    acao,
    dados: z.record(z.string(), z.json()).parse(dados),
  });
  if (error) throw new ErroDominio(error.message, 409);
  return s.faisca.parse(data);
}
export async function aceitarFaisca(entrada: unknown, usuaria: string) {
  const input = z
    .object({ faisca_id: s.id, horario: z.iso.datetime({ offset: true }) })
    .parse(entrada);
  const f = await obterFaisca(input.faisca_id, usuaria);
  validarRespostaConvite(f, usuaria, input.horario);
  await operar(f.id, usuaria, "aceitar", { horario: input.horario });
  return reprocessarIntegracoes(f.id, usuaria);
}
export async function recusarFaisca(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  validarRespostaConvite(f, usuaria);
  return operar(f.id, usuaria, "recusar");
}
export async function cancelarFaisca(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  const cancelada =
    f.status === "cancelada" ? f : await operar(f.id, usuaria, "cancelar");
  return desativarVideo(cancelada);
}
async function desativarVideo(f: s.Faisca) {
  if (process.env.APP_MODE !== "piloto" || !f.daily_room_url) return f;
  try {
    await encerrarSala(f.id);
    const { data, error } = await getDb()
      .from("faiscas")
      .update({ daily_room_url: null })
      .eq("id", f.id)
      .select("*")
      .single();
    verificarErro(error);
    return s.faisca.parse(data);
  } catch {
    const avisos = [
      ...new Set([
        ...f.integracao_erros,
        "Encerramento da sala pendente. Tente novamente; tokens emitidos expiram em até cinco minutos.",
      ]),
    ];
    const { data, error } = await getDb()
      .from("faiscas")
      .update({ integracao_erros: avisos })
      .eq("id", f.id)
      .select("*")
      .single();
    verificarErro(error);
    return s.faisca.parse(data);
  }
}
export async function registrarAnotacoes(entrada: unknown, usuaria: string) {
  const input = z.object({ faisca_id: s.id, texto: s.texto }).parse(entrada);
  await obterFaisca(input.faisca_id, usuaria);
  return operar(input.faisca_id, usuaria, "anotar", { texto: input.texto });
}
export async function concluirFaisca(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  if (f.status !== "aceita")
    throw new ErroDominio("A Faísca precisa estar aceita.", 409);
  await Promise.all([permitirIA(f.solicitante_id), permitirIA(f.convidada_id)]);
  const resumo = await gerarResumo({ anotacoes: f.anotacoes });
  return desativarVideo(
    await operar(f.id, usuaria, "concluir", { resumo, anotacoes: f.anotacoes }),
  );
}
export async function autorizarPublicacao(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  return operar(f.id, usuaria, "autorizar");
}
export async function publicarComoDica(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  validarPublicacao(f);
  let perguntas;
  if (process.env.APP_MODE === "piloto") {
    // Quiz de leitura determinístico: publicação manual não exige compartilhar textos com IA.
    const r = f.resumo!;
    perguntas = s.quizPerguntas.parse([
      {
        pergunta: "Qual é o tema desta dica?",
        alternativas: [
          r.rascunho_dica.titulo,
          "Um assunto que não foi conversado",
          "Uma comparação entre participantes",
          "Uma recomendação sem contexto",
        ],
        correta: 0,
      },
      {
        pergunta: "Qual aprendizado foi registrado nesta troca?",
        alternativas: [
          "Nenhum aprendizado foi registrado",
          r.aprendizados[0],
          "Uma afirmação sem relação com a troca",
          "Uma informação que não consta da síntese",
        ],
        correta: 1,
      },
      {
        pergunta: "Como aplicar o que foi compartilhado?",
        alternativas: [
          "Tratar como uma regra universal",
          "Ignorar o contexto da conversa",
          "Avaliar a dica no próprio contexto e combinar um próximo passo",
          "Publicar novas informações em nome de outra pessoa",
        ],
        correta: 2,
      },
    ]);
  } else perguntas = await gerarQuiz(f.resumo!.rascunho_dica.corpo);
  const { data, error } = await getDb().rpc("publicar_faisca", {
    faisca_id: f.id,
    usuaria_id: s.id.parse(usuaria),
    perguntas,
  });
  verificarErro(error);
  return s.post.parse(data);
}
export async function reprocessarIntegracoes(
  entrada: unknown,
  usuaria: string,
) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  if (f.status !== "aceita" || !f.horario)
    throw new ErroDominio("A Faísca precisa estar aceita.", 409);
  const perfis = await Promise.all([
    obterPerfil(f.solicitante_id),
    obterPerfil(f.convidada_id),
  ]);
  const atualizacoes: {
    stream_channel_id?: string;
    daily_room_url?: string;
    pauta?: z.infer<typeof s.pauta>;
    integracao_erros: string[];
  } = { integracao_erros: [] };
  await Promise.all([
    (async () => {
      if (f.stream_channel_id) return;
      try {
        await Promise.all(perfis.map(sincronizarPerfil));
        atualizacoes.stream_channel_id = await criarCanal({
          id: `faisca-${f.id}`,
          participantes: perfis.map((p) => p.id),
          criadora: f.solicitante_id,
        });
      } catch {
        atualizacoes.integracao_erros.push("Stream: falha ao criar canal.");
      }
    })(),
    (async () => {
      if (f.daily_room_url) return;
      try {
        atualizacoes.daily_room_url = await criarSala({
          faisca_id: f.id,
          horario: f.horario,
        });
      } catch {
        atualizacoes.integracao_erros.push("Daily: falha ao criar sala.");
      }
    })(),
    (async () => {
      if (f.pauta) return;
      try {
        atualizacoes.pauta = await gerarPauta({ perfis, tema: f.tema });
      } catch {
        atualizacoes.integracao_erros.push("IA: falha ao gerar pauta.");
      }
    })(),
  ]);
  const { data, error } = await getDb()
    .from("faiscas")
    .update(atualizacoes)
    .eq("id", f.id)
    .select("*")
    .single();
  verificarErro(error);
  return s.faisca.parse(data);
}
export async function obterTokenVideo(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  if (f.status !== "aceita" || !f.daily_room_url)
    throw new ErroDominio("Sala indisponível.", 409);
  return z.object({ url: z.url(), token: z.string() }).parse({
    url: f.daily_room_url,
    token: await tokenSala({ faisca_id: f.id, profile_id: usuaria }),
  });
}

export async function concluirManualmente(entrada: unknown, usuaria: string) {
  const input = z
    .object({ faisca_id: s.id, texto: z.string().trim().min(20).max(4000) })
    .parse(entrada);
  const f = await obterFaisca(input.faisca_id, usuaria);
  if (f.status !== "aceita")
    throw new ErroDominio("A Faísca precisa estar aceita.", 409);
  return desativarVideo(
    await operar(f.id, usuaria, "concluir", {
      anotacoes: f.anotacoes,
      resumo: {
        aprendizados: [input.texto],
        proximos_passos: [],
        rascunho_dica: { titulo: f.tema.slice(0, 160), corpo: input.texto },
      },
    }),
  );
}

export async function revisarResumoPiloto(entrada: unknown, usuaria: string) {
  const input = z
    .object({ faisca_id: s.id, texto: z.string().trim().min(20).max(4000) })
    .parse(entrada);
  const f = await obterFaisca(input.faisca_id, usuaria);
  const novo = s.resumo.parse({
    aprendizados: [input.texto],
    proximos_passos: [],
    rascunho_dica: { titulo: f.tema.slice(0, 160), corpo: input.texto },
  });
  const { data, error } = await getDb().rpc("piloto_revisar_resumo", {
    faisca_id: f.id,
    usuaria_id: s.id.parse(usuaria),
    novo_resumo: novo,
  });
  if (error) throw new ErroDominio(error.message, 409);
  return s.faisca.parse(data);
}
export async function autorizarPiloto(entrada: unknown, usuaria: string) {
  const input = z
    .object({
      faisca_id: s.id,
      resumo: s.resumo,
      autorizado: z.boolean().default(true),
    })
    .parse(entrada);
  const { data, error } = await getDb().rpc("piloto_autorizar", {
    faisca_id: input.faisca_id,
    usuaria_id: s.id.parse(usuaria),
    resumo_lido: input.resumo,
    autorizado: input.autorizado,
  });
  if (error) throw new ErroDominio(error.message, 409);
  return s.faisca.parse(data);
}

export async function encerrarVideoPiloto(entrada: unknown, usuaria: string) {
  const f = await obterFaisca(s.id.parse(entrada), usuaria);
  if (!["cancelada", "realizada"].includes(f.status))
    throw new ErroDominio("A conversa ainda está ativa.", 409);
  return desativarVideo(f);
}
