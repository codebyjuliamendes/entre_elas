import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
async function linkEntrada(page: Page, email: string, cadastrar = false) {
  await page.goto("/entrar");
  if (cadastrar)
    await page
      .getByRole("button", { name: "Criar conta", exact: true })
      .click();
  await page.getByLabel("Seu e-mail", { exact: true }).fill(email);
  await page
    .getByRole("button", {
      name: cadastrar
        ? "Prefere receber link de confirmação por e-mail?"
        : "Esqueceu a senha ou prefere link por e-mail?",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("Link enviado");
  const link = await (
    await page.request.get(
      "http://127.0.0.1:54322/test-link?email=" + encodeURIComponent(email),
    )
  ).json();
  await page.goto(link.url);
}
async function entrar(page: Page, email: string, nome: string) {
  await linkEntrada(page, email, true);
  await preencherPerfil(page, nome);
}
async function preencherPerfil(page: Page, nome: string) {
  await page
    .getByRole("button", { name: "Prefiro só conhecer a rede" })
    .click();
  await page
    .getByRole("button", { name: "Montar meu perfil", exact: true })
    .click();
  await page.getByLabel("Seu nome", { exact: true }).fill(nome);
  await page.getByLabel("Cargo ou ocupação", { exact: true }).fill("Analista");
  await page.getByLabel("Área", { exact: true }).fill("Dados");
  await page.getByLabel("Cidade", { exact: true }).fill("Recife");
  await page.getByLabel("Regional", { exact: true }).fill("Nordeste");
  await page
    .getByLabel("Saberes que pode compartilhar", { exact: true })
    .fill("Indicadores");
  await page
    .getByLabel("O que quer aprender", { exact: true })
    .fill("Comunicar ideias");
  await page
    .getByRole("button", { name: "Salvar perfil e começar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Qual é a sua próxima Faísca/ }),
  ).toBeVisible();
}
test("duas contas, convite e consentimentos reais no banco, sem IA ou provedores externos", async ({
  browser,
  page,
}) => {
  const ctx = await browser.newContext();
  const outra = await ctx.newPage();
  await entrar(page, "primeira@banca.test", "Primeira Participante");
  await entrar(outra, "livre@outra.test", "Segunda Participante");
  const segundaConta = await (await outra.request.get("/api/piloto")).json();
  await page.reload();
  await page
    .getByLabel("O que você quer aprender?", { exact: true })
    .fill("Como escolher indicadores para uma decisão?");
  await page
    .getByLabel("Com quem você quer conversar?", { exact: true })
    .selectOption(segundaConta.perfil.id);
  const futuro = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page
    .getByLabel("Propor um horário no seu fuso local", { exact: true })
    .fill(futuro);
  await page
    .getByRole("button", {
      name: "Adicionar outra opção de horário",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Horário alternativo 1", { exact: true })
    .fill(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16));
  const chaves: string[] = [];
  let perderResposta = true;
  await page.route("**/api/faiscas", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    chaves.push(route.request().postDataJSON().chave_pedido);
    if (perderResposta) {
      perderResposta = false;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Enviar convite", exact: true })
    .click();
  await expect(
    page.getByText(/Sem conexão\. Seus dados já salvos continuam/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enviar convite", exact: true })
    .click();
  await expect(
    page.getByText(
      "Convite enviado. A outra pessoa poderá responder na própria conta.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(chaves).toHaveLength(2);
  expect(new Set(chaves).size).toBe(1);
  const convites = await (await page.request.get("/api/faiscas")).json();
  expect(
    convites.filter(
      (f: { pedido: string }) =>
        f.pedido === "Como escolher indicadores para uma decisão?",
    ),
  ).toHaveLength(1);

  await page
    .getByRole("button", {
      name: /Segunda Participante.*Como escolher indicadores/,
    })
    .click();
  await expect(
    page.getByText("Aguardando a resposta de Segunda Participante.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Aceitar ·/ })).toHaveCount(0);
  await outra.reload();
  const atencao = outra.getByRole("region", {
    name: "O que merece sua atenção",
  });
  await expect(
    atencao.getByText("Você recebeu um convite", { exact: true }),
  ).toBeVisible();
  await atencao.getByRole("link", { name: /Primeira Participante/ }).click();
  await outra
    .getByRole("button", { name: /Aceitar ·/ })
    .nth(1)
    .click();
  const downloadPromise = outra.waitForEvent("download");
  await outra
    .getByRole("button", { name: "Adicionar ao meu calendário", exact: true })
    .click();
  const download = await downloadPromise;
  const arquivo = await download.path();
  expect(arquivo).not.toBeNull();
  const ics = await readFile(arquivo!, "utf8");
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).not.toContain("fictício");
  await expect(
    outra.getByRole("heading", { name: "Vinte minutos com intenção" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Suas anotações", { exact: true }),
  ).toBeVisible();
  const rotaEncontro = page.url();
  await page.context().clearCookies({ name: "entre_elas_access" });
  await page.reload();
  await expect(page).toHaveURL(rotaEncontro);
  await expect(
    page.getByLabel("Suas anotações", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Suas anotações", { exact: true })
    .fill("Aprendi a definir a decisão antes de escolher os indicadores.");
  await page
    .getByRole("button", { name: "Salvar minhas anotações", exact: true })
    .click();
  await outra
    .getByLabel("Suas anotações", { exact: true })
    .fill("Compartilhei como verificar a qualidade das fontes de dados.");
  await outra
    .getByRole("button", { name: "Salvar minhas anotações", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByLabel("Suas anotações", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Ou escreva uma síntese manual, para vocês revisarem")
    .fill(
      "Definir a decisão e conferir as fontes ajuda a escolher os indicadores.",
    );
  await page
    .getByRole("button", { name: "Concluir com síntese manual", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Autorizo publicar esta dica", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Publicar dica na rede", exact: true }),
  ).toBeDisabled();
  await outra.reload();
  await outra
    .getByRole("button", { name: "Autorizo publicar esta dica", exact: true })
    .click();
  await outra
    .getByRole("button", { name: "Publicar dica na rede", exact: true })
    .click();
  await expect(
    outra.getByText("Dica publicada com autorização das duas.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Saberes", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Saberes para levar adiante",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Como escolher indicadores para uma decisão?",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  expect(
    (
      await outra.request.post("/api/piloto/indicadores", { data: {} })
    ).status(),
  ).toBe(403);
  expect((await outra.request.get("/api/indicadores")).status()).toBe(403);
  const painel = await page.request.post("/api/piloto/indicadores", {
    data: {},
  });
  expect(painel.ok()).toBe(true);
  expect((await painel.json()).faiscas).toBe(1);
  const original = await (await page.request.get("/api/piloto")).json();
  const outroAparelho = await browser.newContext();
  const nova = await outroAparelho.newPage();
  await linkEntrada(nova, "primeira@banca.test");
  await expect(
    nova.getByRole("heading", { name: /Qual é a sua próxima Faísca/ }),
  ).toBeVisible();
  const restaurado = await (await nova.request.get("/api/piloto")).json();
  expect(restaurado.perfil.id).toBe(original.perfil.id);
  expect(
    restaurado.faiscas.some(
      (f: { id: string }) => f.id === original.faiscas[0].id,
    ),
  ).toBe(true);
  await nova.context().clearCookies({ name: "entre_elas_access" });
  await nova.reload();
  await expect(
    nova.getByRole("heading", { name: /Qual é a sua próxima Faísca/ }),
  ).toBeVisible();
  await outroAparelho.close();
  await ctx.close();
});
test("sessão não verificada, identidade demo e liderança não autorizada ficam bloqueadas", async ({
  page,
}) => {
  await page.goto("/piloto");
  await expect(page).toHaveURL(/\/entrar/);
  expect(
    (
      await page.request.post("/api/dev/entrar-como", {
        data: { profile_id: "00000000-0000-4000-8000-000000000001" },
      })
    ).status(),
  ).toBe(404);
  expect((await page.request.get("/api/piloto")).status()).toBe(401);
  await page.context().addCookies([
    {
      name: "entre_elas_access",
      value: "token-forjado",
      url: "http://127.0.0.1:3400",
    },
  ]);
  expect((await page.request.get("/api/faiscas")).status()).toBe(401);
});

test("curadoria não mantém indicações de um pedido que foi editado", async ({
  page,
}) => {
  await entrar(page, "terceira@banca.test", "Terceira Participante");
  await page.getByRole("button", { name: "Meu perfil", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Autorizo esse uso dos meus textos nesta experiência.",
    })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Autorizo esse uso dos meus textos nesta experiência.",
    }),
  ).toBeChecked();
  await expect(
    page.getByRole("region", { name: "Seu perfil na busca com IA" }),
  ).toContainText("0 de 1 saberes indexados");
  await page.getByRole("button", { name: "Faíscas", exact: true }).click();
  const d = await (await page.request.get("/api/piloto")).json();
  const pessoa = d.pessoas.find((p: { id: string }) => p.id !== d.perfil.id);
  let liberar!: () => void;
  const espera = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route("**/api/faiscas/buscar", async (route) => {
    await espera;
    await route.fulfill({
      json: [
        {
          profile_id: pessoa.id,
          motivo: "Indicação do pedido anterior",
          evidencias: ["Experiência anterior"],
        },
      ],
    });
  });
  await page
    .getByLabel("O que você quer aprender?", { exact: true })
    .fill("Quero aprender indicadores");
  const iniciou = page.waitForRequest("**/api/faiscas/buscar");
  await page
    .getByRole("button", { name: "Encontrar conexões com IA", exact: true })
    .click();
  await iniciou;
  await page
    .getByLabel("O que você quer aprender?", { exact: true })
    .fill("Agora quero conversar sobre carreira");
  liberar();
  await expect(
    page.getByRole("button", {
      name: "Encontrar conexões com IA",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    page.getByText("Indicação do pedido anterior", { exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/faiscas/buscar");
  await page.route("**/api/faiscas/buscar", (route) =>
    route.fulfill({ json: [] }),
  );
  await page
    .getByRole("button", { name: "Encontrar conexões com IA", exact: true })
    .click();
  await expect(
    page.getByText(/Ainda não encontramos uma indicação/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Trabalhar com dados", exact: true })
    .click();
  await expect(
    page.getByLabel("O que você quer aprender?", { exact: true }),
  ).toHaveValue(/três indicadores/);
  await expect(
    page.getByText(/Ainda não encontramos uma indicação/),
  ).toHaveCount(0);
});

test("relato persiste, fica privado e a liderança acompanha a resolução", async ({
  page,
  browser,
}) => {
  await entrar(page, "ajuda@banca.test", "Participante Ajuda");
  await page.getByRole("button", { name: "Ajuda", exact: true }).click();
  const descricao =
    "Não consegui encontrar uma conexão para conversar sobre indicadores.";
  await page
    .getByLabel("O que aconteceu e o que você esperava?", { exact: true })
    .fill(descricao);
  await page
    .getByRole("button", { name: "Salvar relato", exact: true })
    .click();
  const relatos = page.getByRole("region", {
    name: "Acompanhamento dos relatos",
  });
  await expect(relatos.getByText(descricao, { exact: true })).toBeVisible();
  await page.reload();
  await expect(relatos.getByText(descricao, { exact: true })).toBeVisible();
  const dados = await (
    await page.request.post("/api/piloto/relatos", { data: {} })
  ).json();
  expect(
    (
      await page.request.post("/api/piloto/resolver-relato", {
        data: { relato_id: dados[0].id, resolvido: true },
      })
    ).status(),
  ).toBe(403);
  const contexto = await browser.newContext();
  const lider = await contexto.newPage();
  await linkEntrada(lider, "primeira@banca.test");
  const contaLider = await (await lider.request.get("/api/piloto")).json();
  if (!contaLider.conta.onboarding)
    await preencherPerfil(lider, "Liderança de Teste");
  await lider.getByRole("button", { name: "Ajuda", exact: true }).click();
  const acompanhamento = lider.getByRole("region", {
    name: "Acompanhamento dos relatos",
  });
  await expect(
    acompanhamento.getByText(descricao, { exact: true }),
  ).toBeVisible();
  await acompanhamento
    .getByRole("button", { name: "Marcar como resolvido", exact: true })
    .click();
  await expect(
    acompanhamento.getByRole("heading", { name: /Curadoria e IA · Resolvido/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    relatos.getByRole("heading", { name: /Curadoria e IA · Resolvido/ }),
  ).toBeVisible();
  await contexto.close();
});

test("entrar não cria uma conta nova e cadastro é uma escolha explícita", async ({
  page,
}) => {
  await page.goto("/entrar");
  await expect(
    page.getByRole("button", { name: "Já tenho conta", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByLabel("Seu e-mail", { exact: true })
    .fill("nao-cadastrada@banca.test");
  await page
    .getByRole("button", { name: "Esqueceu a senha ou prefere link por e-mail?", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("escolha Criar conta");
  const antes = await (
    await page.request.get(
      "http://127.0.0.1:54322/test-link?email=nao-cadastrada%40banca.test",
    )
  ).json();
  expect(antes.url).toBeNull();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByLabel("Seu e-mail", { exact: true })).toHaveValue(
    "nao-cadastrada@banca.test",
  );
  await page
    .getByRole("button", { name: "Prefere receber link de confirmação por e-mail?", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Link enviado");
  const depois = await (
    await page.request.get(
      "http://127.0.0.1:54322/test-link?email=nao-cadastrada%40banca.test",
    )
  ).json();
  expect(depois.url).toContain("/auth/callback?code=");
});

test.afterAll(async () => {
  await fetch("http://127.0.0.1:54322/test-cleanup");
});
