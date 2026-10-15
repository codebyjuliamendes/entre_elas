import { rotaPiloto } from "@/lib/piloto/retorno";
import { redirect } from "next/navigation";
import { identidadePiloto } from "@/lib/auth/piloto";
import { pilotoAtivo } from "@/lib/piloto/config";
import { Piloto } from "@/components/piloto/Piloto";
import { ErroDominio } from "@/lib/domain/erros";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const retorno = rotaPiloto(await searchParams);
  if (!pilotoAtivo()) redirect("/");
  try {
    await identidadePiloto();
  } catch (error) {
    if (error instanceof ErroDominio && error.status === 401)
      redirect("/entrar?renovar=1&retorno=" + encodeURIComponent(retorno));
    throw error;
  }
  return <Piloto />;
}
