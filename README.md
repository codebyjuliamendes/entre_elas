# Entre Elas

**Uma rede de troca de conhecimentos entre mulheres.** O Entre Elas conecta quem quer aprender com quem pode compartilhar experiência, transformando essa aproximação em uma conversa curta chamada **Faísca**.

O projeto está preparado para um piloto com contas individuais, perfis no servidor e encontros entre participantes. A interface pública está publicada na Vercel; a disponibilidade de e-mail, IA, chat e chamadas depende da configuração dos serviços externos descritos neste README.

## O produto

Uma pessoa registra o que sabe e o que gostaria de aprender. A curadoria sugere conexões com base em evidências dos perfis e das trocas. As participantes podem convidar uma à outra para uma Faísca de 20 minutos, conversar, registrar aprendizados e, com autorização de ambas, publicar uma dica para a rede.

O app também reúne rede de participantes, biblioteca de saberes, agenda, chats e comunidades. A experiência adapta a navegação a celulares e computadores e pode ser instalada como PWA.

## Estado do projeto

| Área | Implementação |
| --- | --- |
| Interface | Next.js, publicada na Vercel |
| Contas | Login e cadastro por link mágico via Supabase Auth |
| Dados | Supabase Postgres e `pgvector` |
| Curadoria | Gemini, com Groq como alternativa; embeddings via Gemini |
| Chat e vídeo | Stream e Daily, conforme credenciais e configuração |
| Testes locais | Vitest, Playwright, banco local e Auth de teste |
| Integrações hospedadas | Exigem configuração e verificação no próprio ambiente de produção |

Os testes locais não enviam e-mails nem comprovam a disponibilidade de SMTP, Gemini, Groq, Stream ou Daily no deploy. Antes de abrir o piloto, siga [Ativar o piloto](docs/ativar-piloto.md) e [Operação da banca](docs/operacao-banca.md).

## Modos de uso

### Piloto real

`APP_MODE=piloto` habilita a experiência com contas verificadas, dados persistidos no servidor e trocas entre participantes. O cadastro é aberto por e-mail; o painel de liderança é restrito aos endereços configurados em `PILOT_LEADER_EMAILS`. Recursos de IA dependem de consentimento e de credenciais ativas.

### Apresentação

`APP_MODE=apresentacao` habilita o roteiro fictício da demonstração. O conteúdo de apresentação pode usar dados locais e simulações identificadas; ele não representa contas, mensagens, encontros ou IA reais. Consulte [MVP visual para apresentação](docs/mvp.md).

## Tecnologias

- Next.js 16, React 19 e TypeScript estrito
- Supabase: Postgres, Auth e `pgvector`
- Zod para validação dos contratos
- Gemini para geração e embeddings; Groq como alternativa de geração
- Stream Chat e Daily para conversa e vídeo
- Vitest e Playwright para testes

## Começar localmente

### Requisitos

- Node.js 22 ou superior
- npm
- Docker, para preparar e executar o banco local

### Instalação

```bash
git clone https://github.com/codebyjuliamendes/entre_elas.git
cd entre_elas
npm ci
cp .env.example .env.local
```

Preencha `.env.local` com valores apropriados ao ambiente. Não compartilhe nem versione esse arquivo: ele pode conter chaves privadas. Para rodar somente a interface de apresentação, use `APP_MODE=apresentacao`; o piloto real exige a configuração do Supabase e dos serviços externos.

Prepare o banco local e inicie o app:

```bash
npm run setup:local
npm run dev:local
```

Abra [http://localhost:3000](http://localhost:3000). `setup:local` prepara o Postgres/PostgREST e aplica as migrations locais; não altera o projeto hospedado e não fornece Supabase Auth ou entrega de e-mail.

## Configuração do piloto

As variáveis disponíveis estão documentadas em [`.env.example`](.env.example). Entre as principais:

| Variável | Uso |
| --- | --- |
| `APP_MODE` | Define `piloto` ou `apresentacao` |
| `APP_URL` | URL HTTPS pública usada nos links de autenticação |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privilegiada, somente no servidor |
| `GEMINI_API_KEY`, `GROQ_API_KEY` | Provedores de IA |
| `STREAM_API_KEY`, `STREAM_API_SECRET` | Chat |
| `DAILY_API_KEY` | Salas de vídeo |
| `PILOT_LEADER_EMAILS` | Lista de e-mails com acesso à liderança |

O Supabase deve ter as migrations aplicadas em ordem, cadastro por e-mail habilitado, URLs de retorno corretas e SMTP próprio configurado para envio público. Os templates de e-mail são arquivos no repositório, mas precisam ser instalados no painel do Supabase. Veja [Templates e SMTP](supabase/templates/README.md) e [Ativar o piloto](docs/ativar-piloto.md).

Na Vercel, configure as variáveis no projeto e no ambiente de deploy correspondente. Alterações em `.env.local` não atualizam a Vercel. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no cliente, em commits ou em mensagens.

## Comandos úteis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run dev:local` | Inicia o app com as variáveis do ambiente local |
| `npm run build` | Cria o build de produção |
| `npm start` | Inicia o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run typecheck` | Gera tipos do Next.js e executa a checagem TypeScript |
| `npm test` | Executa testes unitários e de domínio |
| `npm run test:db` | Executa testes com o banco local preparado |
| `npm run test:e2e:piloto` | Executa E2E com Postgres local e Auth simulado |
| `npm run verificar:piloto -- --ia` | Diagnostica configurações e integrações com conteúdo fictício |

Os testes de banco e E2E devem usar somente o banco local. O diagnóstico de piloto não envia e-mail, não cria contas ou salas e não comprova entrega SMTP. Consulte [Validação](docs/validacao.md) para o alcance e os limites de cada verificação.

## Estrutura do repositório

```text
app/                   Rotas, páginas e endpoints Next.js
components/            Componentes de interface
lib/domain/            Regras de domínio
lib/ai/                Curadoria, modelos e prompts
lib/db/                Acesso ao banco e tipos
lib/integrations/      Integrações com serviços externos
supabase/migrations/   Evolução do schema do banco
supabase/templates/    Templates dos e-mails de autenticação
tests/                 Testes unitários, de banco e E2E
docs/                  Guias operacionais e decisões do projeto
```

## Guias

- [Ativar o piloto real](docs/ativar-piloto.md)
- [Operação e ensaio da banca](docs/operacao-banca.md)
- [MVP visual e roteiro de apresentação](docs/mvp.md)
- [Contratos da API](docs/api.md)
- [Identidade visual](docs/identidade-visual.md)
- [Validação e limites conhecidos](docs/validacao.md)
- [Decisões do projeto](docs/decisoes.md)
- [Configuração dos e-mails e SMTP](supabase/templates/README.md)

## Segurança e privacidade

- Não versione `.env.local` nem copie segredos para issues, logs ou conversas.
- A chave de serviço do Supabase é exclusiva do servidor.
- No modo piloto, a IA processa informações somente com consentimento explícito; há alternativa manual.
- Use conteúdo fictício em apresentações e testes. Não envie informações confidenciais ou dados de terceiros aos provedores de IA.
- A publicação de uma dica exige autorização das duas participantes.

## Contribuição

Antes de enviar uma alteração, execute `npm run lint`, `npm run typecheck` e `npm test`. Mudanças que afetem banco, consentimento ou operação do piloto também devem atualizar os documentos correspondentes. Regras adicionais de implementação estão em [`AGENTS.md`](AGENTS.md).
