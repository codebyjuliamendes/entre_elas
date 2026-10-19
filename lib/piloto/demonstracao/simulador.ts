import {
  ANA,
  recalcularDisponibilidade,
  type EstadoDemonstracao,
  type Pessoa,
} from "./dados";
import { avaliarIndexacao } from "@/lib/domain/perfil-indexacao";
import { faiscasPorMes } from "@/lib/domain/disponibilidade";
import type { DadosPiloto } from "@/lib/piloto/dados";

// Responde às mesmas rotas do piloto, no navegador, com as regras de domínio
// que a interface precisa mostrar (só a convidada aceita, a dica exige as duas
// autorizações). Nada é enviado ao servidor nem a provedores de IA.
type Faisca = DadosPiloto["faiscas"][number];
type Corpo = Record<string, unknown>;
export class ErroDemonstracao extends Error {}

const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Palavras do pedido que levam a cada saber declarado na rede fictícia.
const TEMAS: [RegExp, string[]][] = [
  [
    /diretori|apresent|reuniao|slide|comite/,
    ["Apresentações à diretoria", "Comunicação clara"],
  ],
  [
    /indicador|dado|metric|planilh|excel|power ?bi|painel|grafico/,
    ["Indicadores de desempenho", "Power BI", "Excel avançado"],
  ],
  [
    /lider|equipe|coorden|supervis|gest(ao|ora) de pessoas/,
    ["Liderança de equipes", "Escalas de plantão"],
  ],
  [
    /seguran|risco|acident|manobra|nr-?10/,
    ["Segurança em campo", "Análise de risco antes da manobra", "NR-10"],
  ],
  [
    /carreira|crescer|pdi|desenvolv|promoc|mentor/,
    ["Plano de desenvolvimento", "Mentoria", "Feedback"],
  ],
  [/negoci|fornecedor|contrat/, ["Negociação", "Negociação com fornecedores"]],
  [/orcament|custo|obra|financ/, ["Orçamento de obras", "Orçamento"]],
  [
    /drone|inspec/,
    ["Inspeção com drones", "Inspeção de redes de distribuição"],
  ],
  [
    /cliente|atendiment|conflit|reclama/,
    ["Atendimento ao cliente", "Gestão de conflitos"],
  ],
  [
    /comunic|ideia|falar|public|escrever/,
    ["Comunicação clara", "Apresentações à diretoria"],
  ],
  [
    /automa|subesta|telecomando|diagrama/,
    ["Automação de subestações", "Leitura de diagramas"],
  ],
  [/regula|aneel|tarif/, ["Regulação do setor elétrico"]],
  [
    /diversidade|inclus|mae|maternidade/,
    ["Diversidade e inclusão", "Projetos sociais"],
  ],
  [/linha viva|socorro/, ["Linha viva", "Primeiros socorros"]],
];

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const novoId = () => crypto.randomUUID();

export function criarSimulador(
  estado: EstadoDemonstracao,
  aoMudar: () => void = () => {},
) {
  const d = estado.dados;
  const agora = () => new Date().toISOString();
  const pessoa = (id: string) => d.pessoas.find((p) => p.id === id);
  const primeiroNome = (id: string) =>
    pessoa(id)?.nome.split(" ")[0] ?? "Colega";
  const texto = (corpo: Corpo, campo: string, min = 1) => {
    const v = corpo[campo];
    if (typeof v !== "string" || v.trim().length < min)
      throw new ErroDemonstracao("Preencha o campo antes de continuar.");
    return v.trim();
  };
  function faisca(corpo: Corpo) {
    const f = d.faiscas.find((x) => x.id === corpo.faisca_id);
    if (!f) throw new ErroDemonstracao("Faísca não encontrada.");
    if (![f.solicitante_id, f.convidada_id].includes(ANA))
      throw new ErroDemonstracao(
        "Só as participantes podem agir nesta Faísca.",
      );
    return f;
  }
  const outra = (f: Faisca) =>
    f.solicitante_id === ANA ? f.convidada_id : f.solicitante_id;
  function mensagem(faiscaId: string, autora: string, conteudo: string) {
    (estado.mensagens[faiscaId] ??= []).push({
      id: novoId(),
      autora_id: autora,
      texto: conteudo,
      created_at: agora(),
    });
  }
  // A colega fictícia responde depois de alguns segundos, como alguém do outro lado.
  function depois(ms: number, fn: () => void) {
    setTimeout(() => {
      fn();
      aoMudar();
    }, ms);
  }
  function pauta(tema: string) {
    return {
      perguntas: [
        `O que você gostaria de ter sabido quando começou a lidar com “${tema}”?`,
        "Qual situação real da sua rotina podemos usar como exemplo?",
        "Qual pequeno passo dá para testar na próxima semana?",
      ],
    };
  }
  function aceitar(f: Faisca, horario: string) {
    f.status = "aceita";
    f.horario = horario;
    f.pauta = pauta(f.tema);
    f.stream_channel_id = "demonstracao";
    f.daily_room_url = "https://demonstracao.entreelas.app/sala";
    f.updated_at = agora();
  }
  function resumir(f: Faisca, manual?: string): NonNullable<Faisca["resumo"]> {
    const minhas = f.anotacoes[ANA] ?? manual ?? "";
    const dela = f.anotacoes[outra(f)] ?? "";
    return {
      aprendizados: [
        manual ??
          `Partir de uma situação real da rotina para falar de ${f.tema.toLowerCase()}`,
        `Aprender com a experiência de ${primeiroNome(outra(f))}, que já viveu esse desafio`,
        "Sair da conversa com um pequeno passo combinado",
      ],
      proximos_passos: [
        "Testar o combinado na próxima semana",
        `Contar o resultado para ${primeiroNome(outra(f))} em quinze dias`,
      ],
      rascunho_dica: {
        titulo: f.tema,
        corpo:
          `${minhas || "Comece pela situação real que você quer resolver."} ${dela}`.trim(),
      },
      evidencias: [
        ...(minhas
          ? [{ aprendizado: 0, autora_id: ANA, trecho: minhas.slice(0, 200) }]
          : []),
        ...(dela
          ? [
              {
                aprendizado: 1,
                autora_id: outra(f),
                trecho: dela.slice(0, 200),
              },
            ]
          : []),
      ],
    };
  }
  function buscar(pedido: string) {
    const p = normalizar(pedido);
    const desejados = new Set(
      TEMAS.filter(([re]) => re.test(p)).flatMap(([, s]) => s),
    );
    const eu = pessoa(ANA)!;
    const candidatas = d.pessoas
      .filter(
        (x) => x.id !== ANA && d.disponibilidade[x.id]?.estado === "aberta",
      )
      .map((x) => {
        const casados = x.interesses.filter(
          (i) =>
            desejados.has(i) ||
            normalizar(p).includes(normalizar(i).split(" ")[0]),
        );
        // Favorece outra regional e outra área, como o ranqueador real.
        const diversidade =
          (x.regional !== eu.regional ? 0.5 : 0) +
          (x.area !== eu.area ? 0.3 : 0);
        return { x, casados, nota: casados.length * 2 + diversidade };
      })
      .filter((c) => c.casados.length)
      .sort((a, b) => b.nota - a.nota)
      .slice(0, 3);
    return candidatas.map(({ x, casados }) => ({
      profile_id: x.id,
      motivo: motivo(x, casados),
      evidencias: [
        `${primeiroNome(x.id)} declara no perfil: ${casados.join(", ")}`,
        ...(estado.experiencias[x.id]?.slice(0, 1) ?? []),
      ],
    }));
  }
  function motivo(x: Pessoa, casados: string[]) {
    const exp = estado.experiencias[x.id]?.[0];
    const regional =
      x.regional !== pessoa(ANA)!.regional
        ? ` e traz o olhar de outra regional (${x.regional})`
        : "";
    return `${primeiroNome(x.id)} é ${x.cargo.toLowerCase()} e compartilha experiência em “${casados[0]}”${regional}. ${exp ? `${exp}.` : ""}`.trim();
  }

  const rotas: Record<string, (c: Corpo) => unknown> = {
    "/api/piloto": () => structuredClone(d),
    "/api/faiscas/buscar": (c) => buscar(texto(c, "pedido", 5)),
    "/api/faiscas": (c) => {
      const convidada = texto(c, "convidada_id");
      if (convidada === ANA)
        throw new ErroDemonstracao("Escolha outra pessoa para a Faísca.");
      if (d.disponibilidade[convidada]?.estado !== "aberta")
        throw new ErroDemonstracao(
          "Esta pessoa não está recebendo convites agora. Escolha outra participante.",
        );
      const horarios = Array.isArray(c.horarios_propostos)
        ? c.horarios_propostos.filter((h): h is string => typeof h === "string")
        : [];
      if (!horarios.length)
        throw new ErroDemonstracao("Proponha pelo menos um horário.");
      const f: Faisca = {
        id: novoId(),
        created_at: agora(),
        updated_at: agora(),
        solicitante_id: ANA,
        convidada_id: convidada,
        pedido: texto(c, "pedido", 5),
        tema: texto(c, "tema"),
        horarios_propostos: horarios,
        horario: null,
        status: "pendente",
        pauta: null,
        anotacoes: {},
        resumo: null,
        publicacao_autorizada_por: [],
        stream_channel_id: null,
        daily_room_url: null,
        integracao_erros: [],
      };
      d.faiscas.unshift(f);
      estado.criadasNaVisita.push(f.id);
      recalcularDisponibilidade(estado);
      depois(7000, () => {
        if (f.status !== "pendente") return;
        aceitar(f, horarios[0]);
        mensagem(
          f.id,
          convidada,
          `Oi, ${primeiroNome(ANA)}! Topo, sim. Já vi a pauta e trago um exemplo real para a gente conversar.`,
        );
      });
      return { id: f.id };
    },
    "/api/faiscas/aceitar": (c) => {
      const f = faisca(c);
      if (f.convidada_id !== ANA)
        throw new ErroDemonstracao("Só a convidada pode aceitar a Faísca.");
      if (f.status !== "pendente")
        throw new ErroDemonstracao("Este convite já foi respondido.");
      aceitar(f, texto(c, "horario"));
      mensagem(
        f.id,
        f.solicitante_id,
        `Que alegria, ${primeiroNome(ANA)}! Obrigada por aceitar. Até lá!`,
      );
      return f;
    },
    "/api/faiscas/recusar": (c) => {
      const f = faisca(c);
      if (f.convidada_id !== ANA)
        throw new ErroDemonstracao("Só a convidada pode recusar a Faísca.");
      f.status = "recusada";
      recalcularDisponibilidade(estado);
      return f;
    },
    "/api/faiscas/cancelar": (c) => {
      const f = faisca(c);
      f.status = "cancelada";
      recalcularDisponibilidade(estado);
      return f;
    },
    "/api/faiscas/reprocessar": (c) => faisca(c),
    "/api/faiscas/fechar-video": (c) => faisca(c),
    "/api/faiscas/video": () => {
      throw new ErroDemonstracao(
        "Na demonstração a videochamada não abre. No piloto, a sala privada abre aqui só para as duas participantes.",
      );
    },
    "/api/faiscas/anotar": (c) => {
      const f = faisca(c);
      if (f.status !== "aceita")
        throw new ErroDemonstracao("A Faísca precisa estar combinada.");
      f.anotacoes[ANA] = texto(c, "texto", 3);
      // A colega fictícia registra as anotações dela para a síntese ter os dois lados.
      f.anotacoes[outra(f)] ??=
        `${primeiroNome(outra(f))} contou como resolveu um desafio parecido e sugeriu começar pequeno, com um teste na próxima semana.`;
      return f;
    },
    "/api/faiscas/concluir": (c) => {
      const f = faisca(c);
      if (f.status !== "aceita")
        throw new ErroDemonstracao("A Faísca precisa estar combinada.");
      if (!f.anotacoes[ANA])
        throw new ErroDemonstracao(
          "Registre suas anotações antes de pedir a síntese.",
        );
      f.status = "realizada";
      f.resumo = resumir(f);
      return f;
    },
    "/api/faiscas/concluir-manual": (c) => {
      const f = faisca(c);
      if (f.status !== "aceita")
        throw new ErroDemonstracao("A Faísca precisa estar combinada.");
      f.status = "realizada";
      f.resumo = resumir(f, texto(c, "texto", 5));
      return f;
    },
    "/api/faiscas/revisar": (c) => {
      const f = faisca(c);
      if (!f.resumo) throw new ErroDemonstracao("Ainda não há síntese.");
      f.resumo.rascunho_dica.corpo = texto(c, "texto", 5);
      f.publicacao_autorizada_por = [];
      return f;
    },
    "/api/faiscas/autorizar": (c) => {
      const f = faisca(c);
      if (f.status !== "realizada" || !f.resumo)
        throw new ErroDemonstracao("A Faísca precisa estar concluída.");
      const autorizo = c.autorizado !== false;
      f.publicacao_autorizada_por = f.publicacao_autorizada_por.filter(
        (p) => p !== ANA,
      );
      if (autorizo) {
        f.publicacao_autorizada_por.push(ANA);
        if (
          estado.criadasNaVisita.includes(f.id) &&
          !f.publicacao_autorizada_por.includes(outra(f))
        )
          depois(4000, () => {
            if (f.publicacao_autorizada_por.includes(ANA))
              f.publicacao_autorizada_por.push(outra(f));
          });
      }
      return f;
    },
    "/api/faiscas/publicar": (c) => {
      const f = faisca(c);
      if (
        !f.resumo ||
        ![f.solicitante_id, f.convidada_id].every((p) =>
          f.publicacao_autorizada_por.includes(p),
        )
      )
        throw new ErroDemonstracao(
          "A dica só é publicada quando as duas autorizam.",
        );
      if (d.posts.some((p) => p.origem_faisca_id === f.id))
        throw new ErroDemonstracao("Esta dica já foi publicada.");
      d.posts.unshift({
        id: novoId(),
        created_at: agora(),
        updated_at: agora(),
        autora_id: ANA,
        community_id: null,
        tipo: "dica",
        titulo: f.resumo.rascunho_dica.titulo,
        corpo: f.resumo.rascunho_dica.corpo,
        origem_faisca_id: f.id,
      });
      return f;
    },
    "/api/piloto/reconhecer": (c) => {
      const f = faisca(c);
      if (!d.saberes.some((s) => s.fonte_id === f.id))
        d.saberes.push({
          id: novoId(),
          created_at: agora(),
          updated_at: agora(),
          profile_id: ANA,
          saber: f.tema,
          evidencia: f.anotacoes[ANA] ?? f.pedido,
          fonte: "faisca",
          fonte_id: f.id,
          confianca: 0.84,
          confirmado: false,
          embedding: null,
        });
      return { extraidos: 1 };
    },
    "/api/piloto/avaliar": (c) => {
      const f = faisca(c);
      if (f.status !== "realizada")
        throw new ErroDemonstracao("A Faísca precisa estar realizada.");
      if (!d.avaliadas.includes(f.id)) d.avaliadas.push(f.id);
      return { ok: true };
    },
    "/api/piloto/mensagens": (c) => estado.mensagens[faisca(c).id] ?? [],
    "/api/piloto/enviar": (c) => {
      const f = faisca(c);
      mensagem(f.id, ANA, texto(c, "texto"));
      const respostas = [
        "Adorei! Vou levar isso para a nossa conversa.",
        "Boa pergunta. Tenho um exemplo de campo que vai ajudar.",
        "Combinado! Te espero no horário marcado.",
      ];
      const n = (estado.mensagens[f.id]?.length ?? 0) % respostas.length;
      depois(3500, () => mensagem(f.id, outra(f), respostas[n]));
      return { ok: true };
    },
    "/api/piloto/consentimento": (c) => {
      d.conta.ia_consentimento = c.autorizado === true;
      d.indexacao = avaliarIndexacao({
        consentimento: d.conta.ia_consentimento,
        interesses: d.perfil.interesses,
        saberes: d.saberes,
      });
      return { ok: true };
    },
    "/api/piloto/disponibilidade": (c) => {
      const n = faiscasPorMes.parse(c.faiscas_por_mes);
      estado.limites[ANA] = n;
      d.conta.faiscas_por_mes = n;
      recalcularDisponibilidade(estado);
      return { ok: true };
    },
    "/api/piloto/foto": (c) => {
      const foto = typeof c.foto === "string" ? c.foto : null;
      d.fotos[ANA] = foto;
      d.conta.foto = foto;
      return { ok: true };
    },
    "/api/piloto/perfil": (c) => {
      const p = d.pessoas.find((x) => x.id === ANA)!;
      for (const campo of [
        "nome",
        "cargo",
        "area",
        "cidade",
        "regional",
      ] as const) {
        const valor = c[campo];
        if (typeof valor === "string" && valor.trim()) p[campo] = valor.trim();
      }
      for (const campo of ["interesses", "objetivos"] as const) {
        const valor = c[campo];
        if (Array.isArray(valor))
          p[campo] = valor.filter((s): s is string => typeof s === "string");
      }
      d.perfil = p;
      return p;
    },
    "/api/piloto/perfil-ia": (c) => {
      const relato = normalizar(texto(c, "texto", 10));
      const extras = TEMAS.filter(([re]) => re.test(relato)).map(
        ([, s]) => s[0],
      );
      return {
        ...d.perfil,
        interesses: [...new Set([...d.perfil.interesses, ...extras])].slice(
          0,
          8,
        ),
      };
    },
    "/api/piloto/indexar": () => {
      for (const saber of d.perfil.interesses)
        if (!d.saberes.some((s) => s.fonte === "perfil" && s.saber === saber))
          d.saberes.push({
            id: novoId(),
            created_at: agora(),
            updated_at: agora(),
            profile_id: ANA,
            saber,
            evidencia: "Declarado no perfil",
            fonte: "perfil",
            fonte_id: null,
            confianca: 1,
            confirmado: true,
            embedding: "demonstracao",
          });
      d.indexacao = avaliarIndexacao({
        consentimento: d.conta.ia_consentimento,
        interesses: d.perfil.interesses,
        saberes: d.saberes,
      });
      return { indexados: d.perfil.interesses.length };
    },
    "/api/piloto/onboarding": () => {
      d.conta.onboarding = true;
      return { ok: true };
    },
    "/api/piloto/indicadores": () => estado.indicadores,
    "/api/piloto/relatos": () => estado.relatos,
    "/api/piloto/relatar": (c) => {
      const categoria = texto(
        c,
        "categoria",
      ) as EstadoDemonstracao["relatos"][number]["categoria"];
      estado.relatos.unshift({
        id: novoId(),
        profile_id: ANA,
        categoria,
        descricao: texto(c, "descricao", 10),
        estado: "aberto",
        created_at: agora(),
        updated_at: agora(),
      });
      return { ok: true };
    },
    "/api/piloto/resolver-relato": (c) => {
      const r = estado.relatos.find((x) => x.id === c.relato_id);
      if (r) r.estado = c.resolvido === true ? "resolvido" : "aberto";
      return { ok: true };
    },
    "/api/piloto/favorito": (c) => {
      const id = texto(c, "post_id");
      d.favoritos = d.favoritos.filter((x) => x !== id);
      if (c.ativo === true) d.favoritos.push(id);
      return { ok: true };
    },
    "/api/posts": (c) => {
      const post = {
        id: novoId(),
        created_at: agora(),
        updated_at: agora(),
        autora_id: ANA,
        community_id:
          typeof c.community_id === "string" ? c.community_id : null,
        tipo: "discussao" as const,
        titulo: texto(c, "titulo"),
        corpo: texto(c, "corpo"),
        origem_faisca_id: null,
      };
      d.posts.unshift(post);
      depois(5000, () =>
        (estado.comentarios[post.id] ??= []).push({
          id: novoId(),
          autora_id: d.pessoas[5].id,
          corpo:
            "Que bom que você trouxe isso! Já passei por algo parecido, posso te contar numa Faísca.",
        }),
      );
      return post;
    },
    "/api/posts/reagir": () => ({ ok: true }),
    "/api/posts/comentarios": (c) =>
      estado.comentarios[texto(c, "post_id")] ?? [],
    "/api/posts/comentar": (c) => {
      (estado.comentarios[texto(c, "post_id")] ??= []).push({
        id: novoId(),
        autora_id: ANA,
        corpo: texto(c, "corpo"),
      });
      return { ok: true };
    },
    "/api/comunidades/entrar": (c) => {
      const id = texto(c, "community_id");
      if (!d.membros.includes(id)) d.membros.push(id);
      return { ok: true };
    },
    "/api/comunidades/sair": (c) => {
      d.membros = d.membros.filter((x) => x !== c.community_id);
      return { ok: true };
    },
    "/api/eventos/participar": (c) => {
      const id = texto(c, "event_id");
      if (!d.inscricoes.includes(id)) d.inscricoes.push(id);
      return { ok: true };
    },
    "/api/eventos/cancelar": (c) => {
      d.inscricoes = d.inscricoes.filter((x) => x !== c.event_id);
      return { ok: true };
    },
    "/api/eventos": (c) => {
      d.eventos.push({
        id: novoId(),
        created_at: agora(),
        updated_at: agora(),
        titulo: texto(c, "titulo"),
        descricao: texto(c, "descricao"),
        inicio: texto(c, "inicio"),
        tipo: "evento",
        community_id: null,
      });
      return { ok: true };
    },
    "/api/saberes/confirmar": (c) => {
      const s = d.saberes.find((x) => x.id === c.saber_id);
      if (!s) throw new ErroDemonstracao("Saber não encontrado.");
      s.confirmado = true;
      return s;
    },
  };

  return async function responder(url: string, corpo?: unknown) {
    const caminho = new URL(url, "http://demonstracao").pathname;
    const rota = rotas[caminho];
    if (!rota)
      throw new ErroDemonstracao(
        "Esta ação não está disponível na demonstração.",
      );
    // Uma pequena espera deixa visível o estado de carregamento, como no app real.
    await espera(caminho === "/api/faiscas/buscar" ? 1100 : 150);
    const c = corpo && typeof corpo === "object" ? (corpo as Corpo) : {};
    d.agora = agora();
    const resposta = rota(c);
    if (caminho !== "/api/piloto") aoMudar();
    return structuredClone(resposta);
  };
}
