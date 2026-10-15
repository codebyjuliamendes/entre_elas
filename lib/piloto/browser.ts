let renovacao: Promise<boolean> | undefined;
async function requisitar(url: string, init: RequestInit, timeout = 30000) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new Error(
        "O servidor demorou para confirmar. Confira seus dados antes de repetir a ação.",
      );
    throw new Error(
      "Sem conexão. Seus dados já salvos continuam no servidor. Tente novamente quando a conexão voltar.",
    );
  }
}
async function renovarSessao() {
  if (!renovacao) {
    renovacao = requisitar(
      "/api/auth/renovar",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
      15000,
    )
      .then((r) => {
        if (r.status === 401 || r.status === 403) return false;
        if (!r.ok)
          throw new Error(
            "Não foi possível renovar a sessão agora. Tente novamente em instantes.",
          );
        return true;
      })
      .finally(() => {
        renovacao = undefined;
      });
  }
  return renovacao;
}
export async function api<T>(
  url: string,
  dados?: unknown,
  renovar = true,
): Promise<T> {
  const r = await requisitar(
    url,
    {
      method: dados === undefined ? "GET" : "POST",
      headers:
        dados === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: dados === undefined ? undefined : JSON.stringify(dados),
      cache: "no-store",
    },
    dados === undefined ? 30000 : 90000,
  );
  if (r.status === 401) {
    if (renovar && (await renovarSessao())) return api(url, dados, false);
    window.dispatchEvent(new Event("piloto:login"));
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }
  let body: unknown;
  try {
    body = await r.json();
  } catch {
    throw new Error(
      "Não conseguimos confirmar a resposta do servidor. Confira seus dados antes de repetir a ação.",
    );
  }
  if (!r.ok) {
    const mensagem =
      typeof body === "object" &&
      body !== null &&
      "erro" in body &&
      typeof body.erro === "string"
        ? body.erro
        : "Não foi possível concluir. Tente novamente.";
    throw new Error(mensagem);
  }
  return body as T;
}
export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
