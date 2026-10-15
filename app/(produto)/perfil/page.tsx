import { ProfileScreen } from "@/components/demo/ProfileScreen";
import { notFound } from "next/navigation";
import { perfisDemo } from "@/lib/demo/catalogo";
export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{ usuaria?: string }>;
}) {
  const params = await searchParams;
  if (params.usuaria && !perfisDemo.some((p) => p.slug === params.usuaria))
    notFound();
  return <ProfileScreen slug={params.usuaria} />;
}
