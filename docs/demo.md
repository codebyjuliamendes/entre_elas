# Demo fictícia

## Pré-requisitos

Configure Supabase (URL e service role), Gemini, Groq, Stream e Daily no ambiente
seguro. Use exclusivamente perfis fictícios: o plano gratuito do Gemini pode
usar dados enviados. `DEMO_MODE=true` é obrigatório para scripts de seed e demo.
Não use esse modo com dados reais nem exponha a aplicação publicamente com ele ativo.

Aplique as migrations pelo Supabase CLI (`supabase db push` após vincular o
projeto) ou pelo editor SQL, na ordem dos arquivos em `supabase/migrations`.
Não execute operações destrutivas num projeto com dados reais.
Os tipos em `lib/db/types.ts` são gerados do banco local após as migrations.
O comando `npm run db:types` gera os tipos do Postgres local.
Para um projeto hospedado: `supabase gen types typescript --project-id SEU_REF > lib/db/types.ts`.

1. Instale as dependências com Node >=22 (`npm ci`; na nuvem, cache em /tmp e NODE_USE_ENV_PROXY=1).
2. Configure as variáveis necessárias no ambiente seguro. Para desenvolvimento local,
   mantenha-as em `.env.local`, arquivo ignorado pelo Git, e gere DEMO_COOKIE_SECRET
   com 32 bytes aleatórios.
3. `npm run seed` (idempotente: 12 perfis, 4 comunidades, 15 posts, 15 comentários, 5 eventos).
4. `npm run processar-saberes`: embeddings dos perfis e extrações da fila, com
   pausa de 4,5 segundos entre chamadas. A primeira execução pode levar vários minutos.
5. `npm run avaliar-match`: dez pedidos, imprime taxa de acerto e tempos; erros
   de execução têm exit status diferente de zero. Não trata respostas vazias como acerto.
6. `npm run demo:reset`: valida Carla nas indicações, cria/aceita a Faísca,
   anota pelas duas, conclui, autoriza pelas duas e publica dica com quiz.
   Confirma os saberes extraídos para Carla.
7. Repita `npm run demo:reset` para verificar o tempo após aquecer os prompts no cache.
   O script retorna erro se ultrapassar um minuto: esse alvo depende dos provedores.
8. `npm run dev`, use `/dev` internamente e entre como Ana
   `00000000-0000-4000-8000-000000000001` ou Carla
   `00000000-0000-4000-8000-000000000002`.

O reset remove somente a última Faísca desse roteiro e seus dados associados,
identificada em `.local/demo-state.json`. Ele preserva seed, embeddings e cache;
não apaga todo o banco. Uma primeira execução aquece os prompts que habilitam cache.
Falhas de Stream/Daily não desfazem aceite: retente `/api/faiscas/reprocessar`.
Jobs com três falhas exigem diagnóstico e reset explícito de tentativas no banco.

## O que precisa de credenciais

Os testes unitários e os testes locais de domínio não validam as contas externas.
Match, embeddings, cache de IA real, Stream, Daily e o roteiro completo só podem
ser declarados funcionando após executar com as chaves configuradas.
STREAM_API_SECRET e DEMO_COOKIE_SECRET precisam ser valores reais no processo,
pois assinam tokens/cookies localmente; placeholders de proxy não servem para HMAC.
Nunca cole chaves no chat ou faça commit delas.

## Banco local leve

`npm run setup:local` inicia Docker Postgres/pgvector e PostgREST e verifica
uma consulta REST. Use `npm run seed:local` e `npm run dev:local` para forçar
credenciais locais, preservando as configurações do Supabase hospedado.
As portas 54321, 54330 e 54331 ficam em loopback; nenhum serviço de Storage/Auth
é simulado. O bucket privado fotos-perfil é preparado pela migration apenas
no Supabase hospedado. Migrations locais têm hashes: não altere uma migration
já aplicada, crie outra. Os tipos gerados não substituem aplicar as migrations.
