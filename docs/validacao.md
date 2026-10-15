# Validação do back-end e ambiente

Data: 2026-10-14. Checkout: /workspace/entre_elas.

## Executado

- Instalação reproduzida com `npm ci`, lockfile preservado, cache em /tmp e
  proxy HTTPS para o instalador Supabase. TLS e checksum oficial permaneceram ativos.
- Migrations aplicadas do zero em Postgres 17 com pgvector, depois pelo helper
  local com registro de hashes. Tipos TypeScript gerados pela CLI a partir do banco.
- `npm run setup:local` repetido: reaproveita containers e não reaplica migrations.
- Seed repetido sem duplicar: 12 perfis fictícios, 4 comunidades, 15 posts,
  15 comentários e 5 eventos.
- `npm run build`, `npm run lint`, `npm run typecheck`: passaram.
- `npm test`: 29 passaram; 14 testes de banco ficam desativados nessa execução.
- `npm run test:db`: os 14 testes de banco passaram separadamente.
  Incluem concorrência de anotações, publicação única, consentimento, autoria,
  privacidade, grupos, comunidades, eventos, quiz e fila de extração.
- HTTP nos servidores de produção e desenvolvimento: health conectado,
  login fictício de Ana com cookie assinado, 12 perfis, 3 comunidades públicas,
  posts privados bloqueados com 403 e debug disponível no modo demo.
- npm audit de produção: zero vulnerabilidades. Alertas de desenvolvimento
  na cadeia de glob do ESLint registrados em decisoes.md.

## Limitações verificadas

A pilha Docker completa do Supabase excedeu espaço durante extração de imagens.
O fluxo local usa Postgres/pgvector + PostgREST e um adaptador de prefixo REST.
Não fornece Storage ou Auth do Supabase. A autenticação de demo é própria.

O projeto hospedado informado é qwjpqcninxrbfwurswaj.supabase.co. A tentativa
sem credenciais foi bloqueada pelo proxy (CONNECT 403) antes de uma resposta
HTTP do Supabase. Domínios necessários foram salvos no draft; isso não comprova
que a política já foi aplicada ao processo atual.

As chaves de Gemini, Groq, Stream e Daily não estavam configuradas. `demo:reset`
foi executado e parou, com exit status 1, em GEMINI_API_KEY ausente antes de
mutar o roteiro. Provedores reais, embeddings reais, avaliação de dez matches,
cache aquecido da demo, canais/salas reais e tempo de menos de um minuto ainda
precisam de validação. Mocks não substituem esses resultados.

## Entregas por tarefa

| Tarefa | Implementação e validação |
| --- | --- |
| 1 — Fundação | Next.js, TS estrito, Zod/Vitest/ESLint, cliente servidor e health local verificados |
| 2 — Banco | Tabelas, enums, índices, pgvector, busca e tipos gerados; migrations locais passaram; Storage hospedado pendente |
| 3 — Identidade | Contratos de entidades, cookie assinado e endpoint de demo verificados por HTTP |
| 4 — Seed | Quantidades e idempotência verificadas no banco |
| 5 — IA | Provider e APIs implementados; sucesso/JSON inválido/429/timeout/cache testados com mocks |
| 6 — Saberes | Extração, confirmação, embeddings, cache e worker implementados; permissões/evidência verificadas; processamento real pendente |
| 7 — Match | Interpretação/busca/ranking/sugestões e avaliação implementados; privacidade, evidências, diversidade e limite de tempo testados; acerto real pendente |
| 8 — Faísca | Ciclo e publicação atômica testados com banco real e IA simulada |
| 9 — Integrações | Stream/Daily/grupos implementados; falhas/retentativas/permissões e HTTP simulado testados; contas reais pendentes |
| 10 — Conteúdo | Comunidades/posts/comentários/reações/quiz/eventos/indicadores/fila implementados e domínios testados |
| 11 — Demo | Script e reset limitado ao roteiro escritos; execução completa e cache aquecido pendentes de credenciais |

## Próximas validações externas

Configure as credenciais pelas configurações seguras do ambiente, nunca no chat.
STREAM_API_SECRET e DEMO_COOKIE_SECRET devem ser valores reais acessíveis ao
processo para assinatura HMAC, sem placeholders de proxy. DEMO_COOKIE_SECRET
local já foi gerado; para o runtime hospedado forneça um segredo estável separado.

Aplique as migrations no Supabase hospedado, na ordem, com acesso administrativo
pelo editor SQL ou CLI autenticada. A chave service role para REST não habilita
aplicar migrations. Em seguida siga docs/demo.md, usando somente dados fictícios.

Foram salvos no draft: install_script, start_skill, variáveis, requisitos de
segredos e destinos de rede. A publicação/snapshot e a restauração numa nova
tarefa não foram executadas ou validadas. Revise e salve nas configurações do
ambiente e publique pelo produto quando as configurações estiverem completas.

## MVP visual — 2026-10-15

- Next.js 16 e React 19 mantidos conforme escolha da usuária.
- Interface mobile-first de 430 px, tema lilás, componentes Radix no padrão
  shadcn/ui, animações com reduced-motion, notificações e avatares fictícios locais.
- Build de produção, lint e checagem de tipos passaram com as cinco rotas visuais.
- 36 testes unitários passaram (incluindo sete novos de IA/fallback da apresentação).
- Os 14 testes de banco real passaram separadamente, preservando o backend.
- Quatro testes Playwright passaram em Chromium: ciclo completo de seis etapas,
  consentimento das duas, quiz com correção, publicação e reconhecimento após reload;
  comunidades/chats/agenda/edição de perfil; outra candidata/retomada; layout desktop 430 px.
- O download do Chromium via cdn.playwright.dev retornou 403; os testes usaram o
  navegador instalado em /usr/bin/chromium, sem desativar verificações de instalação.
- O seed mínimo supabase/seed/mvp.sql foi aplicado duas vezes em transação revertida:
  três saberes na primeira aplicação e nenhum duplicado na segunda. Sem vetores fictícios.
- Auditoria de dependências de produção: zero vulnerabilidades reportadas.
- Revisão visual com capturas mobile e desktop, incluindo ajuste de contraste.

O MVP visual funciona em demonstração sem chaves ou banco. O fluxo e as mensagens
fictícias ficam no dispositivo; não são gravações reais no Supabase/Stream/Daily.
OpenRouter via Vercel AI SDK está implementado com deadline de 7,5 segundos e
fallback validado, mas a chamada real depende de chave/modelo e não foi validada.
PITCH_AI_MODE=demo é o padrão. OpenRouter é opcional e openrouter.ai foi adicionado
aos destinos de rede no draft. Também foram salvos o requisito opcional da chave,
as variáveis do MVP e instruções de inicialização. Isso não aplica nem publica
automaticamente a configuração. Vercel não foi implantado nesta tarefa.

## Upgrade — 2026-10-15

- Build de produção, ESLint sem avisos e TypeScript passaram. `typecheck` agora
  gera tipos do Next antes do tsc, inclusive em checkouts sem `.next`.
- 62 testes unitários passaram; os 14 de banco são ignorados nessa execução
  e passaram separadamente com `npm run test:db`.
- 10 cenários Playwright passaram contra produção isolada na porta 3200:
  jornada completa, consentimento/quiz/persistência, navegação, retomada,
  desktop, descoberta/filtros/busca global, comunidade/comentários, favoritos,
  backup inválido, fallback sem rede e cache público da PWA.
- Total: 86 testes aprovados. Novos testes cobrem identidade dos encontros,
  migração, proteção de dados corrompidos/quota, datas, ICS, origem e corpo HTTP,
  cookie assinado e fallback local com prazo limitado.
- Auditoria de dependências de produção: zero vulnerabilidades.
- Doze capturas de produção revisadas em celular e desktop nas rotas início,
  rede, saberes, comunidades, agenda e configurações; sem rolagem horizontal.
  Evidências locais em `.local/upgrade`, fora do controle de versão.
- Pipeline GitHub Actions adicionada; sucesso remoto ainda não comprovado.
- Instruções atualizadas e salvas no draft do ambiente. Esse salvamento não
  aplica nem publica a configuração; revisão/salvamento e publicação no produto
  continuam necessários para ativá-la.

As integrações externas, SSO, Storage hospedado, vídeo/chat reais e deploy
continuam com as limitações anteriores. O upgrade validado é da apresentação
local e dos contratos/segurança do backend; não é validação de serviços sem chaves.
