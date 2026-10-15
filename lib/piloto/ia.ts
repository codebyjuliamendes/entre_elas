import { AsyncLocalStorage } from "node:async_hooks";
import { getDb, verificarErro } from "@/lib/db/client";
import { ErroDominio } from "@/lib/domain/erros";
import { pilotoAtivo } from "./config";
const contexto = new AsyncLocalStorage<{ profileId?: string }>();
export const comContextoIA = <T>(acao: () => Promise<T>) =>
  contexto.run({}, acao);
export function identificarIA(profileId: string) {
  const atual = contexto.getStore();
  if (atual) atual.profileId = profileId;
}
export async function permitirIA(profileId?: string) {
  if (!pilotoAtivo()) return;
  const pid = profileId ?? contexto.getStore()?.profileId;
  if (!pid)
    throw new ErroDominio("A IA do piloto exige uma conta verificada.", 403);
  const { data, error } = await getDb()
    .from("piloto_contas")
    .select("ia_consentimento")
    .eq("profile_id", pid)
    .single();
  verificarErro(error);
  if (!data?.ia_consentimento)
    throw new ErroDominio(
      "Autorize o uso de IA no seu perfil ou continue manualmente.",
      403,
    );
}
export async function consumirIA() {
  if (!pilotoAtivo()) return;
  await permitirIA();
  const pid = contexto.getStore()!.profileId!;
  const janela = new Date(
    new Date().toISOString().slice(0, 10) + "T00:00:00Z",
  ).toISOString();
  const { data, error } = await getDb().rpc("piloto_consumir", {
    chave_input: `ia:${pid}`,
    janela_input: janela,
    limite_input: 60,
  });
  verificarErro(error);
  if (!data)
    throw new ErroDominio(
      "Você atingiu o limite diário de IA. Seus dados estão salvos; você pode continuar as trocas manualmente.",
      429,
    );
}
