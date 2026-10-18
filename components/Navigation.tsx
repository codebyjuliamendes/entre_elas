"use client";
import Link from "next/link";
import { Marca } from "./Marca";
import { usePathname } from "next/navigation";
import {
  House,
  UsersRound,
  Library,
  CalendarDays,
  MessageCircle,
  HeartHandshake,
  Settings,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { ana } from "@/lib/demo/catalogo";
const itens = [
  { href: "/", label: "Início", icon: House },
  { href: "/rede", label: "Explore a rede", icon: UsersRound },
  { href: "/saberes", label: "Biblioteca de saberes", icon: Library },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/chats", label: "Chats", icon: MessageCircle },
  { href: "/comunidades", label: "Comunidades", icon: HeartHandshake },
];
export function Navigation() {
  const pathname = usePathname();
  return (
    <aside className="workspace-sidebar">
      <Link href="/" className="sidebar-brand">
        <Marca />
      </Link>
      <div className="sidebar-intro">
        <span className="eyebrow">NOSSO ESPAÇO</span>
        <p>
          Conexões que fazem
          <br />o saber ir mais longe.
        </p>
      </div>
      <nav aria-label="Navegação do espaço">
        {itens.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={pathname === href ? "active" : ""}
          >
            <Icon size={19} />
            {label}
            {pathname === href && <span className="sidebar-dot" />}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/configuracoes" className="sidebar-settings">
          <Settings size={17} />
          Seu espaço e seus dados
        </Link>
        <Link href="/perfil" className="sidebar-profile">
          <Avatar nome={ana.nome} src={ana.avatar} size={38} />
          <span>
            <strong>Ana Ribeiro</strong>
            <small>Operações · Sul</small>
          </span>
        </Link>
        <small className="sidebar-demo">Ambiente de demonstração</small>
      </div>
    </aside>
  );
}
