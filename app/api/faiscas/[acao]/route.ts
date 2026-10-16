import { pilotoAtivo } from "@/lib/piloto/config";
import { resposta, corpo, type RotaAcao } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import * as f from "@/lib/domain/faisca";
import { buscarMatch, buscarInput } from "@/lib/domain/match";
import { id } from "@/lib/schemas/entities";
import { ErroDominio } from "@/lib/domain/erros";
export async function POST(request: Request, ctx: RotaAcao) {
  return resposta(async () => {
    const { acao } = await ctx.params;
    const u = await getCurrentUser();
    const input = await corpo(request);
    if (acao === "buscar")
      return buscarMatch(buscarInput.parse(input).pedido, u.id);
    const fid = id.parse(input.faisca_id);
    switch (acao) {
      case "obter":
        return f.obterFaisca(fid, u.id);
      case "aceitar":
        return f.aceitarFaisca(input, u.id);
      case "recusar":
        return f.recusarFaisca(fid, u.id);
      case "cancelar":
        return f.cancelarFaisca(fid, u.id);
      case "anotar":
        return f.registrarAnotacoes(input, u.id);
      case "concluir-manual":
        return f.concluirManualmente(input, u.id);
      case "concluir":
        return f.concluirFaisca(fid, u.id);
      case "revisar":
        return f.revisarResumoPiloto(input, u.id);
      case "autorizar":
        return pilotoAtivo()
          ? f.autorizarPiloto(input, u.id)
          : f.autorizarPublicacao(fid, u.id);
      case "publicar":
        return f.publicarComoDica(fid, u.id);
      case "reprocessar":
        return f.reprocessarIntegracoes(fid, u.id);
      case "fechar-video":
        return f.encerrarVideoPiloto(fid, u.id);
      case "video":
        return f.obterTokenVideo(fid, u.id);
      default:
        throw new ErroDominio("Operação não encontrada.", 404);
    }
  });
}
