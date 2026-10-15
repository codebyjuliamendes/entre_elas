# Entre Elas — MVP e back-end

Next.js App Router + TypeScript estrito, Supabase/Postgres/pgvector, Zod,
Gemini com alternativa Groq, Stream e Daily. MVP visual mobile-first com uma jornada de apresentação que funciona sem chaves.
`app/dev` mantém formulários de debug independentes.

Leia `AGENTS.md`, `docs/decisoes.md`, `docs/api.md` e `docs/demo.md`.

## Desenvolvimento

Node >=22. `npm ci`, configure `.env.local` a partir de `.env.example` e aplique
as migrations em `supabase/migrations`. Execute `npm run seed`, `npm run dev`.
O Postgres com pgvector e a API REST compatível com Supabase podem ser preparados
com Docker por `npm run setup:local`. Storage e Auth hospedados não são simulados.
Ela não modifica o projeto Supabase hospedado nem usa suas credenciais.

Verificações: `npm run build`, `npm run lint`, `npm test`, `npm run typecheck`.
`npm run test:db` exige o banco local já preparado e executa testes de domínio
com dados fictícios. Esses testes devem rodar somente no banco local de desenvolvimento;
não aponte a execução para um projeto hospedado.

A API `/api/health` testa o acesso ao banco. `/dev` exige `DEMO_MODE=true`.
Sem DEMO_MODE, a identidade precisa da futura integração SSO.
Consulte `docs/demo.md` para seed, processamento de saberes e roteiro completo.

Os campos de configuração da nuvem não publicam a aplicação nem aplicam migrations
no Supabase hospedado. Nunca inclua credenciais no controle de versão.

## Apresentação visual

`npm run dev` abre o MVP mesmo sem credenciais externas. Veja [docs/mvp.md](docs/mvp.md) para o roteiro de seis etapas, modo IA via OpenRouter, persistência local e deploy na Vercel. O backend real continua documentado separadamente.
