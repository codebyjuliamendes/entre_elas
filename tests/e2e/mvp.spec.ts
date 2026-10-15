import { test, expect } from "@playwright/test";
test("ciclo completo sem chaves: consentimento, quiz e reconhecimento persistente", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Bom te ver/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Apresentar um projeto", exact: true })
    .click();
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
  await expect(page.locator(".agenda-question")).toHaveCount(3);
  await page.getByRole("button", { name: "Iniciar videochamada" }).click();
  await expect(
    page.getByRole("region", { name: "Videochamada simulada" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Desativar microfone" }).click();
  await expect(
    page.getByRole("button", { name: "Ativar microfone" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Desativar câmera" }).click();
  await page.getByRole("button", { name: "Encerrar encontro" }).click();
  await page
    .getByLabel("Qual aprendizado você quer levar adiante?")
    .fill(
      "Aprendi com a Carla que uma apresentação à diretoria precisa de objetivo claro, indicadores e uma decisão esperada.",
    );
  await page.getByRole("button", { name: "Sintetizar com IA" }).click();
  const publicar = page.getByRole("button", {
    name: "Publicar no perfil de Carla",
    exact: true,
  });
  await expect(publicar).toBeDisabled();
  const perguntas = page.getByRole("group");
  await expect(perguntas).toHaveCount(3);
  await perguntas.nth(0).getByRole("button").nth(1).click();
  await perguntas.nth(1).getByRole("button").nth(0).click();
  await perguntas.nth(2).getByRole("button").nth(2).click();
  await page.getByRole("button", { name: "Conferir minhas respostas" }).click();
  await expect(
    page.getByText("Você acertou 3 de 3.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /Eu, Ana, autorizo/ }).check();
  await expect(publicar).toBeDisabled();
  await page
    .getByRole("button", { name: "Simular autorização de Carla", exact: true })
    .click();
  await expect(publicar).toBeEnabled();
  await publicar.click();
  await expect(
    page.getByText(
      "Publicado! O saber de Carla ganhou reconhecimento nesta demo.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Ver perfil de Carla", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Apresentações com propósito",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Apresentações com propósito",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("navegação, comunidades, chats e edição de perfil funcionam no mobile", async ({
  page,
}) => {
  await page.goto("/comunidades");
  await page.getByLabel("Buscar comunidades").fill("Tecnologia");
  await page.getByRole("button", { name: "Fazer parte", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Participando", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Buscar comunidades").fill("Tecnologia");
  await expect(
    page.getByRole("button", { name: "Participando", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Chats", exact: true }).click();
  await page.getByRole("button", { name: /Carla Souza/ }).click();
  await page
    .getByLabel("Sua mensagem fictícia")
    .fill("Olá, Carla! Vamos falar sobre apresentações?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText("Olá, Carla!");
  await expect(page.getByRole("log")).toContainText("Adorei sua ideia!");
  await page.getByRole("link", { name: "Agenda", exact: true }).click();
  await page.getByRole("tab", { name: "Faíscas", exact: true }).click();
  await expect(
    page.getByText("Um espaço para uma nova conexão", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Eventos", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver encontro", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Quero participar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Presença confirmada", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Perfil", exact: true }).click();
  await page
    .getByRole("button", { name: "Editar perfil", exact: true })
    .click();
  await page
    .getByLabel("Minha história")
    .fill("Adoro aprender e compartilhar experiências fictícias.");
  await page.getByRole("button", { name: "Salvar meu perfil" }).click();
  await expect(
    page.getByText("Adoro aprender e compartilhar experiências fictícias.", {
      exact: true,
    }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
test("jornada retoma após navegação e outra candidata respeita o pedido", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Descomplicar os dados", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Encontrar minha Faísca", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Daniela Costa", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Buscar outra conexão" }).click();
  await expect(
    page.getByRole("heading", { name: "Carla Souza", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Perfil", exact: true }).click();
  await page.getByRole("link", { name: "Início", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Carla Souza", exact: true }),
  ).toBeVisible();
});
test("layout desktop mantém o aplicativo em 430 px e navegação acessível", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const frame = await page.locator(".app-frame").boundingBox();
  expect(frame?.width).toBe(430);
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Encontrar minha Faísca", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "/tmp/entre-elas-desktop.png",
    fullPage: true,
  });
});
