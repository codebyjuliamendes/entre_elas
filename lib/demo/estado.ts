import { z } from "zod";
import {
  estadoDemoSchema,
  jornadaSchema,
  publicacaoDemoSchema,
  resultadoPautaSchema,
  resultadoMatchSchema,
  resultadoDicaSchema,
  type EstadoDemo,
  type JornadaDemo,
} from "./schemas";
import { ANA_ID, ana, perfisDemo, comunidadesDemo } from "./catalogo";
export const jornadaInicial: JornadaDemo = jornadaSchema.parse({
  step: 1,
  pedido: "",
  match: null,
  pauta: null,
  aprendizado: "",
  resultado: null,
  consentimento_ana: false,
  consentimento_convidada: false,
  horario: null,
  inicio_chamada: null,
  convite_id: null,
});
export function comJornada(
  state: EstadoDemo,
  jornada: JornadaDemo,
): EstadoDemo {
  return estadoDemoSchema.parse({
    ...state,
    jornada,
    convites: state.convites.map((c) =>
      c.id === jornada.convite_id ? { ...c, rascunho: jornada } : c,
    ),
  });
}
export function criarEstadoInicial(): EstadoDemo {
  return estadoDemoSchema.parse({
    versao: 2,
    jornada: { ...jornadaInicial },
    publicacoes: [],
    convites: [],
    mensagens: [],
    comunidades: ["campo"],
    eventos: [],
    salvos: [],
    perfil: {
      bio: ana.bio,
      saberes: [...ana.saberes],
      objetivos: ["Apresentar projetos com mais segurança"],
    },
    posts: [],
    comentarios: [],
    curtidas: [],
    notificacoes_lidas: [],
  });
}
export function restaurarEstado(entrada: unknown): EstadoDemo {
  const bruto = z
    .object({ versao: z.union([z.literal(1), z.literal(2)]) })
    .passthrough()
    .parse(entrada);
  if (bruto.versao === 2)
    return validarReferencias(estadoDemoSchema.parse(bruto));
  const convertido = validarReferencias(
    estadoDemoSchema.parse({ ...bruto, versao: 2 }),
  );
  const j = convertido.jornada;
  const convite = convertido.convites.findLast(
    (c) =>
      c.perfil_id === j.match?.perfil_sugerido_id &&
      c.tema === j.pedido &&
      c.horario === j.horario,
  );
  return comJornada(
    convertido,
    jornadaSchema.parse({
      ...j,
      convite_id: convite?.id ?? null,
      step: j.step >= 3 && !convite ? (j.match ? 2 : 1) : j.step,
    }),
  );
}
export function selecionarConexao(
  state: EstadoDemo,
  entrada: unknown,
): EstadoDemo {
  const match = resultadoMatchSchema.parse(entrada);
  if (
    match.perfil_sugerido_id === ANA_ID ||
    !perfisDemo.some((p) => p.id === match.perfil_sugerido_id)
  )
    throw new Error("Escolha uma conexão válida da rede.");
  return estadoDemoSchema.parse({
    ...state,
    jornada: {
      ...jornadaInicial,
      pedido: state.jornada.pedido,
      match,
      step: 2,
    },
  });
}
export function aceitarConviteState(
  state: EstadoDemo,
  entrada: unknown,
  agora = new Date(),
): EstadoDemo {
  const input = z
    .object({
      id: z.uuid(),
      horario: z.iso.datetime({ offset: true }),
      pauta: resultadoPautaSchema,
    })
    .parse(entrada);
  const j = state.jornada;
  if (!j.match || j.pedido.trim().length < 5)
    throw new Error("Escolha uma conexão e descreva o objetivo.");
  if (Date.parse(input.horario) <= agora.getTime())
    throw new Error("Escolha um horário futuro.");
  const existente =
    j.convite_id && state.convites.find((c) => c.id === j.convite_id);
  if (existente && existente.status !== "cancelada") return state;
  return comJornada(
    estadoDemoSchema.parse({
      ...state,
      convites: [
        ...state.convites,
        {
          id: input.id,
          perfil_id: j.match.perfil_sugerido_id,
          tema: j.pedido,
          horario: input.horario,
          status: "aceita",
        },
      ].slice(-50),
      jornada: {
        ...j,
        convite_id: input.id,
        horario: input.horario,
        pauta: input.pauta,
        step: 3,
        consentimento_ana: false,
        consentimento_convidada: false,
      },
    }),
    jornadaSchema.parse({
      ...j,
      convite_id: input.id,
      horario: input.horario,
      pauta: input.pauta,
      step: 3,
      consentimento_ana: false,
      consentimento_convidada: false,
    }),
  );
}
export function exigirEncontro(state: EstadoDemo) {
  const j = state.jornada;
  const c = state.convites.find((c) => c.id === j.convite_id);
  if (
    !c ||
    c.perfil_id !== j.match?.perfil_sugerido_id ||
    c.tema !== j.pedido ||
    c.status === "cancelada"
  )
    throw new Error(
      "Este encontro não está mais ativo. Comece uma nova Faísca.",
    );
  return c;
}
export function concluirEncontroState(
  state: EstadoDemo,
  entrada: unknown,
): EstadoDemo {
  const resultado = resultadoDicaSchema.parse(entrada);
  const c = exigirEncontro(state);
  if (state.jornada.aprendizado.trim().length < 10)
    throw new Error("Registre seu aprendizado antes de concluir.");
  if (state.publicacoes.some((p) => p.id === c.id))
    throw new Error("Este aprendizado já foi publicado.");
  return comJornada(
    estadoDemoSchema.parse({
      ...state,
      convites: state.convites.map((i) =>
        i.id === c.id ? { ...i, status: "realizada" } : i,
      ),
    }),
    jornadaSchema.parse({
      ...state.jornada,
      resultado,
      step: 6,
      consentimento_ana: false,
      consentimento_convidada: false,
    }),
  );
}
export function autorizarState(
  state: EstadoDemo,
  participante: "ana" | "convidada",
  autorizado: boolean,
): EstadoDemo {
  const c = exigirEncontro(state);
  if (c.status !== "realizada" || !state.jornada.resultado)
    throw new Error("Conclua a troca antes de autorizar.");
  return comJornada(
    state,
    jornadaSchema.parse({
      ...state.jornada,
      [participante === "ana"
        ? "consentimento_ana"
        : "consentimento_convidada"]: z.boolean().parse(autorizado),
    }),
  );
}
export function publicarState(
  state: EstadoDemo,
  agora = new Date(),
): EstadoDemo {
  const j = state.jornada,
    c = exigirEncontro(state);
  const existente = state.publicacoes.find((p) => p.id === c.id);
  if (existente) return state;
  if (c.status !== "realizada" || !j.resultado || !j.match)
    throw new Error("Conclua o encontro antes de publicar.");
  if (!j.consentimento_ana || !j.consentimento_convidada)
    throw new Error("As duas participantes precisam autorizar a publicação.");
  const post = publicacaoDemoSchema.parse({
    id: c.id,
    perfil_id: c.perfil_id,
    autora_id: ANA_ID,
    ...j.resultado,
    created_at: agora.toISOString(),
    consentimentos: [ANA_ID, c.perfil_id],
  });
  return estadoDemoSchema.parse({
    ...state,
    publicacoes: [post, ...state.publicacoes].slice(0, 50),
  });
}
export function cancelarEncontroState(
  state: EstadoDemo,
  entrada: unknown,
): EstadoDemo {
  const id = z.uuid().parse(entrada);
  const convite = state.convites.find((c) => c.id === id);
  if (!convite) throw new Error("Encontro não encontrado.");
  if (convite.status !== "aceita")
    throw new Error("Somente encontros aceitos podem ser cancelados.");
  return estadoDemoSchema.parse({
    ...state,
    convites: state.convites.map((c) =>
      c.id === id ? { ...c, status: "cancelada" } : c,
    ),
    jornada:
      state.jornada.convite_id === id ? { ...jornadaInicial } : state.jornada,
  });
}
export function validarComunidade(id: string) {
  if (!comunidadesDemo.some((c) => c.id === id))
    throw new Error("Comunidade não encontrada.");
}

export function retomarEncontroState(
  state: EstadoDemo,
  id: string,
): EstadoDemo {
  const c = state.convites.find((c) => c.id === z.uuid().parse(id));
  if (!c || c.status === "cancelada" || !c.rascunho)
    throw new Error("Este encontro não tem uma jornada ativa para retomar.");
  return comJornada(state, c.rascunho);
}

function validarReferencias(s: EstadoDemo): EstadoDemo {
  const conhecidos = new Set(perfisDemo.map((p) => p.id));
  if (
    s.convites.some((c) => !conhecidos.has(c.perfil_id)) ||
    s.publicacoes.some(
      (p) => !conhecidos.has(p.perfil_id) || !conhecidos.has(p.autora_id),
    ) ||
    s.posts.some((p) => !conhecidos.has(p.autora_id)) ||
    s.comentarios.some((c) => !conhecidos.has(c.autora_id)) ||
    (s.jornada.match && !conhecidos.has(s.jornada.match.perfil_sugerido_id))
  )
    throw new Error("O backup contém perfis incompatíveis.");
  for (const c of s.convites)
    if (
      c.rascunho &&
      (c.rascunho.convite_id !== c.id ||
        c.rascunho.match?.perfil_sugerido_id !== c.perfil_id)
    )
      throw new Error("O backup contém encontros incompatíveis.");
  return s;
}
