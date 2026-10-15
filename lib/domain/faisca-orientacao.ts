import { z } from "zod";
import { faisca, id } from "@/lib/schemas/entities";
import { exigirParticipante } from "./regras";
const orientacao = z.object({ titulo: z.string(), descricao: z.string() });
export function orientarFaisca(entrada: unknown) {
  const {
    encontro: f,
    usuaria_id: u,
    publicada,
  } = z
    .object({ encontro: faisca, usuaria_id: id, publicada: z.boolean() })
    .parse(entrada);
  exigirParticipante(f, u);
  let titulo: string, descricao: string;
  if (f.status === "pendente") {
    titulo =
      u === f.convidada_id
        ? "Você recebeu um convite"
        : "Aguardando a outra pessoa";
    descricao =
      u === f.convidada_id
        ? "Confira o pedido e os horários. Aceite uma opção ou recuse, se não fizer sentido agora."
        : "O convite já está salvo. A outra pessoa precisa responder na própria conta; você não precisa enviá-lo novamente.";
  } else if (f.status === "aceita") {
    const minha = Boolean(f.anotacoes[u]);
    const outra = Boolean(
      f.anotacoes[u === f.solicitante_id ? f.convidada_id : f.solicitante_id],
    );
    titulo =
      minha && outra
        ? "Vocês já podem preparar a síntese"
        : minha
          ? "Suas anotações estão salvas"
          : "Conversem e registrem seus aprendizados";
    descricao =
      minha && outra
        ? "Revisem o que aprenderam e preparem uma síntese manual ou com IA. Isso ainda não publica a dica."
        : minha
          ? "A outra pessoa ainda precisa registrar as próprias anotações. Você pode continuar a conversa pelo chat."
          : "Usem o chat ou a chamada e salvem, cada pessoa na própria conta, as anotações que desejam compartilhar.";
  } else if (f.status === "realizada") {
    const minha = f.publicacao_autorizada_por.includes(u);
    const outra = f.publicacao_autorizada_por.includes(
      u === f.solicitante_id ? f.convidada_id : f.solicitante_id,
    );
    titulo = publicada
      ? "Conhecimento compartilhado"
      : !minha
        ? "Revise a dica e decida se quer compartilhar"
        : !outra
          ? "Aguardando a outra autorização"
          : "A dica está pronta para publicar";
    descricao = publicada
      ? "A dica desta Faísca já está na biblioteca da rede."
      : !minha
        ? "Você pode revisar a síntese ou autorizar esta versão. Revisar retira as autorizações anteriores."
        : !outra
          ? "Sua autorização está salva. A outra pessoa precisa decidir na própria conta."
          : "As duas pessoas autorizaram esta versão. Qualquer participante pode publicar uma única dica desta troca.";
  } else {
    titulo =
      f.status === "cancelada"
        ? "Este convite foi cancelado"
        : "Este convite foi recusado";
    descricao =
      "Volte à sua lista para combinar outra Faísca, com outro horário ou outra pessoa.";
  }
  return orientacao.parse({ titulo, descricao });
}
