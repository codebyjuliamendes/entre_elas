import Link from "next/link";
import { WifiOff, Sparkles } from "lucide-react";
export const metadata = { title: "Sem conexão · Tecida" };
export default function Offline() {
  return (
    <main className="standalone-state">
      <span className="brand-icon">
        <Sparkles size={25} />
      </span>
      <WifiOff size={38} />
      <h1>
        Uma pausa na conexão.
        <br />O saber continua com você.
      </h1>
      <p>
        Seus dados de demonstração continuam neste dispositivo. Reconecte para
        abrir uma nova página. Se a jornada já estava aberta, você pode voltar a
        ela pelo navegador.
      </p>
      <Link href="/" className="button button-primary">
        Tentar novamente
      </Link>
    </main>
  );
}
