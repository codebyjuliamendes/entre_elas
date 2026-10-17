/** Diagnóstico do ambiente real. Nunca imprime valores nem envia textos de participantes. */
import { z } from "zod";
import { StreamChat } from "stream-chat";
import { getDb } from "@/lib/db/client";
import { pilotoAtivo } from "@/lib/piloto/config";
import { gerarGemini, embedGemini } from "@/lib/ai/gemini";
import { gerarGroq } from "@/lib/ai/groq";
import { dimensaoEmbedding } from "@/lib/config";

let falhas = 0;
function registrar(nome: string, ok: boolean, detalhe: string) {
  if (!ok) falhas++;
  console.log(
    JSON.stringify({
      verificacao: nome,
      status: ok ? "ok" : "pendente",
      detalhe,
    }),
  );
}
async function testar(nome: string, acao: () => Promise<string>) {
  try {
    registrar(nome, true, await acao());
  } catch (e) {
    // Não imprimir erros dos SDKs: podem incluir headers, URLs assinadas ou conteúdo.
    const status =
      typeof e === "object" &&
      e !== null &&
      "status" in e &&
      typeof e.status === "number"
        ? ` (HTTP ${e.status})`
        : "";
    registrar(
      nome,
      false,
      "A verificação não foi concluída" +
        status +
        ". Confira configuração, acesso e limites do provedor.",
    );
  }
}
function presentes(...nomes: string[]) {
  return nomes.every((n) => Boolean(process.env[n]?.trim()));
}
async function main() {
  const requeridas = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_URL",
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "STREAM_API_KEY",
    "STREAM_API_SECRET",
    "DAILY_API_KEY",
  ];
  for (const nome of requeridas)
    registrar(
      nome,
      presentes(nome),
      presentes(nome)
        ? "Configurada; valor oculto. A presença não comprova validade."
        : "Ausente neste processo.",
    );
  registrar(
    "modo real",
    pilotoAtivo(),
    "APP_MODE=piloto é a configuração recomendada; apresentação deve ser explícita.",
  );
  for (const nome of ["APP_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const url = z.url().safeParse(process.env[nome]);
    const u = url.success ? new URL(url.data) : null;
    registrar(
      nome + " pública",
      Boolean(
        u &&
        u.protocol === "https:" &&
        !["localhost", "127.0.0.1", "0.0.0.0"].includes(u.hostname) &&
        !u.username &&
        !u.password &&
        !u.search &&
        !u.hash,
      ),
      "Para a banca, use URL HTTPS pública sem credenciais ou parâmetros.",
    );
  }
  registrar(
    "embedding 768",
    dimensaoEmbedding() === 768,
    "A dimensão deve corresponder às migrations e ao índice existente.",
  );
  if (presentes("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
    await testar("schema do piloto", async () => {
      const db = getDb();
      const consultas = [
        db
          .from("piloto_contas")
          .select("profile_id,onboarding,ia_consentimento,foto")
          .limit(0),
        db.from("faiscas").select("id,chave_pedido,anotacoes,resumo").limit(0),
        db.from("piloto_mensagens").select("id").limit(0),
        db.from("piloto_relatos").select("id,profile_id,estado").limit(0),
        db.from("piloto_limites").select("chave").limit(0),
      ];
      for (const resultado of await Promise.all(consultas))
        if (resultado.error) throw new Error("Schema indisponível");
      return "Tabelas e colunas do piloto acessíveis. Não certifica todas as funções SQL nem políticas.";
    });
  }
  if (presentes("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    await testar("Auth por e-mail", async () => {
      const r = await fetch(
        new URL("/auth/v1/settings", process.env.NEXT_PUBLIC_SUPABASE_URL),
        {
          headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!r.ok) throw { status: r.status };
      const auth = z
        .object({
          external: z.object({ email: z.boolean() }),
          disable_signup: z.boolean().optional(),
        })
        .parse(await r.json());
      if (!auth.external.email || auth.disable_signup === true)
        throw new Error("Cadastros por email bloqueados");
      return "Login e cadastro por e-mail habilitados. Entrega SMTP e retorno do link precisam de teste no navegador.";
    });
  }
  // --ia faz chamadas reais aos dois provedores, usando somente uma frase fictícia.
  if (process.argv.includes("--ia")) {
    const schema = z.object({ palavra: z.literal("conexao") });
    const prompt =
      'Teste técnico com conteúdo fictício. Responda o objeto JSON {"palavra":"conexao"}.';
    for (const [nome, chave, gerador] of [
      ["Gemini real", "GEMINI_API_KEY", gerarGemini],
      ["Groq real", "GROQ_API_KEY", gerarGroq],
    ] as const) {
      if (presentes(chave))
        await testar(nome, async () => {
          schema.parse(
            JSON.parse(
              await gerador(
                prompt,
                z.toJSONSchema(schema),
                AbortSignal.timeout(15000),
              ),
            ),
          );
          return "Geração remota e contrato JSON confirmados com conteúdo fictício.";
        });
    }
    if (presentes("GEMINI_API_KEY"))
      await testar("embedding real", async () => {
        const vetor = z
          .array(z.number().finite())
          .length(768)
          .parse(await embedGemini("Teste fictício de comunicação de ideias."));
        if (!vetor.some((v) => v !== 0)) throw new Error("Vetor nulo");
        return "Embedding remoto de 768 dimensões confirmado; nenhum vetor foi gravado.";
      });
  } else
    console.log(
      "IA remota não testada. Use npm run verificar:piloto -- --ia para verificar geração e embedding reais.",
    );
  if (presentes("STREAM_API_KEY", "STREAM_API_SECRET"))
    await testar("Stream", async () => {
      const stream = new StreamChat(
        process.env.STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!,
        { timeout: 10000 },
      );
      await stream.queryUsers(
        { id: { $eq: "entre-elas-diagnostico-sem-gravacao" } },
        {},
        { limit: 1 },
      );
      return "Credenciais aceitas em consulta; nenhuma usuária ou mensagem criada. Chat entre duas contas ainda precisa de teste.";
    });
  if (presentes("DAILY_API_KEY"))
    await testar("Daily", async () => {
      const r = await fetch("https://api.daily.co/v1/rooms?limit=1", {
        headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw { status: r.status };
      return "Credencial aceita em consulta; nenhuma sala criada. Câmera, áudio e encerramento ainda precisam de teste.";
    });
  console.log(
    "Este diagnóstico não envia e-mails, não faz seed e não substitui uma troca real entre duas contas.",
  );
  process.exitCode = falhas ? 1 : 0;
}
void main().catch(() => {
  console.error(
    "Diagnóstico interrompido. Confira o formato das variáveis; nenhum valor foi exibido.",
  );
  process.exitCode = 1;
});
