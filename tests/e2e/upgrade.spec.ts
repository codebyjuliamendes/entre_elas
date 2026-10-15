import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("descoberta por competência, filtros e busca global", async ({ page }) => {
  await page.goto("/rede");
  await expect(
    page.getByRole("heading", { name: "Gabriela Rocha", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar pessoas e saberes").fill("automacao");
  await expect(
    page.getByRole("heading", { name: "Helena Martins", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Carla Souza", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Limpar", exact: true }).click();
  await page.getByLabel("Filtrar por área").selectOption("Dados");
  await expect(
    page.getByRole("heading", { name: "Daniela Costa", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Buscar na rede", exact: true })
    .click();
  await page.getByLabel("Busca global").fill("mentoria");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Gabriela Rocha/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gabriela Rocha", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Quero uma Faísca com Gabriela", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Convidar para um café (20 min)" }),
  ).toBeVisible();
});
test("comunidade permite publicar, comentar e persistir após recarregar", async ({
  page,
}) => {
  await page.goto("/comunidades");
  await page.getByLabel("Buscar comunidades").fill("Tecnologia");
  await page.getByRole("button", { name: "Fazer parte", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver a comunidade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compartilhar uma experiência" })
    .click();
  await page
    .getByLabel("Título da publicação")
    .fill("Um aprendizado que virou prática");
  await page
    .getByLabel("O que você quer compartilhar?")
    .fill(
      "Em um exercício fictício, organizei os indicadores antes de montar a apresentação.",
    );
  await page
    .getByRole("button", { name: "Publicar na comunidade", exact: true })
    .click();
  const post = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Um aprendizado que virou prática",
        exact: true,
      }),
    });
  await expect(post).toBeVisible();
  await post
    .getByRole("button", { name: "Comentários (0)", exact: true })
    .click();
  await post
    .getByLabel("Seu comentário", { exact: true })
    .fill("Essa experiência fictícia pode ajudar a nossa equipe.");
  await post
    .getByRole("button", { name: "Enviar comentário", exact: true })
    .click();
  await expect(post).toContainText(
    "Essa experiência fictícia pode ajudar a nossa equipe.",
  );
  await post.getByRole("button", { name: /Curtir publicação:/ }).click();
  await page.reload();
  await page.getByLabel("Buscar comunidades").fill("Tecnologia");
  await page
    .getByRole("button", { name: "Ver a comunidade", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Um aprendizado que virou prática",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Um aprendizado que virou prática",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Comentários (1)", exact: true })
    .click();
  await expect(
    page.getByText("Essa experiência fictícia pode ajudar a nossa equipe.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("biblioteca salva dica por identidade e mantém favorito", async ({
  page,
}) => {
  await page.goto("/saberes");
  await page.getByLabel("Buscar dicas e saberes").fill("slides");
  await page
    .getByRole("button", {
      name: "Salvar dica: Antes dos slides, escolha a decisão",
      exact: true,
    })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /Meus salvos/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Antes dos slides, escolha a decisão",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Antes dos slides, escolha a decisão",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "qual decisão precisa ser tomada",
  );
});
test("backup é exportável e arquivo inválido não apaga progresso", async ({
  page,
}) => {
  await page.goto("/perfil");
  await page
    .getByRole("button", { name: "Editar perfil", exact: true })
    .click();
  await page
    .getByLabel("Minha história")
    .fill("Minha bio fictícia preservada pelo backup.");
  await page
    .getByRole("button", { name: "Salvar meu perfil", exact: true })
    .click();
  await page.goto("/configuracoes");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar meu progresso", exact: true })
    .click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(backup.dados.versao).toBe(2);
  expect(backup.dados.perfil.bio).toBe(
    "Minha bio fictícia preservada pelo backup.",
  );
  await page
    .getByLabel("Arquivo de backup")
    .setInputFiles({
      name: "invalido.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ aplicativo: "Entre Elas", dados: { versao: 99 } }),
      ),
    });
  await page
    .getByRole("button", { name: "Confirmar importação", exact: true })
    .click();
  await expect(
    page.getByText(
      "O backup não é compatível. Seus dados atuais foram preservados.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.goto("/perfil");
  await expect(
    page.getByText("Minha bio fictícia preservada pelo backup.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("perda de rede durante a jornada usa exemplos locais", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Apresentar um projeto", exact: true })
    .click();
  await context.setOffline(true);
  try {
    await page
      .getByRole("button", { name: "Encontrar minha Faísca", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Carla Souza", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Exemplo de apresentação · conteúdo simulado", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Convidar para um café (20 min)" })
      .click();
    await page
      .getByRole("button", { name: "Simular aceite de Carla", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Convite aceito. Café combinado!" }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
test("PWA possui ícones e cache apenas de recursos públicos", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        async () => !!(await navigator.serviceWorker.getRegistration()),
      ),
    )
    .toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const manifesto = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(
    manifesto.icons.some((i: { sizes: string }) => i.sizes === "512x512"),
  ).toBe(true);
  const caminhos = await page.evaluate(async () => {
    const nomes = await caches.keys();
    const urls: string[] = [];
    for (const nome of nomes)
      for (const r of await (await caches.open(nome)).keys())
        urls.push(new URL(r.url).pathname);
    return urls;
  });
  expect(caminhos).toContain("/offline");
  expect(caminhos.some((p) => p.startsWith("/api/") || p === "/")).toBe(false);
});
