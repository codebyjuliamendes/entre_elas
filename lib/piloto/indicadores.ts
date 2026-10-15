import { getDb, verificarErro } from "@/lib/db/client";
import { lider } from "./config";
import { ErroDominio } from "@/lib/domain/erros";
export async function indicadoresPiloto(email: string) {
  if (!lider(email))
    throw new ErroDominio("Painel restrito à liderança do piloto.", 403);
  const db = getDb();
  const { data: contas, error } = await db
    .from("piloto_contas")
    .select("profile_id,created_at");
  verificarErro(error);
  const ids = contas?.map((c) => c.profile_id) ?? [];
  if (!ids.length)
    return {
      participantes: 0,
      faiscas: 0,
      saberes: 0,
      dicas: 0,
      inscricoes: 0,
      mensagens: 0,
    };
  const inicio =
    process.env.PILOT_STARTS_AT || contas!.map((c) => c.created_at).sort()[0];
  const [fs, ss, ps, es, msgs] = await Promise.all([
    db
      .from("faiscas")
      .select("id")
      .in("solicitante_id", ids)
      .in("convidada_id", ids)
      .eq("status", "realizada")
      .gte("created_at", inicio),
    db
      .from("saberes")
      .select("fonte_id")
      .in("profile_id", ids)
      .eq("fonte", "faisca")
      .eq("confirmado", true)
      .gte("created_at", inicio),
    db
      .from("posts")
      .select("origem_faisca_id")
      .in("autora_id", ids)
      .not("origem_faisca_id", "is", null)
      .gte("created_at", inicio),
    db
      .from("event_participantes")
      .select("id")
      .in("profile_id", ids)
      .gte("created_at", inicio),
    db
      .from("piloto_mensagens")
      .select("faisca_id")
      .in("autora_id", ids)
      .gte("created_at", inicio),
  ]);
  for (const r of [fs, ss, ps, es, msgs]) verificarErro(r.error);
  const encontros = new Set(fs.data!.map((f) => f.id));
  return {
    inicio,
    participantes: ids.length,
    faiscas: encontros.size,
    saberes: ss.data!.filter((s) => s.fonte_id && encontros.has(s.fonte_id))
      .length,
    dicas: ps.data!.filter(
      (p) => p.origem_faisca_id && encontros.has(p.origem_faisca_id),
    ).length,
    inscricoes: es.data!.length,
    mensagens: msgs.data!.length,
  };
}
