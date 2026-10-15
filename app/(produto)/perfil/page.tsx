import { ProfileScreen } from "@/components/demo/ProfileScreen";
export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{ usuaria?: string }>;
}) {
  const params = await searchParams;
  return <ProfileScreen slug={params.usuaria} />;
}
