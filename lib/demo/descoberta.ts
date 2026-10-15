import { z } from "zod";
import { perfisDemo, ANA_ID, perfilDemoSchema } from "./catalogo";
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
const stop = new Set([
  "para",
  "como",
  "quero",
  "aprender",
  "minha",
  "meu",
  "uma",
  "com",
  "sobre",
  "preciso",
  "ajuda",
  "mais",
  "que",
  "por",
  "ter",
  "primeiro",
]);
export function filtrarPessoas(entrada: unknown) {
  const input = z
    .object({
      busca: z.string().max(1500).default(""),
      area: z.string().default("todas"),
      regional: z.string().default("todas"),
    })
    .parse(entrada);
  const termos = normalizar(input.busca)
    .split(/\W+/)
    .filter((t) => t.length > 2 && !stop.has(t));
  return z
    .array(perfilDemoSchema)
    .parse(
      perfisDemo.filter(
        (p) =>
          p.id !== ANA_ID &&
          (input.area === "todas" || p.area === input.area) &&
          (input.regional === "todas" || p.regional === input.regional) &&
          termos.every((t) =>
            normalizar(
              [
                p.nome,
                p.cargo,
                p.area,
                p.regional,
                ...p.saberes,
                ...p.tags,
              ].join(" "),
            ).includes(t),
          ),
      ),
    );
}
export function recomendarPessoa(pedido: string, excluir?: string) {
  const tema = normalizar(z.string().min(5).max(1500).parse(pedido));
  const candidatas = perfisDemo.filter(
    (p) => p.id !== ANA_ID && p.id !== excluir,
  );
  const regras: [RegExp, string][] = [
    [/excel|planilha|dado|indicador|analise/, "daniela"],
    [
      /diretoria|apresenta.*projeto|projeto.*apresenta|orcamento|gerencia.*projeto/,
      "carla",
    ],
    [/lideran|liderar|mentoria|equipe|carreira/, "gabriela"],
    [/solar|sustent|ambient|esg/, "fernanda"],
    [/seguran|risco|prevenc/, "beatriz"],
    [/automacao|subestac|sistema.*eletric/, "helena"],
    [/comunic|facilita|fala|conversa/, "mariana"],
  ];
  const favoritas = regras
    .filter(([regex]) => regex.test(tema))
    .map(([, slug]) => slug);
  // A alternativa permanece estável quando não há uma segunda especialista no tema.
  const preferida =
    candidatas.find((p) => favoritas.includes(p.slug)) ??
    candidatas.find((p) => p.slug === "carla") ??
    candidatas[0];
  return perfilDemoSchema.parse(preferida);
}
