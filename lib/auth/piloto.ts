import { variavel } from "@/lib/config";
import { cookies } from "next/headers";
import { createClient, type Session } from "@supabase/supabase-js";
import { getDb, verificarErro } from "@/lib/db/client";
import { profile } from "@/lib/schemas/entities";
import { ErroDominio } from "@/lib/domain/erros";
import { exigirEmail, origemApp } from "@/lib/piloto/config";
export const ACCESS = "entre_elas_access",
  REFRESH = "entre_elas_refresh";
export function clienteAuth() {
  return createClient(
    variavel("NEXT_PUBLIC_SUPABASE_URL"),
    variavel("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        flowType: "pkce",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
      },
    },
  );
}
export async function salvarSessao(session: Session) {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: new URL(origemApp()).protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
  };
  jar.set(ACCESS, session.access_token, {
    ...options,
    maxAge: session.expires_in ?? 3600,
  });
  jar.set(REFRESH, session.refresh_token, { ...options, maxAge: 7 * 86400 });
}
export async function identidadePiloto() {
  const token = (await cookies()).get(ACCESS)?.value;
  if (!token)
    throw new ErroDominio("Entre com seu e-mail para continuar.", 401);
  const { data, error } = await clienteAuth().auth.getUser(token);
  if (error || !data.user?.email || !data.user.email_confirmed_at)
    throw new ErroDominio("Sessão expirada. Entre novamente.", 401);
  const email = exigirEmail(data.user.email);
  const { data: conta, error: ce } = await getDb()
    .from("piloto_contas")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  verificarErro(ce);
  if (!conta)
    throw new ErroDominio("Conclua o acesso pelo seu link de entrada.", 401);
  const { data: p, error: pe } = await getDb()
    .from("profiles")
    .select("*")
    .eq("id", conta.profile_id)
    .single();
  verificarErro(pe);
  return { perfil: profile.parse(p), conta, email };
}
