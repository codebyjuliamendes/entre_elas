import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { variavel } from "@/lib/config";
import { origemApp } from "@/lib/piloto/config";
/**
 * Cliente do Supabase que guarda o verificador PKCE num cookie curto, para o
 * /auth/callback concluir a entrada (link por e-mail ou login corporativo).
 */
export async function clientePkce() {
  const jar = await cookies();
  return createClient(
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
}
