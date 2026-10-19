import {
  listarRelatos,
  relatarProblema,
  resolverRelato,
} from "@/lib/piloto/relatos";
import { lider } from "@/lib/piloto/config";
import { resposta, corpo, type RotaAcao } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { identidadePiloto } from "@/lib/auth/piloto";
import * as a from "@/lib/piloto/acoes";
import { indicadoresPiloto } from "@/lib/piloto/indicadores";
import { ErroDominio } from "@/lib/domain/erros";
export async function POST(request: Request, ctx: RotaAcao) {
  return resposta(async () => {
    const { acao } = await ctx.params;
    const u = await getCurrentUser();
    await identidadePiloto();
    const input = await corpo(request, acao === "foto" ? 250000 : 100000);
    switch (acao) {
      case "relatos":
        return listarRelatos(u.id, lider((await identidadePiloto()).email));
      case "relatar":
        return relatarProblema(u.id, input);
      case "resolver-relato":
        return resolverRelato(input, lider((await identidadePiloto()).email));
      case "perfil":
        return a.salvarPerfilPiloto(input, u.id);
      case "perfil-ia":
        return a.sugerirPerfil(input.texto);
      case "indexar":
        return a.indexarPerfil(u.id);
      case "consentimento":
        return a.consentirIA(u.id, input.autorizado);
      case "onboarding":
        return a.finalizarOnboarding(u.id);
      case "foto":
        return a.salvarFoto(u.id, input.foto);
      case "favorito":
        return a.favorito(u.id, input.post_id, input.ativo);
      case "mensagens":
        return a.mensagensPiloto(u.id, input.faisca_id);
      case "enviar":
        return a.mensagensPiloto(u.id, input.faisca_id, input.texto);
      case "reconhecer":
        return a.reconhecerSaberes(u.id, input.faisca_id);
      case "avaliar":
        return a.avaliarFaisca(u.id, input);
      case "indicadores":
        return indicadoresPiloto((await identidadePiloto()).email);
      default:
        throw new ErroDominio("Operação não encontrada.", 404);
    }
  });
}
