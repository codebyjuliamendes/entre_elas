import { z } from "zod";
import { getDb, verificarErro } from "@/lib/db/client";
import { ErroDominio } from "@/lib/domain/erros";
import { id } from "@/lib/schemas/entities";
export const relatoInput = z.object({
  categoria: z.enum([
    "acesso",
    "ia",
    "convite",
    "chat",
    "video",
    "perfil",
    "outro",
  ]),
  descricao: z.string().trim().min(10).max(2000),
});
export const relato = relatoInput.extend({
  id,
  profile_id: id,
  estado: z.enum(["aberto", "resolvido"]),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});
export async function listarRelatos(pid: string, lider: boolean) {
  const usuaria = id.parse(pid);
  const query = getDb()
    .from("piloto_relatos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data, error } = await (lider
    ? query
    : query.eq("profile_id", usuaria));
  verificarErro(error);
  return z.array(relato).parse(data);
}
export async function relatarProblema(pid: string, entrada: unknown) {
  const dados = relatoInput.parse(entrada);
  const profileId = id.parse(pid);
  const janela = new Date();
  janela.setUTCMinutes(0, 0, 0);
  const limite = await getDb().rpc("piloto_consumir", {
    chave_input: `relato:${profileId}`,
    janela_input: janela.toISOString(),
    limite_input: 10,
  });
  verificarErro(limite.error);
  if (!limite.data)
    throw new ErroDominio(
      "Você atingiu o limite de dez relatos nesta hora. Seus relatos anteriores continuam salvos.",
      429,
    );
  const { data, error } = await getDb()
    .from("piloto_relatos")
    .insert({ profile_id: profileId, ...dados })
    .select("*")
    .single();
  verificarErro(error);
  return relato.parse(data);
}
export async function resolverRelato(entrada: unknown, lider: boolean) {
  if (!lider)
    throw new ErroDominio(
      "Somente a liderança pode atualizar o atendimento.",
      403,
    );
  const input = z
    .object({ relato_id: id, resolvido: z.boolean() })
    .parse(entrada);
  const { data, error } = await getDb()
    .from("piloto_relatos")
    .update({ estado: input.resolvido ? "resolvido" : "aberto" })
    .eq("id", input.relato_id)
    .select("*")
    .single();
  verificarErro(error);
  return relato.parse(data);
}
export type Relato = z.infer<typeof relato>;
