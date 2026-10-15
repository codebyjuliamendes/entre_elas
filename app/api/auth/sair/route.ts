import { cookies } from "next/headers";
import { resposta, corpo } from "@/lib/api";
import { ACCESS, REFRESH, clienteAuth } from "@/lib/auth/piloto";
export async function POST(request: Request) {
  return resposta(async () => {
    await corpo(request);
    const jar = await cookies();
    const access = jar.get(ACCESS)?.value,
      refresh = jar.get(REFRESH)?.value;
    try {
      if (access && refresh) {
        const c = clienteAuth();
        await c.auth.setSession({
          access_token: access,
          refresh_token: refresh,
        });
        await c.auth.signOut({ scope: "local" });
      }
    } finally {
      jar.delete(ACCESS);
      jar.delete(REFRESH);
    }
    return { ok: true };
  });
}
