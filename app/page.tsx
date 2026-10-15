import { pilotoAtivo } from "@/lib/piloto/config";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Journey } from "@/components/demo/Journey";
export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<{ retomar?: string }>;
}) {
  if (pilotoAtivo()) redirect("/piloto");
  const params = await searchParams;
  return (
    <AppShell>
      <Journey retomar={!!params.retomar} />
    </AppShell>
  );
}
