import { beforeEach, describe, expect, it, vi } from "vitest";

const pid = "00000000-0000-4000-8000-000000000001";
const outra = "00000000-0000-4000-8000-000000000002";
const authId = "00000000-0000-4000-8000-0000000000aa";
const tabelas: Record<string, unknown> = {};
const rpc = vi.fn();
const deleteUser = vi.fn();
const apagados: string[] = [];

// Consulta encadeável que devolve as linhas da tabela pedida.
function consulta(tabela: string) {
  const resultado = { data: tabelas[tabela] ?? [], error: null };
  const q = {
    select: () => q,
    eq: () => q,
    or: () => q,
    single: () => Promise.resolve({ ...resultado, data: (resultado.data as unknown[])[0] ?? null }),
    then: (ok: (r: typeof resultado) => unknown) => Promise.resolve(resultado).then(ok),
  };
  return q;
}
vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ from: consulta, rpc, auth: { admin: { deleteUser } } }),
  verificarErro: (e: { message: string } | null) => {
    if (e) throw new Error(e.message);
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ delete: (nome: string) => apagados.push(nome) }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  apagados.length = 0;
  for (const k of Object.keys(tabelas)) delete tabelas[k];
});

describe("Seus dados (LGPD)", () => {
  it("a cópia traz só a anotação da própria participante", async () => {
    tabelas.profiles = [{ id: pid, nome: "Ana" }];
    tabelas.piloto_contas = [{ onboarding: true }];
    tabelas.faiscas = [
      { id: "f1", solicitante_id: pid, convidada_id: outra, anotacoes: { [pid]: "minha nota", [outra]: "nota da colega" } },
      { id: "f2", solicitante_id: outra, convidada_id: pid, anotacoes: {} },
    ];
    const { exportarDados } = await import("@/lib/piloto/conta");
    const copia = await exportarDados(pid, "ana@empresa.com");
    expect(copia.aplicativo).toBe("Tecida");
    expect(copia.faiscas).toEqual([
      expect.objectContaining({ id: "f1", papel: "solicitante", minha_anotacao: "minha nota" }),
      expect.objectContaining({ id: "f2", papel: "convidada", minha_anotacao: null }),
    ]);
    expect(JSON.stringify(copia)).not.toContain("nota da colega");
  });

  it("só exclui com a confirmação digitada", async () => {
    const { excluirConta } = await import("@/lib/piloto/conta");
    await expect(excluirConta(pid, { confirmacao: "sim" })).rejects.toThrow();
    await expect(excluirConta(pid, {})).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("exclui no banco, apaga o login e encerra a sessão", async () => {
    rpc.mockResolvedValue({ data: { ok: true, auth_user_id: authId }, error: null });
    deleteUser.mockResolvedValue({ error: null });
    const { excluirConta } = await import("@/lib/piloto/conta");
    await expect(excluirConta(pid, { confirmacao: " excluir " })).resolves.toEqual({ ok: true, login_removido: true });
    expect(rpc).toHaveBeenCalledWith("piloto_excluir_conta", { usuaria_id: pid });
    expect(deleteUser).toHaveBeenCalledWith(authId);
    expect(apagados).toEqual(["entre_elas_access", "entre_elas_refresh"]);
  });

  it("se o banco falhar, nada é apagado e o login continua", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "falha" } });
    const { excluirConta } = await import("@/lib/piloto/conta");
    await expect(excluirConta(pid, { confirmacao: "EXCLUIR" })).rejects.toThrow("Nada foi apagado");
    expect(deleteUser).not.toHaveBeenCalled();
    expect(apagados).toEqual([]);
  });
});
