"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Avatar } from "./Avatar";
import { filtrarPessoas } from "@/lib/demo/descoberta";
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((x) => !x);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const pessoas = filtrarPessoas({ busca: texto }).slice(0, 4);
  return (
    <>
      <button
        className="global-search"
        aria-label="Buscar na rede"
        onClick={() => setOpen(true)}
      >
        <Search size={19} />
        <span>Buscar uma pessoa ou um saber</span>
        <kbd>⌘ K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Uma pergunta abre caminhos</DialogTitle>
          <DialogDescription>
            Busque pessoas e experiências da rede fictícia.
          </DialogDescription>
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Busca global"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nome, habilidade ou assunto"
            />
          </label>
          <div className="search-results">
            {pessoas.map((p) => (
              <Link
                href={`/perfil?usuaria=${p.slug}`}
                key={p.id}
                onClick={() => setOpen(false)}
              >
                <Avatar nome={p.nome} src={p.avatar} size={35} />
                <span>
                  <strong>{p.nome}</strong>
                  <small>{p.saberes[0]}</small>
                </span>
                <ArrowUpRight size={14} />
              </Link>
            ))}
            {!pessoas.length && (
              <p className="input-hint">
                Nenhuma pessoa com esses termos. Tente uma busca mais ampla.
              </p>
            )}
          </div>
          <Link
            href="/rede"
            className="text-link"
            onClick={() => setOpen(false)}
          >
            Explorar todas as conexões
            <ArrowUpRight size={13} />
          </Link>
          <Link
            href="/saberes"
            className="text-link"
            style={{ display: "flex", marginTop: 15 }}
            onClick={() => setOpen(false)}
          >
            Abrir a biblioteca de saberes
            <ArrowUpRight size={13} />
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
