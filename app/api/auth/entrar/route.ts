import { z } from "zod";
import { resposta, corpo } from "@/lib/api";
import { clienteAuth, salvarSessao } from "@/lib/auth/piloto";
import { exigirEmail } from "@/lib/piloto/config";
import { getDb, verificarErro } from "@/lib/db/client";
import { ErroDominio } from "@/lib/domain/erros";
import { normalizarRetorno } from "@/lib/piloto/retorno";

const entrarSchema = z.object({
  email: z.string().trim().email().max(254),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").max(128),
  modo: z.enum(["entrar", "cadastrar"]).default("entrar"),
  retorno: z.string().optional(),
});

export async function POST(request: Request) {
  return resposta(async () => {
    const input = entrarSchema.parse(await corpo(request));
    const email = exigirEmail(input.email);
    const senha = input.senha;
    const client = clienteAuth();

    let session = null;
    let userId = null;

    if (input.modo === "cadastrar") {
      const { data, error } = await client.auth.signUp({
        email,
        password: senha,
      });
      if (error) {
        if (
          error.message.includes("already registered") ||
          error.message.includes("already exists") ||
          (error as { code?: string }).code === "user_already_exists"
        ) {
          throw new ErroDominio(
            "Este e-mail já possui conta cadastrada. Escolha 'Já tenho conta' acima para entrar.",
            409,
          );
        }
        throw new ErroDominio(error.message, 400);
      }
      session = data.session;
      userId = data.user?.id;
    } else {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) {
        throw new ErroDominio(
          "E-mail ou senha incorretos. Confira os dados ou escolha 'Criar conta' se ainda não tiver cadastro.",
          401,
        );
      }
      session = data.session;
      userId = data.user?.id;
    }

    if (!session || !userId) {
      throw new ErroDominio(
        "Não foi possível iniciar sua sessão. Tente novamente.",
        500,
      );
    }

    // Provisionar conta no piloto caso ainda não exista
    const { error: pe } = await getDb().rpc("piloto_provisionar", {
      auth_id: userId,
    });
    verificarErro(pe);

    // Salvar sessão nos cookies HTTP-only
    await salvarSessao(session);

    return {
      ok: true,
      redirecionar: normalizarRetorno(input.retorno),
    };
  });
}
