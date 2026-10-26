/**
 * QA Completo Automatizado - Tecida
 * Executa testes end-to-end de conformidade, segurança, fluxos de usuário e integrações
 * diretamente contra a implantação em produção (ou ambiente configurado).
 */

import type { DadosPiloto } from "@/lib/piloto/dados";
const BASE_URL = process.env.QA_BASE_URL || "https://entre-elas-omega.vercel.app";

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

class CookieJar {
  private cookies: Map<string, string> = new Map();

  update(headers: Headers) {
    const setCookieHeader = headers.get("set-cookie");
    if (!setCookieHeader) return;

    const parts = setCookieHeader.split(/,(?=[^;]+=[^;]+)/g);
    for (const part of parts) {
      const [nameVal] = part.split(";");
      const [name, ...val] = nameVal.trim().split("=");
      if (name) {
        const value = val.join("=");
        if (value === "" || part.includes("Max-Age=0") || part.includes("Expires=Thu, 01 Jan 1970")) {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, value);
        }
      }
    }
  }

  getCookieString(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  clear() {
    this.cookies.clear();
  }
}

async function runTest(
  suite: string,
  testName: string,
  fn: () => Promise<void>
) {
  const start = performance.now();
  try {
    await fn();
    const duration = Math.round(performance.now() - start);
    results.push({ suite, test: testName, passed: true, durationMs: duration });
    console.log(`  ✓ ${testName} (${duration}ms)`);
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ suite, test: testName, passed: false, durationMs: duration, details: msg });
    console.error(`  ✗ ${testName} (${duration}ms): ${msg}`);
  }
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

async function request(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    jar?: CookieJar;
    headers?: Record<string, string>;
    redirect?: RequestRedirect;
  } = {}
) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = { ...options.headers };

  if (options.jar) {
    const cookieStr = options.jar.getCookieString();
    if (cookieStr) headers["Cookie"] = cookieStr;
  }

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: options.method || (options.body ? "POST" : "GET"),
    headers,
    body: options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
    redirect: options.redirect || "manual",
  });

  if (options.jar) {
    options.jar.update(res.headers);
  }

  return res;
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Resposta não é JSON válido (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🔍 INICIANDO SUÍTE DE QA COMPLETA - TECIDA`);
  console.log(`🌐 Alvo: ${BASE_URL}`);
  console.log(`⏰ Data/Hora: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  // ---------------------------------------------------------
  // SUÍTE 1: Rotas Públicas e Assets
  // ---------------------------------------------------------
  console.log(`[Suíte 1: Rotas Públicas e Integridade de Interface]`);

  await runTest("Rotas Públicas", "Página Inicial (/) redireciona ou renderiza conforme modo piloto", async () => {
    const res = await request("/");
    // Em APP_MODE=piloto, a raiz redireciona para /piloto (307)
    if ([307, 302, 303].includes(res.status)) {
      const loc = res.headers.get("location");
      assert(loc && (loc.includes("/piloto") || loc.includes("/entrar")), `Redirecionamento inesperado da raiz: ${loc}`);
    } else {
      assert(res.status === 200, `Esperado 200 ou 307, recebido ${res.status}`);
      const html = await res.text();
      assert(html.includes("Tecida"), "Título ou marca ausente no HTML");
    }
  });

  await runTest("Rotas Públicas", "Página de Login (/entrar) responde HTTP 200 com HTML e Metadados", async () => {
    const res = await request("/entrar");
    assert(res.status === 200, `Esperado 200, recebido ${res.status}`);
    const html = await res.text();
    assert(html.includes("Tecida"), "Metadados de marca não encontrados no HTML da página de entrar");
    assert(html.includes("viewport"), "Meta viewport ausente");
  });

  await runTest("Rotas Públicas", "Página Protegida (/piloto) sem autenticação redireciona para /entrar", async () => {
    const res = await request("/piloto");
    assert([307, 302, 303].includes(res.status), `Esperado redirect 307/302, recebido ${res.status}`);
    const loc = res.headers.get("location");
    assert(loc && loc.includes("/entrar"), `Redirecionamento incorreto: ${loc}`);
  });

  await runTest("Rotas Públicas", "Página Offline (/offline) responde HTTP 200 para PWA", async () => {
    const res = await request("/offline");
    assert(res.status === 200, `Esperado 200, recebido ${res.status}`);
  });

  // ---------------------------------------------------------
  // SUÍTE 2: Autenticação, Limites e Validação de Entrada
  // ---------------------------------------------------------
  console.log(`\n[Suíte 2: Autenticação, Segurança e Tratamento de Erros]`);

  await runTest("Auth & Segurança", "Rejeita requisição com JSON inválido ou malformado", async () => {
    const res = await request("/api/auth/entrar", {
      method: "POST",
      body: "{ email: 'invalido', ",
      headers: { "Content-Type": "application/json" },
    });
    assert(res.status === 400, `Esperado 400 para JSON quebrado, recebido ${res.status}`);
  });

  await runTest("Auth & Segurança", "Rejeita e-mail inválido com erro 400", async () => {
    const res = await request("/api/auth/entrar", {
      body: { modo: "entrar", email: "nao-eh-email", senha: "senhaValida123!" },
    });
    assert(res.status === 400, `Esperado 400 para formato de e-mail inválido, recebido ${res.status}`);
    const data = await json(res);
    assert(data.erro, "Não retornou mensagem de erro amigável");
  });

  await runTest("Auth & Segurança", "Rejeita senha curta (< 6 caracteres) com validação descritiva", async () => {
    const res = await request("/api/auth/entrar", {
      body: { modo: "cadastrar", email: "qa.teste@exemplo.com", senha: "123" },
    });
    assert(res.status === 400, `Esperado 400 para senha curta, recebido ${res.status}`);
    const data = await json(res);
    assert(
      (data.erro && data.erro.includes("6 caracteres")) ||
      (Array.isArray(data.detalhes) && data.detalhes.some((d: { mensagem: string }) => d.mensagem.includes("6 caracteres"))),
      `Validação não alertou sobre os 6 caracteres: ${JSON.stringify(data)}`
    );
  });

  await runTest("Auth & Segurança", "Rejeita senha incorreta no login com erro 401", async () => {
    const res = await request("/api/auth/entrar", {
      body: { modo: "entrar", email: "valentimleticia812@gmail.com", senha: "SenhaTotalmenteErrada123!" },
    });
    assert(res.status === 401, `Esperado 401 para credenciais inválidas, recebido ${res.status}`);
    const data = await json(res);
    assert(data.erro.includes("E-mail ou senha incorretos"), `Mensagem inesperada: ${data.erro}`);
  });

  // ---------------------------------------------------------
  // SUÍTE 3: Login Real da Letícia e Acesso aos Dados do Piloto
  // ---------------------------------------------------------
  console.log(`\n[Suíte 3: Sessão Real da Letícia e Dados do Piloto]`);

  const jarLeticia = new CookieJar();

  await runTest("Sessão Letícia", "Login com credenciais oficiais (valentimleticia812@gmail.com)", async () => {
    const res = await request("/api/auth/entrar", {
      body: { modo: "entrar", email: "valentimleticia812@gmail.com", senha: "EntreElas2026!" },
      jar: jarLeticia,
    });
    assert(res.status === 200, `Esperado 200, recebido ${res.status}`);
    const data = await json(res);
    assert(data.ok === true, "data.ok não é true");
    assert(jarLeticia.get("entre_elas_access"), "Cookie de sessão 'entre_elas_access' não foi emitido");
  });

  await runTest("Dados do Piloto", "Consulta /api/piloto retorna estado completo do perfil", async () => {
    const res = await request("/api/piloto", { jar: jarLeticia });
    assert(res.status === 200, `Esperado 200, recebido ${res.status}`);
    const dadosLeticia: DadosPiloto = await json(res);

    assert(dadosLeticia.conta, "Propriedade conta ausente");
    assert(dadosLeticia.perfil, "Propriedade perfil ausente");
    assert(Array.isArray(dadosLeticia.pessoas), "pessoas deve ser um array");
    assert(Array.isArray(dadosLeticia.saberes), "saberes deve ser um array");
    assert(Array.isArray(dadosLeticia.comunidades), "comunidades deve ser um array");
    assert(Array.isArray(dadosLeticia.faiscas), "faiscas deve ser um array");

    console.log(`    ↳ Usuária: "${dadosLeticia.perfil.nome}" (ID: ${dadosLeticia.perfil.id})`);
    console.log(`    ↳ Saberes disponíveis na rede: ${dadosLeticia.saberes.length}`);
    console.log(`    ↳ Participantes conectadas: ${dadosLeticia.pessoas.length}`);
    console.log(`    ↳ Faíscas registradas: ${dadosLeticia.faiscas.length}`);
  });

  // ---------------------------------------------------------
  // SUÍTE 4: Consentimento de IA e Busca Semântica
  // ---------------------------------------------------------
  console.log(`\n[Suíte 4: Consentimento e Busca Semântica com Gemini/pgvector]`);

  await runTest("Consentimento IA", "Atualiza consentimento de IA para ativo", async () => {
    const res = await request("/api/piloto/consentimento", {
      body: { autorizado: true },
      jar: jarLeticia,
    });
    assert(res.status === 200, `Esperado 200, recebido ${res.status}`);
  });

  await runTest("Busca Semântica", "Busca de conexões (/api/faiscas/buscar) usando embeddings", async () => {
    const res = await request("/api/faiscas/buscar", {
      body: { pedido: "Quero aprender sobre gestão de tempo, liderança ágil e metas de equipe" },
      jar: jarLeticia,
    });
    assert(res.status === 200, `Esperado 200, recebido ${res.status}`);
    const matches = await json(res);
    assert(Array.isArray(matches), "Esperado array de recomendações");
    console.log(`    ↳ Matches retornados: ${matches.length}`);
  });

  // ---------------------------------------------------------
  // SUÍTE 5: Fluxo Completo Multi-Usuária (Cadastro + Convite + Aceite + Chat + Daily Video)
  // ---------------------------------------------------------
  console.log(`\n[Suíte 5: Fluxo Ponta a Ponta entre Duas Participantes Reais]`);

  const emailParceira = `qa.avaliadora.${Date.now()}@entreelas.com.br`;
  const senhaParceira = "AvaliadoraQa2026!";
  const jarParceira = new CookieJar();
  let dadosParceira: DadosPiloto | null = null;

  await runTest("Cadastro Usuária 2", `Criação instantânea da conta da parceira (${emailParceira})`, async () => {
    const res = await request("/api/auth/entrar", {
      body: { modo: "cadastrar", email: emailParceira, senha: senhaParceira },
      jar: jarParceira,
    });
    assert(res.status === 200, `Esperado 200 no cadastro, recebido ${res.status}`);
    assert(jarParceira.get("entre_elas_access"), "Cookie não gerado para a nova conta");
  });

  await runTest("Configuração Perfil 2", "Parceira preenche onboarding e salva perfil no piloto", async () => {
    // Buscar perfil inicial
    const r1 = await request("/api/piloto", { jar: jarParceira });
    dadosParceira = await json(r1);

    // Consentir com IA para permitir indexação e busca semântica
    const rConsent = await request("/api/piloto/consentimento", {
      body: { autorizado: true },
      jar: jarParceira,
    });
    assert(rConsent.status === 200, `Esperado 200 ao consentir IA, recebido ${rConsent.status}`);

    // Salvar perfil completo compatível com perfilPilotoSchema
    const r2 = await request("/api/piloto/perfil", {
      body: {
        nome: "Camila Engenheira QA",
        cargo: "Engenheira de Software",
        area: "Tecnologia",
        cidade: "São Paulo",
        regional: "Sudeste",
        interesses: ["Testes Automatizados", "Arquitetura Front-end", "Qualidade Ágil"],
        objetivos: ["Conectar com lideranças femininas em tecnologia"],
      },
      jar: jarParceira,
    });
    assert(r2.status === 200, `Esperado 200 ao salvar perfil, recebido ${r2.status}`);

    // Concluir onboarding
    const r3 = await request("/api/piloto/onboarding", {
      body: {},
      jar: jarParceira,
    });
    assert(r3.status === 200, `Esperado 200 ao concluir onboarding, recebido ${r3.status}`);

    // Reindexar perfil na busca semântica
    const r4 = await request("/api/piloto/indexar", {
      body: {},
      jar: jarParceira,
    });
    assert(r4.status === 200, `Esperado 200 ao indexar perfil, recebido ${r4.status}`);
  });

  let faiscaCriadaId: string = "";
  const horario1 = new Date(Date.now() + 86400000).toISOString();
  const horario2 = new Date(Date.now() + 172800000).toISOString();

  await runTest("Convite de Faísca", "Letícia envia convite de conversa para Camila", async () => {
    assert(dadosParceira, "Dados da parceira não foram carregados");
    const res = await request("/api/faiscas", {
      body: {
        convidada_id: dadosParceira.perfil.id,
        pedido: "Oi Camila! Vi que você tem experiência com testes automatizados e arquitetura. Poderíamos trocar ideias?",
        tema: "Boas práticas de testes automatizados e QA",
        horarios_propostos: [horario1, horario2],
        chave_pedido: crypto.randomUUID(),
      },
      jar: jarLeticia,
    });
    assert(res.status === 200, `Esperado 200 ao criar faísca, recebido ${res.status}`);
    const data = await json(res);
    assert(data.id, "ID da faísca não retornado");
    faiscaCriadaId = data.id;
    console.log(`    ↳ Faísca criada com sucesso: ${faiscaCriadaId} (Status: ${data.status})`);
  });

  await runTest("Notificação Parceira", "Camila acessa o piloto e visualiza o convite pendente", async () => {
    const res = await request("/api/piloto", { jar: jarParceira });
    const dados = await json(res);
    const convite = dados.faiscas.find((f: { id: string }) => f.id === faiscaCriadaId);
    assert(convite, "O convite não apareceu na lista de faíscas da parceira");
    assert(convite.status === "pendente", `Status esperado 'pendente', recebido '${convite.status}'`);
  });

  await runTest("Aceite de Faísca", "Camila aceita a Faísca e escolhe o horário", async () => {
    const res = await request("/api/faiscas/aceitar", {
      body: {
        faisca_id: faiscaCriadaId,
        horario: horario1,
      },
      jar: jarParceira,
    });
    assert(res.status === 200, `Esperado 200 ao aceitar faísca, recebido ${res.status}`);
    const data = await json(res);
    assert(data.status === "aceita", `Status após aceite deveria ser 'aceita', recebido '${data.status}'`);
  });

  await runTest("Chat Nativo Supabase", "Letícia e Camila trocam mensagens na Faísca", async () => {
    // 1. Letícia envia mensagem
    const r1 = await request("/api/piloto/enviar", {
      body: {
        faisca_id: faiscaCriadaId,
        texto: "Olá Camila! Muito feliz em conectar com você para trocar sobre testes!",
      },
      jar: jarLeticia,
    });
    assert(r1.status === 200, `Esperado 200 no envio de mensagem, recebido ${r1.status}`);

    // 2. Camila consulta o chat e lê a mensagem
    const r2 = await request("/api/piloto/mensagens", {
      body: { faisca_id: faiscaCriadaId },
      jar: jarParceira,
    });
    assert(r2.status === 200, `Esperado 200 ao listar mensagens, recebido ${r2.status}`);
    const mensagens = await json(r2);
    assert(Array.isArray(mensagens), "Esperado array de mensagens");
    assert(mensagens.length >= 1, "Mensagem enviada por Letícia não foi encontrada");
    assert(mensagens[mensagens.length - 1].texto.includes("Muito feliz em conectar"), "Conteúdo da mensagem divergente");

    // 3. Camila responde no chat
    const r3 = await request("/api/piloto/enviar", {
      body: {
        faisca_id: faiscaCriadaId,
        texto: "Oi Letícia! Vamos com certeza, arquitetura de testes faz toda a diferença!",
      },
      jar: jarParceira,
    });
    assert(r3.status === 200, `Esperado 200 na resposta de Camila, recebido ${r3.status}`);

    // 4. Letícia confere a resposta recebida
    const r4 = await request("/api/piloto/mensagens", {
      body: { faisca_id: faiscaCriadaId },
      jar: jarLeticia,
    });
    const msgsLeticia = await json(r4);
    assert(msgsLeticia.length >= 2, "Letícia não recebeu a réplica de Camila");
    console.log(`    ↳ Total de mensagens trocadas em tempo real: ${msgsLeticia.length}`);
  });

  await runTest("Videochamada Daily", "Geração de sala e token de vídeo autenticado na Faísca", async () => {
    const res = await request("/api/faiscas/video", {
      body: { faisca_id: faiscaCriadaId },
      jar: jarLeticia,
    });
    assert(res.status === 200, `Esperado 200 na solicitação de vídeo, recebido ${res.status}`);
    const video = await json(res);
    assert(video.url || video.token, "URL ou token da sala Daily não fornecido");
    console.log(`    ↳ Sala Daily criada com sucesso: ${video.url ? video.url.slice(0, 35) + "..." : "Token OK"}`);
  });

  await runTest("Conclusão e Anotações", "Participantes registram anotações e concluem a conversa", async () => {
    // 1. Letícia registra anotações
    const r1 = await request("/api/faiscas/anotar", {
      body: {
        faisca_id: faiscaCriadaId,
        texto: "Conversa excelente. Alinhamos estratégias de cobertura e pirâmide de testes.",
      },
      jar: jarLeticia,
    });
    assert(r1.status === 200, `Esperado 200 ao registrar anotações de Letícia, recebido ${r1.status}`);

    // 2. Camila registra anotações (regra do sistema: ambas precisam registrar para poder concluir)
    const rCamila = await request("/api/faiscas/anotar", {
      body: {
        faisca_id: faiscaCriadaId,
        texto: "Troca enriquecedora com Letícia. Discutimos arquitetura de automação ponta a ponta.",
      },
      jar: jarParceira,
    });
    assert(rCamila.status === 200, `Esperado 200 ao registrar anotações de Camila, recebido ${rCamila.status}`);

    // 3. Conclusão manual da Faísca com geração de aprendizados
    const r2 = await request("/api/faiscas/concluir-manual", {
      body: {
        faisca_id: faiscaCriadaId,
        texto: "Conversa super proveitosa sobre pirâmide de testes, cobertura e boas práticas em CI/CD.",
      },
      jar: jarLeticia,
    });
    assert(r2.status === 200, `Esperado 200 ao concluir faísca, recebido ${r2.status}`);
    const faiscaConcluida = await json(r2);
    assert(faiscaConcluida.status === "realizada", `Status esperado 'realizada', recebido '${faiscaConcluida.status}'`);
  });

  // ---------------------------------------------------------
  // SUÍTE 6: Relatos de Problema / Suporte e Logout
  // ---------------------------------------------------------
  console.log(`\n[Suíte 6: Central de Relatos e Encerramento Seguro]`);

  await runTest("Relatos e Suporte", "Envio de relato de suporte ou feedback no piloto", async () => {
    const res = await request("/api/piloto/relatar", {
      body: {
        categoria: "outro",
        descricao: "Teste automatizado de relatório e feedback de QA. Tudo funcionando perfeitamente.",
      },
      jar: jarParceira,
    });
    assert(res.status === 200, `Esperado 200 ao enviar relato, recebido ${res.status}`);
  });

  await runTest("Logout Seguro", "Encerramento de sessão limpa cookies com segurança", async () => {
    const res = await request("/api/auth/sair", {
      method: "POST",
      body: {},
      jar: jarParceira,
    });
    assert(res.status === 200, `Esperado 200 ao deslogar, recebido ${res.status}`);
    // Verificar que acesso subsequente com essa jar é rejeitado
    const check = await request("/api/piloto", { jar: jarParceira });
    assert(check.status === 401, `Esperado 401 após logout, recebido ${check.status}`);
  });

  // ---------------------------------------------------------
  // RELATÓRIO FINAL
  // ---------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`📊 RELATÓRIO CONSOLIDADO DE QA`);
  console.log(`======================================================`);

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total de testes executados: ${total}`);
  console.log(`Sucessos: ${passed} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Falhas: ${failed}`);

  if (failed > 0) {
    console.log(`\n❌ TESTES COM FALHA:`);
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`- [${r.suite}] ${r.test}: ${r.details}`);
    }
    process.exit(1);
  } else {
    console.log(`\n✨ TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Erro fatal no executor de QA:", err);
  process.exit(1);
});
