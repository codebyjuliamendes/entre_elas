import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarClock,
  ChartNoAxesCombined,
  HeartHandshake,
  LockKeyhole,
  MessageSquareQuote,
  Search,
} from "lucide-react";
import { Marca, SimboloFaisca } from "@/components/Marca";
import { nomeProduto } from "@/lib/identidade";
import "./empresas.css";

export const metadata: Metadata = {
  title: `${nomeProduto} para empresas · Saber que conecta`,
  description:
    "Conecte as mulheres da sua empresa em conversas de 20 minutos, no expediente, com quem já viveu o desafio. A IA indica quem e explica por quê.",
};

// Contato configurável por ambiente para não expor e-mail pessoal no código.
function linkContato() {
  const email = process.env.CONTATO_EMAIL?.trim();
  if (!email) return null;
  const assunto = encodeURIComponent(`Quero conhecer a ${nomeProduto}`);
  return `mailto:${email}?subject=${assunto}`;
}

const passos = [
  {
    icone: Search,
    titulo: "Ela conta o que quer aprender",
    texto:
      "Em texto livre: “preciso apresentar um projeto para a diretoria e travo”.",
  },
  {
    icone: MessageSquareQuote,
    titulo: "A IA indica quem já viveu isso",
    texto:
      "Três colegas, cada uma com o motivo e a evidência real do perfil ou das trocas. Nada inventado.",
  },
  {
    icone: CalendarClock,
    titulo: "Uma Faísca de 20 minutos",
    texto:
      "Convite com horários no expediente, pauta pronta antes e chat e vídeo no próprio app.",
  },
  {
    icone: HeartHandshake,
    titulo: "O aprendizado fica na rede",
    texto:
      "O resumo vira dica para todas, mas só quando as duas autorizam.",
  },
];

const indicadores = [
  "Convites, taxa de aceite e Faíscas realizadas",
  "% de conexões entre áreas e regionais diferentes",
  "% de Faíscas no horário de trabalho",
  "Temas procurados que ninguém oferece",
  "Saberes que só uma pessoa tem",
];

export default function Empresas() {
  const contato = linkContato();
  return (
    <main className="lp">
      <header className="lp-topo">
        <Marca />
        <nav aria-label="Acesso">
          <Link href="/demonstracao">Demonstração</Link>
          <Link href="/entrar" className="lp-entrar">
            Entrar
          </Link>
        </nav>
      </header>

      <section className="lp-hero">
        <div>
          <span className="lp-selo">
            🥉 3º lugar no Hackathon Equatorial 2026 · EQT Lab
          </span>
          <h1>
            O que as suas colaboradoras sabem, <em>circulando</em>.
          </h1>
          <p>
            A {nomeProduto} conecta as mulheres da sua empresa para{" "}
            <strong>Faíscas</strong>: conversas de 20 minutos, no expediente,
            com quem já viveu o desafio. A IA indica com quem conversar e mostra
            por quê.
          </p>
          <div className="lp-acoes">
            {contato ? (
              <a className="lp-botao" href={contato}>
                Quero um piloto
              </a>
            ) : null}
            <Link
              className={contato ? "lp-botao lp-botao-sec" : "lp-botao"}
              href="/demonstracao"
            >
              Ver demonstração sem cadastro
            </Link>
          </div>
        </div>
        <figure className="lp-celular">
          <Image
            src="/empresas/indicacoes.webp"
            alt="Indicações da IA, cada uma com o motivo e a evidência"
            width={585}
            height={1266}
            priority
          />
          <figcaption>Telas do app com dados de exemplo.</figcaption>
        </figure>
      </section>

      <section className="lp-secao" aria-labelledby="lp-problema">
        <h2 id="lp-problema">O saber já existe na empresa. Ele só não circula.</h2>
        <div className="lp-cartoes">
          <article>
            <h3>Conhecimento invisível</h3>
            <p>
              O que se aprende em campo, em projetos e em situações difíceis
              não está em nenhum cadastro.
            </p>
          </article>
          <article>
            <h3>Distância entre áreas</h3>
            <p>
              Quem resolveria o desafio está em outra regional e as duas nem
              sabem que poderiam se ajudar.
            </p>
          </article>
          <article>
            <h3>Sem tempo para networking</h3>
            <p>
              Mães, mulheres que cuidam de familiares em casa: o happy hour
              depois do expediente não existe para elas.
            </p>
          </article>
        </div>
      </section>

      <section className="lp-secao" aria-labelledby="lp-como">
        <h2 id="lp-como">Como funciona</h2>
        <ol className="lp-passos">
          {passos.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo}>
              <span className="lp-passo-num" aria-hidden="true">
                <Icone size={20} />
              </span>
              <div>
                <h3>
                  <span className="sr-only">Passo {i + 1}: </span>
                  {titulo}
                </h3>
                <p>{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-secao lp-duas" aria-labelledby="lp-rh">
        <div>
          <span className="lp-rotulo">
            <ChartNoAxesCombined size={16} /> Para RH e liderança
          </span>
          <h2 id="lp-rh">Diversidade e desenvolvimento que dá para medir</h2>
          <p>
            Um painel restrito, sempre com dados agregados, mostra se a rede
            está funcionando:
          </p>
          <ul className="lp-lista">
            {indicadores.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <figure className="lp-celular">
          <Image
            src="/empresas/painel.webp"
            alt="Painel da liderança com os indicadores da rede"
            width={585}
            height={1266}
          />
        </figure>
      </section>

      <section className="lp-secao lp-duas lp-invertida" aria-labelledby="lp-privacidade">
        <figure className="lp-celular">
          <Image
            src="/empresas/faisca.webp"
            alt="Uma Faísca marcada entre duas colaboradoras"
            width={585}
            height={1266}
          />
        </figure>
        <div>
          <span className="lp-rotulo">
            <LockKeyhole size={16} /> Privacidade desde o início
          </span>
          <h2 id="lp-privacidade">Confiança é o que faz as pessoas usarem</h2>
          <ul className="lp-lista">
            <li>IA só com aviso e consentimento, sempre com alternativa manual.</li>
            <li>A dica só é publicada quando as duas participantes autorizam.</li>
            <li>Mensagens do chat não alimentam a IA.</li>
            <li>A liderança vê números agregados, nunca conversas.</li>
            <li>Comunidades privadas não aparecem para quem não é membro.</li>
          </ul>
        </div>
      </section>

      <section className="lp-oferta" aria-labelledby="lp-piloto">
        <SimboloFaisca size={56} degrade />
        <h2 id="lp-piloto">Piloto de 30 dias</h2>
        <p>
          Para 20 a 50 colaboradoras. A gente configura com as áreas e
          regionais da sua empresa, acompanha o uso e entrega um relatório com
          os indicadores no fim.
        </p>
        <div className="lp-acoes">
          {contato ? (
            <a className="lp-botao" href={contato}>
              Conversar com a equipe
            </a>
          ) : null}
          <Link
            className={contato ? "lp-botao lp-botao-sec" : "lp-botao"}
            href="/demonstracao"
          >
            Explorar a demonstração
          </Link>
        </div>
      </section>

      <footer className="lp-rodape">
        <p>
          Feito por Júlia Cristina (dados e IA), Kayla Larissa (design) e
          Melissa Wolff (engenharia), de São Luís, MA.
        </p>
        <p>
          A {nomeProduto} nasceu como “Entre Elas” no Hackathon Equatorial
          2026. A Equatorial não é responsável pelo produto.
        </p>
      </footer>
    </main>
  );
}
