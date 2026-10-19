import { getDb, verificarErro } from "@/lib/db/client";
import { lider } from "./config";
import { ErroDominio } from "@/lib/domain/erros";
import { consolidarIndicadores } from "./metricas";
// A tabela de avaliações chega por migração própria; até lá o painel segue sem ela.
export const tabelaAusente = (error: { code?: string } | null) =>
  !!error && ["42P01", "PGRST205"].includes(error.code ?? "");
export async function indicadoresPiloto(email: string) {
  if (!lider(email))
    throw new ErroDominio("Painel restrito à liderança do piloto.", 403);
  const db = getDb();
  const { data: contas, error } = await db
    .from("piloto_contas")
    .select("profile_id,onboarding,created_at");
  verificarErro(error);
  const ids = contas?.map((c) => c.profile_id) ?? [];
  const inicio =
    process.env.PILOT_STARTS_AT ||
    contas?.map((c) => c.created_at).sort()[0] ||
    null;
  if (!ids.length || !inicio)
    return consolidarIndicadores({
      inicio,
      contas: [],
      perfis: [],
      faiscas: [],
      saberes_fonte_ids: [],
      dicas_origem_ids: [],
      inscricoes: 0,
      mensagens: 0,
      avaliacoes: [],
    });
  const [perfis, fs, ss, ps, es, msgs, avs] = await Promise.all([
    db
      .from("profiles")
      .select("id,area,regional,interesses,objetivos")
      .in("id", ids),
    db
      .from("faiscas")
      .select("id,solicitante_id,convidada_id,status,horario")
      .in("solicitante_id", ids)
      .in("convidada_id", ids)
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
    db
      .from("piloto_avaliacoes")
      .select("utilidade,voltaria")
      .in("profile_id", ids),
  ]);
  for (const r of [perfis, fs, ss, ps, es, msgs]) verificarErro(r.error);
  if (!tabelaAusente(avs.error)) verificarErro(avs.error);
  return consolidarIndicadores({
    inicio,
    contas: contas!,
    perfis: perfis.data!,
    faiscas: fs.data!,
    saberes_fonte_ids: ss.data!.map((s) => s.fonte_id),
    dicas_origem_ids: ps.data!.map((p) => p.origem_faisca_id),
    inscricoes: es.data!.length,
    mensagens: msgs.data!.length,
    avaliacoes: avs.error ? null : avs.data!,
  });
}
