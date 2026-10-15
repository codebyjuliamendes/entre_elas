import { getDb, verificarErro } from "@/lib/db/client";
import * as s from "@/lib/schemas/entities";
import { listarFaiscas } from "@/lib/domain/faisca";
import { listarComunidades } from "@/lib/domain/comunidade";
import { listarPosts } from "@/lib/domain/conteudo";
import { listarEventos } from "@/lib/domain/evento";
import { lider } from "./config";
import { z } from "zod";
export async function dadosPiloto(profileId: string, email: string) {
  const db = getDb();
  const [
    fs,
    cs,
    ps,
    es,
    contas,
    perfis,
    membros,
    inscricoes,
    favoritos,
    saberes,
  ] = await Promise.all([
    listarFaiscas(profileId),
    listarComunidades(profileId),
    listarPosts(profileId),
    listarEventos(profileId),
    db
      .from("piloto_contas")
      .select("profile_id,onboarding,ia_consentimento,foto"),
    db.from("profiles").select("*"),
    db
      .from("community_members")
      .select("community_id")
      .eq("profile_id", profileId),
    db
      .from("event_participantes")
      .select("event_id")
      .eq("profile_id", profileId),
    db.from("piloto_favoritos").select("post_id").eq("profile_id", profileId),
    db.from("saberes").select("*").eq("profile_id", profileId),
  ]);
  for (const r of [contas, perfis, membros, inscricoes, favoritos, saberes])
    verificarErro(r.error);
  const pessoas = z
    .array(s.profile)
    .parse(perfis.data)
    .filter((p) =>
      contas.data?.some(
        (c) =>
          (c.onboarding || c.profile_id === profileId) && c.profile_id === p.id,
      ),
    );
  return {
    agora: new Date().toISOString(),
    perfil: pessoas.find((p) => p.id === profileId)!,
    pessoas,
    conta: contas.data!.find((c) => c.profile_id === profileId)!,
    fotos: Object.fromEntries(contas.data!.map((c) => [c.profile_id, c.foto])),
    faiscas: fs,
    comunidades: cs,
    posts: ps,
    eventos: es,
    membros: membros.data!.map((m) => m.community_id),
    inscricoes: inscricoes.data!.map((e) => e.event_id),
    favoritos: favoritos.data!.map((p) => p.post_id),
    saberes: z.array(s.saber).parse(saberes.data),
    lider: lider(email),
  };
}
export type DadosPiloto = Awaited<ReturnType<typeof dadosPiloto>>;
