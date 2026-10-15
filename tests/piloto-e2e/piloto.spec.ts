import { test, expect, type Page } from "@playwright/test";
async function linkEntrada(page: Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("Seu e-mail", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Receber link de entrada", exact: true })
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
  await linkEntrada(page, email);
  await page.getByRole("button", { name: "Entendi, vamos continuar" }).click();
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
  await entrar(outra, "segunda@banca.test", "Segunda Participante");
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
    .getByRole("button", { name: "Enviar convite", exact: true })
    .click();
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
  await outra
    .getByRole("button", {
      name: /Primeira Participante.*Como escolher indicadores/,
    })
    .click();
  await outra.getByRole("button", { name: /Aceitar ·/ }).click();
  await expect(
    outra.getByRole("heading", { name: "Vinte minutos com intenção" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", {
      name: /Segunda Participante.*Como escolher indicadores/,
    })
    .click();
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
  await page
    .getByRole("button", {
      name: /Segunda Participante.*Como escolher indicadores/,
    })
    .click();
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
    .getByRole("button", {
      name: /Primeira Participante.*Como escolher indicadores/,
    })
    .click();
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
      name: "Como escolher indicadores para uma decisão?",
      exact: true,
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

test.afterAll(async () => {
  await fetch("http://127.0.0.1:54322/test-cleanup");
});
