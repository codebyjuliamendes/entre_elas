"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Library,
  UsersRound,
  Sparkles,
  Coffee,
} from "lucide-react";
import { perfisDemo } from "@/lib/demo/catalogo";
import { useDemo } from "@/lib/demo/store";
import { Avatar } from "@/components/Avatar";
export function HomeNetwork() {
  const s = useDemo();
  return (
    <aside className="home-network">
      <div className="home-insights">
        <div>
          <span className="how-icon lilac">
            <Coffee size={17} />
          </span>
          <strong>
            {s.convites.filter((c) => c.status === "realizada").length}
          </strong>
          <small>Trocas realizadas</small>
        </div>
        <div>
          <span className="how-icon mint">
            <Sparkles size={17} />
          </span>
          <strong>{s.publicacoes.length}</strong>
          <small>Saberes compartilhados</small>
        </div>
      </div>
      <div className="section-heading">
        <h2>Experiências para somar</h2>
        <Link href="/rede" className="text-link">
          Explorar
          <ArrowUpRight size={13} />
        </Link>
      </div>
      {perfisDemo.slice(1, 4).map((p) => (
        <Link
          href={`/perfil?usuaria=${p.slug}`}
          className="network-person"
          key={p.id}
        >
          <Avatar nome={p.nome} src={p.avatar} size={45} />
          <div>
            <strong>{p.nome}</strong>
            <small>{p.cargo}</small>
            <span>{p.saberes[0]}</span>
          </div>
          <ArrowUpRight size={15} />
        </Link>
      ))}
      <Link href="/saberes" className="library-promo">
        <span className="icon-tile peach">
          <Library size={22} />
        </span>
        <div>
          <strong>Uma biblioteca feita de trocas</strong>
          <p>Ideias que podem fazer a diferença no seu próximo passo.</p>
        </div>
        <ArrowUpRight size={17} />
      </Link>
      <Link href="/rede" className="network-promo">
        <UsersRound size={18} />
        <span>
          <strong>O saber já está na rede.</strong>
          <small>Descubra perspectivas de outras áreas e regionais.</small>
        </span>
      </Link>
    </aside>
  );
}
