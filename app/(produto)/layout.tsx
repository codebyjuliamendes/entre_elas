import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
export const dynamic = "force-dynamic";
export default function ProdutoLayout({ children }: { children: ReactNode }) {
  if (process.env.APP_MODE === "piloto") redirect("/piloto");
  return <AppShell>{children}</AppShell>;
}
