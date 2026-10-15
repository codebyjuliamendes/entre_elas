import { pilotoAtivo } from "@/lib/piloto/config";
import { identidadePiloto } from "@/lib/auth/piloto";
import { indicadoresPiloto } from "@/lib/piloto/indicadores";
import { resposta } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { obterIndicadores } from "@/lib/domain/indicadores";
export async function GET() {
  return resposta(async () => {
    const u = await getCurrentUser();
    return pilotoAtivo()
      ? indicadoresPiloto((await identidadePiloto()).email)
      : obterIndicadores(u.id);
  });
}
