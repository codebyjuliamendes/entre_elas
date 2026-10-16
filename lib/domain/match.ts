import { z } from "zod";
import * as s from "@/lib/schemas/entities";
import {
  interpretarPedido,
  buscarCandidatas,
  ranquear,
} from "@/lib/ai/curadora";
import { ErroIA } from "./erros";
export async function buscarMatch(entrada: unknown, usuaria: string) {
  const pedido = s.texto.parse(entrada);
  const u = s.id.parse(usuaria);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return s.indicacoes.parse(
      await Promise.race([
        (async () => {
          const opcoes = { signal: controller.signal };
          const interpretado = await interpretarPedido(pedido, opcoes);
          if (controller.signal.aborted)
            throw new ErroIA("Busca interrompida.", 408);
          const candidatas = await buscarCandidatas(
            { ...interpretado, solicitante_id: u },
            opcoes,
          );
          if (controller.signal.aborted)
            throw new ErroIA("Busca interrompida.", 408);
          return ranquear({ pedido, candidatas, solicitante_id: u }, opcoes);
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(
              new ErroIA(
                "A curadoria demorou mais que o esperado. Tente novamente ou escolha uma pessoa da rede.",
                408,
              ),
            );
          }, 45000);
        }),
      ]),
    );
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
export const buscarInput = z.object({ pedido: s.texto });
