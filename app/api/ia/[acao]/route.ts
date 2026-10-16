import { pilotoAtivo } from "@/lib/piloto/config";
import { resposta, corpo, type RotaAcao } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { sugerirMensagensFaisca, sugerirAssuntoGrupo } from "@/lib/domain/chat";
import {
  interpretarPedido,
  buscarCandidatas,
  sugerirConexoes,
} from "@/lib/ai/curadora";
import { id } from "@/lib/schemas/entities";
import { ErroDominio } from "@/lib/domain/erros";
export async function POST(request: Request, ctx: RotaAcao) {
  return resposta(async () => {
    const u = await getCurrentUser();
    const input = await corpo(request);
    const { acao } = await ctx.params;
    if (pilotoAtivo() && ["mensagens", "assuntos"].includes(acao))
      throw new ErroDominio(
        "Sugestões sobre mensagens não estão habilitadas no piloto.",
        403,
      );
    switch (acao) {
      case "mensagens":
        return sugerirMensagensFaisca(id.parse(input.faisca_id), u.id);
      case "assuntos":
        return sugerirAssuntoGrupo(id.parse(input.grupo_id), u.id);
      case "conexoes": {
        const interpretado = await interpretarPedido(u.objetivos.join("; "));
        const candidatas = await buscarCandidatas({
          ...interpretado,
          solicitante_id: u.id,
        });
        return sugerirConexoes({ perfil: u, candidatas });
      }
      default:
        throw new ErroDominio("Operação não encontrada.", 404);
    }
  });
}
