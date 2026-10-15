import { cookies } from "next/headers";
import { resposta, corpo } from "@/lib/api";
import { clienteAuth, salvarSessao, REFRESH } from "@/lib/auth/piloto";
import { exigirEmail } from "@/lib/piloto/config";
import { ErroDominio } from "@/lib/domain/erros";
export async function POST(request: Request) {
  return resposta(async () => {
    await corpo(request);
    const refresh = (await cookies()).get(REFRESH)?.value;
    if (!refresh) throw new ErroDominio("Entre novamente.", 401);
    const { data, error } = await clienteAuth().auth.refreshSession({
      refresh_token: refresh,
    });
    if (error || !data.session || !data.user?.email)
      throw new ErroDominio("Entre novamente.", 401);
    exigirEmail(data.user.email);
    await salvarSessao(data.session);
    return { ok: true };
  });
}
