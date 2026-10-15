import { resposta } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { identidadePiloto } from "@/lib/auth/piloto";
import { dadosPiloto } from "@/lib/piloto/dados";
export async function GET() {
  return resposta(async () => {
    const u = await getCurrentUser();
    const identidade = await identidadePiloto();
    return dadosPiloto(u.id, identidade.email);
  });
}
