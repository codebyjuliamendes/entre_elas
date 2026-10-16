import { z } from "zod";
import { id, texto, resumoFundamentado, resumo } from "@/lib/schemas/entities";
import { ErroIA } from "./erros";
/** Trechos literais dão rastreabilidade, sem prometer veracidade da interpretação. */
export function validarResumoFundamentado(entrada: unknown) {
  const input = z
    .object({ anotacoes: z.record(id, texto), resumo: resumoFundamentado })
    .parse(entrada);
  const autoras = Object.keys(input.anotacoes);
  const r = input.resumo;
  if (autoras.length !== 2)
    throw new ErroIA("São necessárias anotações das duas participantes.");
  for (const ev of r.evidencias) {
    if (
      !autoras.includes(ev.autora_id) ||
      !input.anotacoes[ev.autora_id].includes(ev.trecho) ||
      ev.aprendizado >= r.aprendizados.length
    )
      throw new ErroIA(
        "A síntese contém uma evidência que não corresponde às anotações. Revise os registros e tente novamente.",
        422,
      );
  }
  if (
    autoras.some(
      (autora) => !r.evidencias.some((ev) => ev.autora_id === autora),
    ) ||
    r.aprendizados.some(
      (_, i) => !r.evidencias.some((ev) => ev.aprendizado === i),
    )
  )
    throw new ErroIA(
      "A síntese precisa fundamentar cada aprendizado e considerar as duas participantes.",
      422,
    );
  return resumo.parse(r);
}
