# Do piloto ao produto: várias empresas, login corporativo e LGPD

Este documento ordena o que falta no código e na parte legal para vender a Tecida a mais de uma empresa. A regra é **não construir antes de alguém pedir**: cada etapa tem um gatilho que diz quando começar.

## Etapa 0 · Já feito

- O nome mudou para Tecida e a marca da Equatorial saiu do produto.
- Há uma landing page para empresas em `/empresas`.
- Há consentimento explícito para a IA (versão registrada por pessoa) e alternativa manual.
- A dica só é publicada com autorização das duas, e o chat não alimenta a IA.

## Etapa 1 · Primeiros pilotos: uma instalação por empresa

**Gatilho:** a primeira empresa topa o piloto.

Para 1 a 3 pilotos, **não vale reescrever o banco para várias empresas**. Cada empresa ganha a própria instalação:

- um projeto no Supabase (banco separado);
- um projeto na Vercel com as variáveis daquela empresa;
- um subdomínio, como `empresa.tecida.app`.

Isso dá isolamento total dos dados, que é o que o jurídico do cliente quer ouvir, e custa cerca de R$ 250 por mês por piloto.

O que falta no código para isso:

1. **Personalização por variável de ambiente:** nome e logo da empresa no topo e no login, e a lista de áreas e regionais. Hoje as regionais do cadastro seguem a demonstração.
2. **Domínio de e-mail permitido**, como `PILOT_EMAIL_DOMINIOS=empresa.com.br`. Hoje o cadastro é aberto, e num piloto pago só colaboradoras devem entrar.
3. **Excluir a própria conta e baixar os próprios dados** em Configurações. É obrigação da LGPD, o que o RH vai perguntar primeiro.

## Etapa 2 · De 4 a 10 clientes: uma plataforma, várias empresas

**Gatilho:** manter instalações separadas começa a tomar mais de um dia por mês, ou chega o quarto cliente.

- Tabela `organizacoes` (nome, logo, cores, domínios de e-mail, configurações).
- Coluna `organizacao_id` em todas as tabelas de conteúdo: perfis, saberes, Faíscas, posts, comunidades, mensagens etc.
- **Isolamento no banco**, com regras de RLS (Row Level Security) por organização, além do filtro no código. Assim, um erro no código não vaza dados entre empresas.
- A função `buscar_saberes` passa a filtrar por organização, para que a IA nunca indique alguém de outra empresa.
- Testes automáticos que provam que a pessoa da empresa A não vê nada da empresa B.
- Uma migração para trazer as instalações da etapa 1 para dentro da plataforma.

## Etapa 3 · Empresas grandes: login corporativo e contrato

**Gatilho:** um cliente com mais de 1.000 pessoas, ou o TI pede SSO.

- Login com Microsoft (Entra ID) e Google Workspace, que o Supabase Auth suporta.
- SAML para quem usa outro provedor de identidade, como Okta.
- Painel da liderança exportável em PDF e planilha.
- Registro de auditoria: quem acessou o painel e quando.

## IA com dados reais

- **Antes do primeiro piloto pago:** trocar o plano gratuito do Gemini pelo plano pago, cuja política não usa os dados para treinar modelos. O plano gratuito pode usar o que é enviado, e isso não pode acontecer com dados de cliente.
- Fazer o mesmo com o Groq, ou desligar o fallback para ele na instalação do cliente.
- Listar os provedores, com país e finalidade, na política de privacidade e no contrato.

## LGPD: o que preparar

| Item | O que é | Quando |
|---|---|---|
| **Papéis** | A empresa cliente é a *controladora* dos dados das colaboradoras, e a Tecida é *operadora*. Isso fica no contrato. | Antes do 1º piloto |
| **Contrato de tratamento de dados (DPA)** | Diz o que a Tecida pode fazer com os dados, por quanto tempo, quais subcontratados usa (Supabase, Vercel, Google, Groq, Daily) e o que faz em caso de incidente. | Antes do 1º piloto |
| **Política de privacidade** | Página pública com quais dados são coletados, para quê, com quem são compartilhados e como pedir exclusão (rascunho abaixo). | Antes do 1º piloto |
| **Termos de uso** | Regras de uso: respeito, nada de dados confidenciais da empresa nas conversas, e moderação. | Antes do 1º piloto |
| **Encarregado (DPO)** | Pessoa de contato para titulares e para a ANPD. No começo, pode ser uma das sócias. | Ao abrir o CNPJ |
| **Direitos das titulares** | Acesso, correção, portabilidade e exclusão. | Etapa 1, item 3 |
| **Retenção** | Prazo para apagar dados depois do fim do contrato, como 90 dias. | No DPA |
| **Incidentes** | Plano curto: quem avisa o cliente e em quanto tempo. | No DPA |

> Estes textos são ponto de partida. Antes de assinar o primeiro contrato, peçam revisão a um advogado. Núcleos de prática jurídica e incubadoras universitárias costumam ajudar startups de graça.

## Rascunho da política de privacidade

*Para publicar quando houver CNPJ e um contato oficial. Os trechos entre [colchetes] precisam ser preenchidos.*

**Quem somos.** A Tecida é uma plataforma de troca de conhecimento entre colaboradoras, oferecida por [razão social, CNPJ] à [empresa cliente], que é a controladora dos seus dados.

**Quais dados usamos.**

- *Conta:* nome, e-mail corporativo e foto (opcional).
- *Perfil:* cargo, área, cidade, regional, interesses, objetivos e saberes que você declarar.
- *Uso:* pedidos de Faísca, convites, horários, anotações, avaliações, dicas, comentários e mensagens de chat.
- *Técnicos:* registros de acesso necessários para segurança.

**Para quê.** Para conectar você a colegas que podem ajudar, marcar e registrar as Faíscas, publicar dicas com a sua autorização e gerar indicadores *agregados* para a sua empresa. A liderança nunca vê conversas nem anotações individuais.

**IA.** A IA só processa os seus textos se você autorizar, e você pode usar tudo sem ela. Mensagens de chat nunca são enviadas à IA. Os provedores de IA ([Google Gemini, plano pago; Groq]) recebem apenas o necessário para cada tarefa e não usam esses dados para treinar modelos.

**Com quem compartilhamos.** Somente com os provedores que mantêm a plataforma funcionando:

- Supabase: banco de dados e login;
- Vercel: hospedagem;
- os provedores de IA, se você autorizar;
- Daily: videochamada, quando usada.

Não vendemos dados.

**Por quanto tempo.** Enquanto a sua conta existir ou o contrato com a sua empresa durar. Depois, os dados são apagados em até [90] dias.

**Seus direitos.** Você pode ver, corrigir, baixar ou apagar os seus dados [em Configurações] ou pelo e-mail [privacidade@...]. Encarregada de dados: [nome].

**Atualizações.** Avisaremos no app quando esta política mudar.
