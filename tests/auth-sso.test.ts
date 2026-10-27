import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const signInWithOAuth = vi.fn();
const definidos: Record<string, string> = {};
vi.mock("@/lib/auth/pkce", () => ({ clientePkce: async () => ({ auth: { signInWithOAuth } }) }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: (k: string, v: string) => (definidos[k] = v) }),
}));
beforeEach(() => {
  vi.stubEnv("APP_MODE", "piloto");
  vi.stubEnv("APP_URL", "https://tecida.test");
  signInWithOAuth.mockReset().mockResolvedValue({ data: { url: "https://login.microsoftonline.com/x" }, error: null });
  for (const k of Object.keys(definidos)) delete definidos[k];
});
afterEach(() => vi.unstubAllEnvs());
const chamar = async (qs: string) => {
  const { GET } = await import("@/app/api/auth/sso/route");
  return GET(new Request("https://tecida.test/api/auth/sso?" + qs));
};
describe("Login corporativo", () => {
  it("fica desligado sem configuração", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGIN_SSO", "");
    const r = await chamar("provedor=azure");
    expect(r.headers.get("location")).toBe("https://tecida.test/entrar?erro=link");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });
  it("só aceita provedores ligados na instalação", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGIN_SSO", "google");
    expect((await chamar("provedor=azure")).headers.get("location")).toContain("erro=link");
    expect((await chamar("provedor=github")).headers.get("location")).toContain("erro=link");
  });
  it("leva à Microsoft pedindo e-mail e volta pelo callback", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGIN_SSO", "azure,google");
    const r = await chamar("provedor=azure&retorno=%2Fpiloto%3Faba%3Dperfil");
    expect(r.headers.get("location")).toBe("https://login.microsoftonline.com/x");
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: { redirectTo: "https://tecida.test/auth/callback", skipBrowserRedirect: true, scopes: "email" },
    });
    expect(Object.values(definidos)).toContain("/piloto?aba=perfil");
  });
  it("não segue retorno para fora do app", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGIN_SSO", "google");
    await chamar("provedor=google&retorno=https%3A%2F%2Fmal.example");
    expect(Object.values(definidos).some((v) => v.includes("mal.example"))).toBe(false);
  });
});
