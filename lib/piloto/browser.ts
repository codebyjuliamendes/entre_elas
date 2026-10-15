export async function api<T>(
  url: string,
  dados?: unknown,
  renovar = true,
): Promise<T> {
  const r = await fetch(url, {
    method: dados === undefined ? "GET" : "POST",
    headers:
      dados === undefined ? undefined : { "Content-Type": "application/json" },
    body: dados === undefined ? undefined : JSON.stringify(dados),
    cache: "no-store",
  });
  if (r.status === 401 && renovar) {
    const refresh = await fetch("/api/auth/renovar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (refresh.ok) return api(url, dados, false);
    window.dispatchEvent(new Event("piloto:login"));
    throw new Error("Entre novamente.");
  }
  const body = await r.json();
  if (!r.ok)
    throw new Error(body.erro ?? "Não foi possível concluir. Tente novamente.");
  return body as T;
}
export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
