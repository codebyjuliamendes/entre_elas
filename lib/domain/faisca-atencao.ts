import { z } from "zod";
import { faisca, id } from "@/lib/schemas/entities";
import { orientarFaisca } from "./faisca-orientacao";

const item = z.object({
  faisca_id: id,
  pessoa_id: id,
  tipo: z.enum(["convite", "publicacao", "revisao", "sintese", "conversa"]),
  titulo: z.string(),
  descricao: z.string(),
  horario: z.iso.datetime({ offset: true }).nullable(),
});

/** Prioriza decisões reais da participante; não impõe ordem de navegação. */
export function listarAtencaoFaiscas(entrada: unknown) {
  const {
    encontros,
    usuaria_id: u,
    publicadas,
  } = z
    .object({
      encontros: z.array(faisca),
      usuaria_id: id,
      publicadas: z.array(id),
    })
    .parse(entrada);
  const prioridades = {
    convite: 0,
    publicacao: 1,
    revisao: 2,
    sintese: 3,
    conversa: 4,
  };
  const resultado: z.infer<typeof item>[] = [];
  for (const f of encontros) {
    if (f.solicitante_id !== u && f.convidada_id !== u) continue;
    const outra = f.solicitante_id === u ? f.convidada_id : f.solicitante_id;
    let tipo: z.infer<typeof item>["tipo"] | null = null;
    if (f.status === "pendente" && f.convidada_id === u) tipo = "convite";
    if (f.status === "aceita") {
      if (f.anotacoes[u] && f.anotacoes[outra]) tipo = "sintese";
      else if (!f.anotacoes[u]) tipo = "conversa";
    }
    if (f.status === "realizada" && !publicadas.includes(f.id)) {
      if (!f.publicacao_autorizada_por.includes(u)) tipo = "revisao";
      else if (f.publicacao_autorizada_por.includes(outra)) tipo = "publicacao";
    }
    if (!tipo) continue;
    resultado.push({
      faisca_id: f.id,
      pessoa_id: outra,
      tipo,
      ...orientarFaisca({ encontro: f, usuaria_id: u, publicada: false }),
      horario: f.horario,
    });
  }
  resultado.sort(
    (a, b) =>
      prioridades[a.tipo] - prioridades[b.tipo] ||
      (a.horario ?? "9999").localeCompare(b.horario ?? "9999") ||
      a.faisca_id.localeCompare(b.faisca_id),
  );
  return z.array(item).parse(resultado);
}
