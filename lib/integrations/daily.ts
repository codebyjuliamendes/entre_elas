import { z } from "zod";
import { id } from "@/lib/schemas/entities";
import { variavel } from "@/lib/config";
import { ErroIntegracao } from "@/lib/domain/erros";
async function request(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Response> {
  return fetch(`https://api.daily.co/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${variavel("DAILY_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
}
export async function criarSala(entrada: unknown) {
  const input = z
    .object({ faisca_id: id, horario: z.iso.datetime({ offset: true }) })
    .parse(entrada);
  const nome = `faisca-${input.faisca_id}`;
  let r = await request(`rooms/${nome}`);
  if (r.status === 404)
    r = await request("rooms", "POST", {
      name: nome,
      privacy: "private",
      properties: {
        exp:
          Math.floor(Math.max(Date.now(), Date.parse(input.horario)) / 1000) +
          3600,
        eject_at_room_exp: true,
      },
    });
  if (!r.ok) throw new ErroIntegracao(`Daily respondeu HTTP ${r.status}.`);
  return z.object({ url: z.url() }).parse(await r.json()).url;
}
export async function tokenSala(entrada: unknown) {
  const input = z.object({ faisca_id: id, profile_id: id }).parse(entrada);
  const r = await request("meeting-tokens", "POST", {
    properties: {
      room_name: `faisca-${input.faisca_id}`,
      user_id: input.profile_id,
      exp:
        Math.floor(Date.now() / 1000) +
        (process.env.APP_MODE === "piloto" ? 300 : 3600),
    },
  });
  if (!r.ok) throw new ErroIntegracao(`Daily respondeu HTTP ${r.status}.`);
  return z.object({ token: z.string() }).parse(await r.json()).token;
}

export async function encerrarSala(entrada: unknown) {
  const fid = id.parse(entrada);
  const r = await request(`rooms/faisca-${fid}`, "DELETE");
  if (!r.ok && r.status !== 404)
    throw new ErroIntegracao("Não foi possível encerrar a sala Daily.");
  return true;
}
