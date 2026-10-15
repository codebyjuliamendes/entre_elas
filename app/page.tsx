import { AppShell } from "@/components/AppShell";
import { Journey } from "@/components/demo/Journey";
export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<{ retomar?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <Journey retomar={!!params.retomar} />
    </AppShell>
  );
}
