import Link from "next/link";
import type { Metadata } from "next";
import { Marca } from "@/components/Marca";
import { empresaCliente, nomeProduto } from "@/lib/identidade";
import "../empresas/empresas.css";

export const metadata: Metadata = {
  title: `Privacidade · ${nomeProduto}`,
  description: `Como a ${nomeProduto} usa e protege os dados das participantes.`,
};

// Texto fiel ao funcionamento atual do app; revise quando mudar provedor, retenção ou contrato.
export default function Privacidade() {
  const empresa = empresaCliente();
  const contato = process.env.CONTATO_EMAIL?.trim();
  return (
    <main className="lp">
      <header className="lp-topo">
        <Link href="/empresas" aria-label={`${nomeProduto}, para empresas`}>
          <Marca />
        </Link>
        <nav aria-label="Acesso">
          <Link href="/entrar" className="lp-entrar">
            Entrar
          </Link>
        </nav>
      </header>
      <article className="lp-texto">
        <h1>Política de privacidade</h1>
        <p>Atualizada em 27 de outubro de 2026.</p>

        <h2>Quem cuida dos seus dados</h2>
        <p>
          A {nomeProduto} é uma plataforma de troca de conhecimento entre
          colaboradoras, em fase de piloto, mantida pelas fundadoras do projeto.
          {empresa
            ? ` Nesta instalação, a ${empresa} decide como a plataforma é usada e é a controladora dos dados; a ${nomeProduto} trata os dados em nome dela.`
            : " Quando uma empresa contrata a plataforma, ela é a controladora dos dados das colaboradoras e a Tecida trata os dados em nome dela."}
        </p>

        <h2>Quais dados usamos</h2>
        <ul>
          <li><strong>Conta:</strong> e-mail e, se você quiser, uma foto.</li>
          <li><strong>Perfil:</strong> nome, cargo, área, cidade, regional, saberes que você declara e objetivos de aprendizagem.</li>
          <li><strong>Uso:</strong> pedidos e convites de Faísca, horários, anotações, avaliações, publicações, comentários e mensagens do chat.</li>
          <li><strong>Técnicos:</strong> registros de acesso necessários para a segurança.</li>
        </ul>

        <h2>Para que usamos</h2>
        <ul>
          <li>Indicar colegas que podem ajudar no que você quer aprender.</li>
          <li>Marcar e registrar as Faíscas e publicar dicas, sempre com a autorização das duas participantes.</li>
          <li>Gerar números agregados para a liderança. Ela nunca vê conversas, anotações ou mensagens individuais.</li>
        </ul>

        <h2>Inteligência artificial</h2>
        <p>
          A IA só processa seus textos se você autorizar, e tudo funciona sem
          ela. Mensagens do chat nunca são enviadas à IA. Os provedores usados
          são o Google (Gemini) e, como alternativa quando ele falha, a Groq.
          Na versão aberta do piloto, o plano do provedor pode usar os textos
          enviados para melhorar os próprios serviços. Por isso o aviso aparece
          antes do consentimento. Em pilotos contratados por empresas, usamos
          planos que não usam os dados para treinar modelos.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Só com os serviços que mantêm a plataforma funcionando: Supabase
          (banco de dados e login), Vercel (hospedagem), os provedores de IA,
          quando você autoriza, e a Daily, para a videochamada, quando usada.
          Esses serviços podem guardar dados fora do Brasil. Não vendemos
          dados.
        </p>

        <h2>Por quanto tempo</h2>
        <p>
          Enquanto sua conta existir. Quando você exclui a conta, o que é só
          seu é apagado na hora. Nas Faíscas que já aconteceram, a outra
          pessoa mantém as anotações dela, e você aparece como “Participante
          removida”.
        </p>

        <h2>Seus direitos</h2>
        <ul>
          <li>Ver e corrigir seus dados em <strong>Meu perfil</strong>.</li>
          <li>Baixar uma cópia de tudo o que é seu em <strong>Meu perfil → Seus dados</strong>.</li>
          <li>Excluir sua conta no mesmo lugar, quando quiser.</li>
          <li>Retirar a autorização da IA a qualquer momento. Isso impede novos envios, mas não apaga o que os provedores já processaram.</li>
          <li>
            Tirar dúvidas ou fazer outros pedidos
            {contato ? (
              <>
                {" "}pelo e-mail <a href={`mailto:${contato}`}>{contato}</a>.
              </>
            ) : (
              <> pela opção de relatar um problema, em <strong>Ajuda</strong>, dentro do app.</>
            )}
          </li>
        </ul>

        <h2>Mudanças nesta política</h2>
        <p>Quando esta política mudar, a nova versão aparece aqui, com a data atualizada.</p>
      </article>
    </main>
  );
}
