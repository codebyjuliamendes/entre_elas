import { z } from "zod";
import { normalizarRetorno, COOKIE_RETORNO } from "@/lib/piloto/retorno";
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
    const entrada = await corpo(request);
    const email = exigirEmail(entrada.email);
    const modo = z
      .enum(["entrar", "cadastrar"])
      .default("entrar")
      .parse(entrada.modo);
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
    const limiteGlobal = await getDb().rpc("piloto_consumir", {
      chave_input: "login:global",
      janela_input: janela,
      limite_input: 100,
    });
    verificarErro(limiteGlobal.error);
    if (!limiteGlobal.data)
      throw new ErroDominio(
        "O envio de links está temporariamente no limite. Tente novamente mais tarde.",
        429,
      );
    const jar = await cookies();
    jar.set(COOKIE_RETORNO, normalizarRetorno(entrada.retorno), {
      httpOnly: true,
      secure: new URL(origemApp()).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
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
        shouldCreateUser: modo === "cadastrar",
      },
    });
    if (erro)
      throw new ErroDominio(
        "Não foi possível enviar o link. Se este é seu primeiro acesso, escolha Criar conta. Se já tem conta, confira o e-mail ou tente novamente mais tarde.",
        503,
      );
    return { ok: true };
  });
}
