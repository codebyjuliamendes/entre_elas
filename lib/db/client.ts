import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { variavel } from "@/lib/config";
import type { Database } from "./types";
let client: SupabaseClient<Database> | undefined;
export function getDb(): SupabaseClient<Database> {
  if (typeof window !== "undefined")
    throw new Error("O banco só pode ser acessado pelo servidor.");
  return (client ??= createClient<Database>(
    variavel("NEXT_PUBLIC_SUPABASE_URL"),
    variavel("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.any([
              AbortSignal.timeout(8000),
              ...(init?.signal ? [init.signal] : []),
            ]),
          }),
      },
    },
  ));
}
export function verificarErro(error: { message: string } | null): void {
  if (error) throw new Error(`Erro no banco: ${error.message}`);
}
