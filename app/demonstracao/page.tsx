import { Suspense } from "react";
import type { Metadata } from "next";
import { Demonstracao } from "@/components/piloto/Demonstracao";

export const metadata: Metadata = {
  title: "Demonstração · Tecida",
  description:
    "Conheça a Tecida sem cadastro, com uma rede fictícia de colaboradoras.",
};

export default function Page() {
  return (
    <Suspense fallback={<p>Preparando a demonstração…</p>}>
      <Demonstracao />
    </Suspense>
  );
}
