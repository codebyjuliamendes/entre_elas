import { z } from "zod";
import { ANA_ID, perfisDemo, perfilDemoSchema } from "./catalogo";
import { normalizar } from "./texto";
export const contextoCuradoriaSchema = z
  .object({
    objetivos: z.array(z.string().trim().min(3).max(160)).max(5).default([]),
    saberes: z.array(z.string().min(1).max(80)).max(15).default([]),
  })
  .default({ objetivos: [], saberes: [] });
export const leituraCuradoriaSchema = z.object({
  foco: z.string().max(160),
  criterios: z.array(z.string().max(300)).max(4),
  limite: z.string().max(300),
});
const temas = [
  {
    nome: "Dados e indicadores",
    termos: /\bexcel|\bplanilha|\bdados?\b|\bindicador|\banalise/,
    slug: "daniela",
    pergunta:
      "Qual decisão você quer apoiar com os dados e como verificaria a qualidade dos indicadores?",
  },
  {
    nome: "Apresentação de projetos",
    termos: /diretoria|apresenta|projeto|orcamento/,
    slug: "carla",
    pergunta:
      "Qual decisão a apresentação precisa viabilizar e quais evidências ajudariam a sustentá-la?",
  },
  {
    nome: "Liderança e carreira",
    termos: /lideran|liderar|mentoria|equipe|carreira/,
    slug: "gabriela",
    pergunta:
      "Qual situação da sua equipe ou carreira você quer discutir e que abordagem já tentou?",
  },
  {
    nome: "Sustentabilidade",
    termos: /solar|sustent|ambient|esg/,
    slug: "fernanda",
    pergunta:
      "Que impacto ambiental você quer compreender e quais dados ajudariam a avaliar uma iniciativa?",
  },
  {
    nome: "Segurança em campo",
    termos: /seguran|risco|prevenc/,
    slug: "beatriz",
    pergunta:
      "Que situação de segurança você quer compreender, respeitando os procedimentos oficiais da organização?",
  },
  {
    nome: "Automação",
    termos: /automacao|subestac|sistema.*eletric/,
    slug: "helena",
    pergunta:
      "Qual processo você quer compreender melhor e como a automação poderia ajudar nesse cenário?",
  },
  {
    nome: "Comunicação",
    termos: /comunic|facilita|fala|conversa/,
    slug: "mariana",
    pergunta:
      "Com quem você quer se comunicar melhor e qual entendimento deseja construir?",
  },
];
const entradaSchema = z.object({
  pedido: z.string().trim().min(5).max(1500),
  excluir: z.uuid().optional(),
  contexto: contextoCuradoriaSchema,
});
export function analisarConexao(entrada: unknown) {
  const input = entradaSchema.parse(entrada);
  const texto = normalizar(input.pedido);
  const interesses = normalizar(input.contexto.objetivos.join(" "));
  const assuntos = temas.filter((t) => t.termos.test(texto));
  const temasObjetivos = temas.filter((t) => t.termos.test(interesses));
  const candidatas = perfisDemo
    .filter((p) => p.id !== ANA_ID && p.id !== input.excluir)
    .map((p) => ({
      perfil: p,
      pontos:
        assuntos
          .filter((t) => t.slug === p.slug)
          .reduce(
            (total, t) =>
              total +
              (texto.match(new RegExp(t.termos.source, "g"))?.length ?? 0),
            0,
          ) *
          100 +
        temasObjetivos.filter((t) => t.slug === p.slug).length * 5 +
        (p.area !== perfisDemo[0].area ? 1 : 0) +
        (p.regional !== perfisDemo[0].regional ? 1 : 0) +
        (p.slug === "carla" ? 0.5 : 0),
    }))
    .sort((a, b) => b.pontos - a.pontos);
  return z
    .object({
      foco: z.string(),
      pergunta: z.string(),
      candidatas: z.array(perfilDemoSchema),
    })
    .parse({
      foco:
        assuntos
          .map((t) => t.nome)
          .join(" e ")
          .slice(0, 160) || "Explorar um desafio profissional",
      pergunta:
        assuntos[0]?.pergunta ??
        `O que você gostaria de conseguir com essa troca sobre ${input.pedido.slice(0, 100)}?`,
      candidatas: candidatas.map((c) => c.perfil),
    });
}
export function explicarConexao(entrada: unknown) {
  const input = entradaSchema.extend({ perfil_id: z.uuid() }).parse(entrada);
  const leitura = analisarConexao(input);
  const perfil = leitura.candidatas.find((p) => p.id === input.perfil_id);
  if (!perfil) throw new Error("Candidata indisponível para essa conexão.");
  const tema = temas.find(
    (t) => t.slug === perfil.slug && t.termos.test(normalizar(input.pedido)),
  );
  return leituraCuradoriaSchema.parse({
    foco: leitura.foco,
    criterios: [
      tema
        ? `Seu pedido se aproxima de ${tema.nome.toLowerCase()}, experiência presente no catálogo de ${perfil.nome.split(" ")[0]}.`
        : "Esta é uma possibilidade de troca; não encontramos uma especialidade diretamente ligada ao pedido no catálogo local.",
      ...(input.contexto.objetivos.length
        ? [
            "Seus objetivos de desenvolvimento ajudam a contextualizar a escolha; o pedido atual tem prioridade.",
          ]
        : []),
      `Experiência declarada: ${perfil.saberes.slice(0, 2).join("; ")}.`,
      "A evidência exibida vem do perfil fictício selecionado e é preservada literalmente.",
    ],
    limite: tema
      ? "Uma sugestão de conversa, sem garantia de domínio do tema. Você decide se a conexão faz sentido."
      : "Catálogo limitado: refine o pedido ou busque outra conexão. Não há uma especialista confirmada para todo assunto.",
  });
}
