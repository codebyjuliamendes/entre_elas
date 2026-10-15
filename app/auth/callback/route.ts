import { variavel } from "@/lib/config";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { exigirEmail, origemApp } from "@/lib/piloto/config";
import { getDb, verificarErro } from "@/lib/db/client";
import { salvarSessao } from "@/lib/auth/piloto";
export async function GET(request: Request) {
  const origem = origemApp();
  try {
    const code = new URL(request.url).searchParams.get("code");
    if (!code || code.length > 2048) throw new Error();
    const jar = await cookies();
    const client = createClient(
      variavel("NEXT_PUBLIC_SUPABASE_URL"),
      variavel("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        auth: {
          flowType: "pkce",
          storageKey: "entre-elas-pkce",
          persistSession: true,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: {
            getItem: (key) => jar.get(key)?.value ?? null,
            setItem: () => {},
            removeItem: (key) => {
              jar.delete(key);
            },
          },
        },
      },
    );
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (
      error ||
      !data.user?.email ||
      !data.session ||
      !data.user.email_confirmed_at
    )
      throw new Error();
    exigirEmail(data.user.email);
    const { error: pe } = await getDb().rpc("piloto_provisionar", {
      auth_id: data.user.id,
    });
    verificarErro(pe);
    await salvarSessao(data.session);
    return NextResponse.redirect(new URL("/piloto", origem), {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/entrar?erro=link", origem), {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
