import { z } from "zod";
import { cookies } from "next/headers";
import { getDb, verificarErro } from "@/lib/db/client";
import { ErroDominio } from "@/lib/domain/erros";
import { ACCESS, REFRESH } from "@/lib/auth/piloto";
import { nomeProduto } from "@/lib/identidade";

/** Texto que a participante digita para confirmar a exclusão. */
export const CONFIRMACAO_EXCLUSAO = "EXCLUIR";
export const exclusaoInput = z.object({
  confirmacao: z
    .string()
    .trim()
    .transform((t) => t.toUpperCase())
    .pipe(z.literal(CONFIRMACAO_EXCLUSAO)),
});

/**
 * Cópia dos dados da própria participante (LGPD, art. 18). Das Faíscas vão
 * só a parte dela; anotações e mensagens da outra pessoa não saem daqui.
 */
export async function exportarDados(pid: string, email: string) {
  const db = getDb();
  const [perfil, conta, saberes, faiscas, mensagens, posts, comentarios, avaliacoes, relatos] =
    await Promise.all([
      db.from("profiles").select("*").eq("id", pid).single(),
      db
        .from("piloto_contas")
        .select("onboarding,ia_consentimento,consentimento_versao,consentimento_em,created_at")
        .eq("profile_id", pid)
        .single(),
      db.from("saberes").select("saber,evidencia,fonte,confirmado,created_at").eq("profile_id", pid),
      db
        .from("faiscas")
        .select("id,solicitante_id,convidada_id,pedido,tema,horario,status,anotacoes,resumo,created_at")
        .or(`solicitante_id.eq.${pid},convidada_id.eq.${pid}`),
      db.from("piloto_mensagens").select("faisca_id,texto,created_at").eq("autora_id", pid),
      db.from("posts").select("tipo,titulo,corpo,created_at").eq("autora_id", pid),
      db.from("comments").select("post_id,corpo,created_at").eq("autora_id", pid),
      db.from("piloto_avaliacoes").select("faisca_id,utilidade,voltaria,created_at").eq("profile_id", pid),
      db.from("piloto_relatos").select("categoria,descricao,estado,created_at").eq("profile_id", pid),
    ]);
  for (const r of [perfil, conta, saberes, faiscas, mensagens, posts, comentarios, avaliacoes, relatos])
    verificarErro(r.error);
  return {
    aplicativo: nomeProduto,
    exportado_em: new Date().toISOString(),
    email,
    perfil: perfil.data,
    conta: conta.data,
    saberes: saberes.data,
    faiscas: (faiscas.data ?? []).map(({ anotacoes, solicitante_id, ...f }) => ({
      ...f,
      papel: solicitante_id === pid ? "solicitante" : "convidada",
      minha_anotacao:
        anotacoes && typeof anotacoes === "object" && !Array.isArray(anotacoes)
          ? (anotacoes[pid] ?? null)
          : null,
    })),
    mensagens_enviadas: mensagens.data,
    publicacoes: posts.data,
    comentarios: comentarios.data,
    avaliacoes: avaliacoes.data,
    relatos: relatos.data,
  };
}

/**
 * Exclui a conta: o banco remove o que é só dela e anonimiza o que é dividido
 * com outra pessoa; depois o login é apagado e a sessão, encerrada.
 */
export async function excluirConta(pid: string, entrada: unknown) {
  exclusaoInput.parse(entrada);
  const { data, error } = await getDb().rpc("piloto_excluir_conta", { usuaria_id: pid });
  if (error)
    throw new ErroDominio("Não foi possível excluir a conta agora. Nada foi apagado; tente novamente.", 409);
  const { auth_user_id } = z.object({ ok: z.literal(true), auth_user_id: z.uuid() }).parse(data);
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
  // Os dados já saíram; se o login não for apagado agora, uma nova entrada cria uma conta vazia.
  const { error: authErro } = await getDb().auth.admin.deleteUser(auth_user_id);
  if (authErro) console.error("Login não removido após exclusão da conta", auth_user_id, authErro.message);
  return { ok: true as const, login_removido: !authErro };
}
