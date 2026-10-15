"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-state">
      <RefreshCw size={36} />
      <h1>Vamos tentar de novo?</h1>
      <p>
        Não foi possível completar essa etapa. Seu progresso salvo neste
        dispositivo continua disponível.
      </p>
      <button className="button button-primary" onClick={reset}>
        Tentar novamente
      </button>
      <Link href="/" className="button button-secondary">
        Voltar ao início
      </Link>
    </main>
  );
}
