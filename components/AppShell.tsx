"use client";
import { IconeFaisca } from "@/components/Marca";
import Link from "next/link";
import { Marca } from "./Marca";
import { useState, type ReactNode } from "react";
import {
  Bell,
  ArrowUpRight,
  Settings,
  WifiOff,
  TriangleAlert,
} from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Avatar } from "./Avatar";
import { ana } from "@/lib/demo/catalogo";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Navigation } from "./Navigation";
import { SearchDialog } from "./SearchDialog";
import { useDemo, useAvisoLocal, marcarNotificacoes } from "@/lib/demo/store";
import { useOnline } from "@/lib/browser/conexao";
export function AppShell({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState(false);
  const state = useDemo();
  const aviso = useAvisoLocal();
  const online = useOnline();
  const ids = [
    "boas-vindas",
    ...state.convites.map((c) => "encontro-" + c.id),
    ...state.publicacoes.map((p) => "saber-" + p.id),
  ];
  const naoLidas = ids.some((id) => !state.notificacoes_lidas.includes(id));
  return (
    <>
      <Navigation />
      <div className="desktop-note" aria-hidden="true">
        <span className="desktop-wordmark">
          <Marca />
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
          <Link href="/" className="wordmark" aria-label="Tecida, início">
            <Marca />
          </Link>
          <SearchDialog />
          <div className="header-actions">
            <Link
              href="/configuracoes"
              className="header-settings"
              aria-label="Configurações do meu espaço"
            >
              <Settings size={20} />
            </Link>
            <button
              className="notification-button"
              aria-label="Abrir notificações"
              onClick={() => {
                setNotificacoes(true);
                marcarNotificacoes(ids);
              }}
            >
              <Bell size={21} />
              {naoLidas && <span className="notification-dot" />}
            </button>
            <Link href="/perfil" aria-label="Meu perfil">
              <Avatar nome={ana.nome} src={ana.avatar} size={38} />
            </Link>
          </div>
        </header>
        <div className="environment-strip">
          <span className="status-dot" />
          Espaço de demonstração
          <span>
            {aviso
              ? "Progresso nesta sessão"
              : "Progresso salvo neste dispositivo"}
          </span>
        </div>
        {!online && (
          <p className="app-alert" role="status">
            <WifiOff size={15} />
            Sem conexão. As etapas de apresentação continuam usando exemplos
            locais.
          </p>
        )}
        {aviso && (
          <p className="app-alert" role="status">
            <TriangleAlert size={15} />
            {aviso}
            <Link href="/configuracoes">Gerenciar dados</Link>
          </p>
        )}
        <main id="conteudo" className="app-content">
          {children}
        </main>
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
          {state.convites
            .slice(-3)
            .reverse()
            .map((c) => (
              <Link
                key={c.id}
                href="/agenda"
                className="notice-card"
                onClick={() => setNotificacoes(false)}
              >
                <span className="icon-tile lilac">
                  <IconeFaisca size={20} />
                </span>
                <span>
                  <strong>
                    {c.status === "realizada"
                      ? "Uma troca que virou aprendizado"
                      : c.status === "cancelada"
                        ? "Encontro cancelado"
                        : "Você tem uma Faísca combinada"}
                  </strong>
                  <small>{c.tema}</small>
                </span>
              </Link>
            ))}
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
              <IconeFaisca size={20} />
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
