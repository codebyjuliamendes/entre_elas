import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientePkce } from "@/lib/auth/pkce";
import { provedorInput, provedoresAtivos } from "@/lib/auth/sso";
import { origemApp, pilotoAtivo } from "@/lib/piloto/config";
import { COOKIE_RETORNO, normalizarRetorno } from "@/lib/piloto/retorno";
// Começa o login corporativo; o /auth/callback confere o domínio e cria a conta do piloto.
export async function GET(request: Request) {
  const origem = origemApp();
  const falha = NextResponse.redirect(new URL("/entrar?erro=link", origem), {
    headers: { "Cache-Control": "no-store" },
  });
  const url = new URL(request.url);
  const provedor = provedorInput.safeParse(url.searchParams.get("provedor"));
  if (!pilotoAtivo() || !provedor.success || !provedoresAtivos().includes(provedor.data))
    return falha;
  const jar = await cookies();
  jar.set(COOKIE_RETORNO, normalizarRetorno(url.searchParams.get("retorno")), {
    httpOnly: true,
    secure: new URL(origem).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const { data, error } = await (await clientePkce()).auth.signInWithOAuth({
    provider: provedor.data,
    options: {
      redirectTo: new URL("/auth/callback", origem).href,
      skipBrowserRedirect: true,
      // A Microsoft só devolve o e-mail com este escopo.
      scopes: provedor.data === "azure" ? "email" : undefined,
    },
  });
  if (error || !data.url) return falha;
  return NextResponse.redirect(data.url, { headers: { "Cache-Control": "no-store" } });
}
