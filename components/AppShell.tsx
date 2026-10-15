"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Bell, Sparkles, ArrowUpRight } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Avatar } from "./Avatar";
import { ana } from "@/lib/demo/catalogo";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
export function AppShell({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState(false);
  return (
    <>
      <div className="desktop-note" aria-hidden="true">
        <span className="desktop-wordmark">
          <Sparkles size={20} /> entre elas
        </span>
        <span>
          Quando uma cresce,
          <br />a rede inteira floresce.
        </span>
      </div>
      <div className="app-frame">
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="app-header">
          <Link href="/" className="wordmark" aria-label="Entre Elas — início">
            <span className="brand-icon">
              <Sparkles size={21} fill="currentColor" />
            </span>
            <span>
              entre<span className="brand-light">elas</span>
              <i />
            </span>
          </Link>
          <div className="header-actions">
            <button
              className="notification-button"
              aria-label="Abrir notificações"
              onClick={() => setNotificacoes(true)}
            >
              <Bell size={21} />
              <span className="notification-dot" />
            </button>
            <Link href="/perfil" aria-label="Meu perfil">
              <Avatar nome={ana.nome} src={ana.avatar} size={38} />
            </Link>
          </div>
        </header>
        <main id="conteudo" className="app-content">
          {children}
        </main>
        <footer className="demo-footnote">
          Apresentação interativa · pessoas e dados fictícios
        </footer>
        <BottomNav />
      </div>
      <div className="desktop-caption" aria-hidden="true">
        Uma iniciativa para conectar
        <br />
        <strong>mulheres que movem a energia.</strong>
        <ArrowUpRight size={18} />
      </div>
      <Dialog open={notificacoes} onOpenChange={setNotificacoes}>
        <DialogContent>
          <span className="eyebrow">Sua rede está viva</span>
          <DialogTitle>Novas conexões por aqui</DialogTitle>
          <DialogDescription>
            Notificações fictícias da apresentação.
          </DialogDescription>
          <Link
            href="/comunidades"
            className="notice-card"
            onClick={() => setNotificacoes(false)}
          >
            <span className="icon-tile mint">
              <UsersRoundIcon />
            </span>
            <span>
              <strong>Uma conversa está começando</strong>
              <small>Mulheres na Tecnologia · agora</small>
              <p>Qual foi o melhor conselho que você recebeu na carreira?</p>
            </span>
          </Link>
          <Link
            href="/agenda"
            className="notice-card"
            onClick={() => setNotificacoes(false)}
          >
            <span className="icon-tile lilac">
              <Sparkles size={20} />
            </span>
            <span>
              <strong>Reserve um tempo para você</strong>
              <small>Encontro: Mulheres que abrem caminhos</small>
            </span>
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
function UsersRoundIcon() {
  return <span aria-hidden="true">✳</span>;
}
