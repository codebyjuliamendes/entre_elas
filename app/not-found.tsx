import Link from "next/link";
import { Compass } from "lucide-react";
export default function NotFound() {
  return (
    <main className="standalone-state">
      <Compass size={40} />
      <h1>
        Esse caminho ainda
        <br />
        não está na nossa rede.
      </h1>
      <p>Explore uma nova conexão ou volte para o seu espaço.</p>
      <Link href="/rede" className="button button-primary">
        Explorar a rede
      </Link>
      <Link href="/" className="button button-secondary">
        Voltar ao início
      </Link>
    </main>
  );
}
