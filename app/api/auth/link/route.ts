import { variavel } from "@/lib/config";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { resposta, corpo } from "@/lib/api";
import { exigirEmail, origemApp } from "@/lib/piloto/config";
import { getDb, verificarErro } from "@/lib/db/client";
import { ErroDominio } from "@/lib/domain/erros";
export async function POST(request: Request) {
  return resposta(async () => {
    const email = exigirEmail((await corpo(request)).email);
    const chave = "login:" + createHash("sha256").update(email).digest("hex");
    const janela = new Date(
      Math.floor(Date.now() / 3600000) * 3600000,
    ).toISOString();
    const { data, error } = await getDb().rpc("piloto_consumir", {
      chave_input: chave,
      janela_input: janela,
      limite_input: 5,
    });
    verificarErro(error);
    if (!data)
      throw new ErroDominio(
        "Aguarde para pedir outro link. Verifique sua caixa de entrada e spam.",
        429,
      );
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
            setItem: (key, value) => {
              jar.set(key, value, {
                httpOnly: true,
                secure: new URL(origemApp()).protocol === "https:",
                sameSite: "lax",
                path: "/",
                maxAge: 600,
              });
            },
            removeItem: (key) => {
              jar.delete(key);
            },
          },
        },
      },
    );
    const { error: erro } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: new URL("/auth/callback", origemApp()).href,
        shouldCreateUser: true,
      },
    });
    if (erro)
      throw new ErroDominio(
        "Não foi possível enviar o link. Tente novamente mais tarde.",
        503,
      );
    return { ok: true };
  });
}
