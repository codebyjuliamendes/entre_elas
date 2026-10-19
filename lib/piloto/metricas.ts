import { z } from "zod";
// Funções puras do painel de liderança: sem banco, para serem testadas e usadas no navegador.
const contagem = z.number().int().min(0);
const percentual = z.number().min(0).max(100).nullable();
export const avaliacaoFaiscaInput = z.object({
  faisca_id: z.uuid(),
  utilidade: z.number().int().min(1).max(5),
  voltaria: z.boolean(),
});
export const indicadoresPilotoSchema = z.object({
  inicio: z.string().nullable(),
  participantes: contagem,
  perfis_completos: contagem,
  convites: contagem,
  aceitas: contagem,
  recusadas: contagem,
  realizadas: contagem,
  taxa_aceite: percentual,
  pessoas_conectadas: contagem,
  pares_distintos: contagem,
  entre_regionais: percentual,
  entre_areas: percentual,
  // Faíscas com horário marcado dentro do expediente de referência.
  no_expediente: percentual,
  saberes_reconhecidos: contagem,
  dicas_publicadas: contagem,
  inscricoes: contagem,
  mensagens: contagem,
  mapa: z.object({
    oferta: z.array(z.object({ saber: z.string(), pessoas: contagem })),
    concentrados: z.array(z.string()),
    objetivos: contagem,
    objetivos_sem_par: contagem,
    temas_sem_par: z.array(z.object({ tema: z.string(), pessoas: contagem })),
  }),
  // null quando a migração de avaliações ainda não foi aplicada.
  avaliacoes: z
    .object({
      respostas: contagem,
      utilidade_media: z.number().min(1).max(5).nullable(),
      voltariam: percentual,
    })
    .nullable(),
});
export type IndicadoresPiloto = z.infer<typeof indicadoresPilotoSchema>;
export type FaiscaMetrica = {
  id: string;
  solicitante_id: string;
  convidada_id: string;
  status: string;
  horario?: string | null;
};
export type PerfilMetrica = {
  id: string;
  area: string;
  regional: string;
  interesses?: string[];
  objetivos?: string[];
};
const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
const PALAVRAS_VAZIAS = new Set(
  "como para mais com sem sobre entre minha meus minhas meu sua seus suas uma umas uns quero preciso aprender melhor melhorar fazer saber ter ser estar mais muito pouco cada qual quando onde porque pelo pela pelos pelas desde ainda tambem outra outro outras outros".split(
    " ",
  ),
);
// Radical simples (6 letras) aproxima "apresentar" e "apresentações" sem depender de IA;
// guarda a primeira palavra completa de cada radical para exibição.
const radicais = (texto: string) => {
  const mapa = new Map<string, string>();
  for (const original of texto.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    const p = normalizar(original);
    if (p.length >= 4 && !PALAVRAS_VAZIAS.has(p) && !mapa.has(p.slice(0, 6)))
      mapa.set(p.slice(0, 6), original);
  }
  return mapa;
};
// Estimativa por palavras-chave: agregada e sem expor objetivos individuais.
export function mapaDeSaberes(perfis: PerfilMetrica[]) {
  const ofertantes = new Map<string, { saber: string; ids: Set<string> }>();
  for (const p of perfis)
    for (const saber of p.interesses ?? []) {
      const chave = normalizar(saber);
      const item = ofertantes.get(chave) ?? { saber: saber.trim(), ids: new Set() };
      item.ids.add(p.id);
      ofertantes.set(chave, item);
    }
  const oferta = [...ofertantes.values()]
    .map((o) => ({ saber: o.saber, pessoas: o.ids.size }))
    .sort((a, b) => b.pessoas - a.pessoas || a.saber.localeCompare(b.saber));
  let objetivos = 0,
    semPar = 0;
  const temas = new Map<string, { tema: string; ids: Set<string> }>();
  for (const p of perfis)
    for (const objetivo of p.objetivos ?? []) {
      objetivos++;
      const alvo = radicais(objetivo);
      const atendido = perfis.some(
        (outra) =>
          outra.id !== p.id &&
          (outra.interesses ?? []).some((i) =>
            [...radicais(i).keys()].some((r) => alvo.has(r)),
          ),
      );
      if (atendido) continue;
      semPar++;
      for (const [r, palavra] of alvo) {
        const t = temas.get(r) ?? { tema: palavra, ids: new Set<string>() };
        t.ids.add(p.id);
        temas.set(r, t);
      }
    }
  return {
    oferta: oferta.slice(0, 8),
    concentrados: oferta
      .filter((o) => o.pessoas === 1)
      .map((o) => o.saber)
      .slice(0, 8),
    objetivos,
    objetivos_sem_par: semPar,
    // Só temas citados por pelo menos duas pessoas, para não identificar ninguém.
    temas_sem_par: [...temas.values()]
      .filter((t) => t.ids.size >= 2)
      .map((t) => ({ tema: t.tema, pessoas: t.ids.size }))
      .sort((a, b) => b.pessoas - a.pessoas)
      .slice(0, 6),
  };
}
// Expediente de referência: segunda a sexta, das 8h às 18h no horário de Brasília.
// A Faísca foi pensada para caber no trabalho, inclusive de quem cuida de alguém em casa.
export function noExpediente(iso: string) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const dia = partes.find((p) => p.type === "weekday")?.value;
  const hora = Number(partes.find((p) => p.type === "hour")?.value);
  return dia !== "Sat" && dia !== "Sun" && hora >= 8 && hora < 18;
}
const pct = (parte: number, total: number) =>
  total ? Math.round((1000 * parte) / total) / 10 : null;
export function consolidarIndicadores(entrada: {
  inicio: string | null;
  contas: { profile_id: string; onboarding: boolean }[];
  perfis: PerfilMetrica[];
  faiscas: FaiscaMetrica[];
  saberes_fonte_ids: (string | null)[];
  dicas_origem_ids: (string | null)[];
  inscricoes: number;
  mensagens: number;
  avaliacoes: { utilidade: number; voltaria: boolean }[] | null;
}): IndicadoresPiloto {
  const perfis = new Map(entrada.perfis.map((p) => [p.id, p]));
  const contar = (status: string[]) =>
    entrada.faiscas.filter((f) => status.includes(f.status));
  const conexoes = contar(["aceita", "realizada"]);
  const realizadas = contar(["realizada"]);
  const recusadas = contar(["recusada"]).length;
  const diferentes = (campo: "area" | "regional") =>
    conexoes.filter((f) => {
      const a = perfis.get(f.solicitante_id)?.[campo];
      const b = perfis.get(f.convidada_id)?.[campo];
      return !!a && !!b && normalizar(a) !== normalizar(b);
    }).length;
  const marcadas = conexoes.filter((f) => f.horario);
  const encontros = new Set(realizadas.map((f) => f.id));
  const doEncontro = (ids: (string | null)[]) =>
    ids.filter((i) => i && encontros.has(i)).length;
  const av = entrada.avaliacoes;
  return indicadoresPilotoSchema.parse({
    inicio: entrada.inicio,
    participantes: entrada.contas.length,
    perfis_completos: entrada.contas.filter((c) => c.onboarding).length,
    convites: entrada.faiscas.length,
    aceitas: conexoes.length,
    recusadas,
    realizadas: realizadas.length,
    taxa_aceite: pct(conexoes.length, conexoes.length + recusadas),
    pessoas_conectadas: new Set(
      conexoes.flatMap((f) => [f.solicitante_id, f.convidada_id]),
    ).size,
    pares_distintos: new Set(
      conexoes.map((f) => [f.solicitante_id, f.convidada_id].sort().join()),
    ).size,
    entre_regionais: pct(diferentes("regional"), conexoes.length),
    entre_areas: pct(diferentes("area"), conexoes.length),
    no_expediente: pct(
      marcadas.filter((f) => noExpediente(f.horario!)).length,
      marcadas.length,
    ),
    saberes_reconhecidos: doEncontro(entrada.saberes_fonte_ids),
    dicas_publicadas: doEncontro(entrada.dicas_origem_ids),
    inscricoes: entrada.inscricoes,
    mensagens: entrada.mensagens,
    mapa: mapaDeSaberes(
      entrada.perfis.filter((p) =>
        entrada.contas.some((c) => c.onboarding && c.profile_id === p.id),
      ),
    ),
    avaliacoes: av && {
      respostas: av.length,
      utilidade_media: av.length
        ? Math.round((10 * av.reduce((s, a) => s + a.utilidade, 0)) / av.length) /
          10
        : null,
      voltariam: pct(av.filter((a) => a.voltaria).length, av.length),
    },
  });
}
const fmt = (v: number | null, sufixo = "%") =>
  v === null ? "—" : `${String(v).replace(".", ",")}${sufixo}`;
// Texto pronto para slide ou mensagem, sempre com os números reais do painel.
export function resumoParaApresentacao(i: IndicadoresPiloto) {
  const linhas = [
    `Piloto Entre Elas — dados reais${i.inicio ? ` desde ${new Date(i.inicio).toLocaleDateString("pt-BR", { timeZone: "UTC" })}` : ""}`,
    `${i.participantes} participantes (${i.perfis_completos} com perfil completo)`,
    `${i.convites} convites de Faísca · ${i.aceitas} aceitos (taxa de aceite ${fmt(i.taxa_aceite)}) · ${i.realizadas} realizadas`,
    `${i.pessoas_conectadas} pessoas conectadas em ${i.pares_distintos} pares diferentes`,
    `${fmt(i.entre_regionais)} das conexões entre regionais diferentes · ${fmt(i.entre_areas)} entre áreas diferentes`,
    `${fmt(i.no_expediente)} das Faíscas marcadas no horário de trabalho`,
    `${i.dicas_publicadas} dicas publicadas com autorização das duas · ${i.saberes_reconhecidos} saberes reconhecidos`,
  ];
  if (i.mapa.objetivos)
    linhas.push(
      `${i.mapa.objetivos_sem_par} de ${i.mapa.objetivos} objetivos de aprendizagem ainda sem ninguém que ofereça o tema na rede`,
    );
  if (i.avaliacoes?.respostas)
    linhas.push(
      `Utilidade média ${fmt(i.avaliacoes.utilidade_media, "/5")} · ${fmt(i.avaliacoes.voltariam)} fariam outra Faísca (${i.avaliacoes.respostas} avaliações)`,
    );
  return linhas.join("\n");
}
