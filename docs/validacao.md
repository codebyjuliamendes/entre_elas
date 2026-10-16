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

## Perfil e foco na Faísca — 2026-10-15

- Build, lint e tipos aprovados. 68 testes unitários, 14 de banco local e
  12 de navegador passaram (94 no total).
- Foto testada no navegador: processamento raster, atualização no perfil e
  cabeçalho, persistência após reload e remoção. Schemas recusam SVG/URL externa;
  arquivos excessivos e a migração de perfis sem foto têm cobertura unitária.
- Curadoria: pedido prevalece sobre objetivos, candidata excluída não retorna,
  assuntos sem especialista recebem limite explícito, foto/bio ficam fora do prompt,
  pauta se adapta ao tema e síntese sem trecho literal usa fallback identificado.
- Navegador verifica explicação da conexão, plano de vinte minutos, trecho das
  anotações e revogação dos dois consentimentos ao revisar/regenerar a síntese.
- Não foram adicionadas dependências nem alteradas migrations. Chamadas reais
  de IA e upload hospedado continuam pendentes; foto nesta interface é local.

## Piloto multiusuário — 2026-10-15

- Build de produção, lint sem avisos e TypeScript aprovados.
- 72 testes unitários passaram; os 20 testes de banco ficam ignorados nessa
  execução e passaram separadamente com Postgres/pgvector locais.
- Os 12 testes de apresentação continuaram passando. Dois testes de navegador
  do piloto passaram com Postgres real e Auth local simulado: PKCE, duas contas,
  onboarding, convite, aceite independente, anotações, conclusão manual,
  duas autorizações e publicação; também painel restrito, novo navegador,
  persistência da identidade, refresh e rejeição de token forjado/login demo.
- Total local: 106 testes aprovados. Serviços remotos não estão incluídos nesse
  total. Revisão/consentimento usam operações SQL com lock e rejeitam versão antiga.
- Migrations 006–010 aplicadas localmente; tipos regenerados a partir desse banco.
  Há cobertura de provisionamento concorrente, quota atômica, consentimento e
  revogação, perfil sem IA, exclusão de personas e publicação idempotente.
- O teste do seed conta seus IDs conhecidos, sem exigir que o banco inteiro
  contenha exclusivamente fixtures; não apaga contas extras para passar.
- APP_MODE=apresentacao permanece o padrão. A ativação externa está documentada
  em docs/ativar-piloto.md. Não houve deploy ou aplicação de migrations no Supabase
  hospedado; Auth/SMTP, geração/embeddings, Stream e Daily reais seguem pendentes.
- Chave pública Auth, credenciais dos provedores, domínio público e lista de
  convidados não estavam configurados. As credenciais locais Docker não comprovam
  configuração do projeto hospedado. Nenhum e-mail ou WhatsApp foi enviado.

O código do piloto inclui integração de chat/vídeo, não uma validação desses
serviços sem chaves. Não liberar os três dias para a banca antes dos testes
externos descritos no guia de ativação. Execução da pipeline remota não foi confirmada.

## Cadastro aberto e e-mail personalizado — 2026-10-15

- Lista de convidados removida por solicitação da usuária. Qualquer e-mail válido
  pode receber link no modo piloto; identidade confirmada e acesso de liderança
  continuam verificados. Há limite global de cem solicitações/hora e cinco por e-mail.
- Build, lint e tipos aprovados; 72 testes unitários e dois de navegador do piloto
  passaram. A segunda conta usa outro domínio, sem pré-cadastro no aplicativo.
  O Auth do navegador continua sendo contrato local simulado, sem entrega real.
- Templates de confirmação e Magic Link preparados em supabase/templates, com
  ConfirmationURL preservada. Quatro capturas locais (dois templates, desktop/mobile)
  sem rolagem horizontal; revisão visual em .local/emails, fora do Git.
- SMTP/remetente/DNS e instalação dos templates no Supabase hospedado não foram
  realizados. Prévia em Chromium não comprova aparência idêntica em todos os clientes
  de e-mail, nem entrega em caixas reais. Guia de configuração acompanha os HTMLs.

## Recuperação de conexão e convites — 2026-10-15

- Build, lint e TypeScript passaram. 84 testes unitários e 21 de banco local
  passaram; dois cenários de navegador do piloto passaram com Auth simulado.
- Banco: oito criações concorrentes do mesmo envio retornam um único convite;
  reutilizar a chave com outro conteúdo é recusado. Migration 011 aplicada somente
  no banco local e tipos regenerados a partir dele.
- Navegador: a resposta do primeiro envio é abortada depois de o servidor salvar;
  repetir conserva a chave e deixa exatamente um convite. Recarregar mantém o
  encontro aberto e o fluxo segue até publicação com duas contas independentes.
- Testes de transporte cobrem renovação compartilhada, falha temporária sem logout,
  sessão inválida, limite de retentativa, rede, timeout e resposta HTML inesperada.
  Orientação cobre convite recebido/enviado, anotações e autorização/publicação.
- Serviços externos e aplicação de migrations no Supabase hospedado continuam
  pendentes das configurações seguras; os testes locais não comprovam esses serviços.

- Retorno após autenticação: testes rejeitam destinos externos e parâmetros
  desconhecidos; o navegador verifica renovação com acesso expirado sem perder
  a Faísca aberta. Auth continua simulado no teste, sem envio de e-mail real.

## Curadoria explicável e próximos passos — 2026-10-15

- Build de produção e lint passaram. Vitest: 88 testes unitários passaram;
  os 21 testes de banco são executados separadamente e também passaram.
- Três cenários Playwright do piloto passaram em Chromium com viewport mobile,
  usando Auth simulado e Postgres real. Incluem abertura de convite pela central
  de atenção, duas contas até publicação, bloqueios de acesso e retorno ao encontro.
- O teste de curadoria segura a resposta da busca, edita o pedido e só então
  libera uma indicação fictícia: ela não aparece no pedido novo. Também verifica
  a orientação para resultado vazio e o preenchimento de um exemplo editável.
  A resposta de IA deste teste é interceptada, não comprova Gemini/Groq.
- Quatro testes de domínio verificam prioridades, privacidade entre participantes,
  espera sem falsa pendência, síntese com duas notas, revisão, publicação já feita
  e ordenação cronológica dos encontros aceitos.
- Não há nova migration, dependência ou variável. SMTP, Auth hospedado, modelos,
  chat e vídeo reais continuam dependentes da configuração externa.
