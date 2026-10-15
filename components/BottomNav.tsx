"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CalendarDays,
  MessageCircle,
  UsersRound,
  UserRound,
} from "lucide-react";
const items = [
  { href: "/", label: "Início", icon: House },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/chats", label: "Chats", icon: MessageCircle },
  { href: "/comunidades", label: "Comunidades", icon: UsersRound },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={`nav-item ${pathname === href ? "is-active" : ""}`}
        >
          <span className="nav-icon">
            <Icon size={21} strokeWidth={pathname === href ? 2.2 : 1.7} />
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
