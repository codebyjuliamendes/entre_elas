import { pilotoAtivo } from "@/lib/piloto/config";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
export const dynamic = "force-dynamic";
export default function ProdutoLayout({ children }: { children: ReactNode }) {
  if (pilotoAtivo()) redirect("/piloto");
  return <AppShell>{children}</AppShell>;
}
