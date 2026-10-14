# Tarefas do back para o Codex — Entre Elas

Cole uma tarefa por vez no Codex. Cada uma depende das anteriores.
Todas seguem o `AGENTS.md`, que deve estar na raiz do repositório antes da tarefa 1.

Antes de começar, crie as contas e chaves: Supabase, Google AI Studio (Gemini), Groq, Stream e Daily.

---

## Tarefa 1 — Fundação do projeto

> Leia o AGENTS.md. Crie o projeto Next.js (App Router, TypeScript estrito) com a estrutura de
> pastas da seção 4, Zod, Vitest, ESLint e o cliente Supabase do lado do servidor. Crie
> `.env.example` com as variáveis da seção 8, `docs/decisoes.md` vazio e uma rota `GET /api/health`
> que confirma a conexão com o Supabase. Não crie nenhuma página além de `app/dev/` vazia.

**Pronto quando:** build, lint e testes passam; `/api/health` responde `ok`.

---

## Tarefa 2 — Banco de dados

> Crie as migrations do Supabase com todas as tabelas, enums, índices e chaves estrangeiras da
> seção 5 do AGENTS.md. Ative a extensão pgvector, crie um índice vetorial em `saberes.embedding`
> e a função SQL `buscar_saberes`. Gere os tipos TypeScript do banco em `lib/db/types.ts`.

**Pronto quando:** as migrations rodam do zero sem erro e os tipos são gerados.

---

## Tarefa 3 — Schemas e usuária atual

> Crie em `lib/schemas/` os schemas Zod de entrada e saída para todas as entidades da seção 5.
> Crie `lib/auth/current-user.ts` com `getCurrentUser()`, que no modo demo lê o id de um cookie
> e valida que a usuária existe. Crie `POST /api/dev/entrar-como` que define esse cookie.
> Deixe claro em comentário onde o SSO entraria no futuro.

**Pronto quando:** é possível "entrar como" uma usuária pelo `app/dev/`.

---

## Tarefa 4 — Seed da demo

> Crie `scripts/seed.ts` que popula o banco com dados **fictícios** e realistas do setor elétrico:
> 12 colaboradoras de áreas e regionais diferentes (incluindo Ana Ribeiro, técnica de campo em
> Pelotas, e Carla Souza, gerente de projetos em Porto Alegre, que já apresentou projetos à diretoria),
> 4 comunidades (uma privada), 15 posts entre discussões e dicas, comentários e 5 eventos.
> O script deve ser idempotente (pode rodar várias vezes sem duplicar).

**Pronto quando:** `npm run seed` popula tudo e pode ser repetido.

---

## Tarefa 5 — Camada de IA

> Implemente `lib/ai/provider.ts`, `gemini.ts` e `groq.ts` conforme a seção 7: `gerar()` com saída
> JSON validada por Zod, uma nova tentativa em caso de JSON inválido, alternância automática para o
> Groq em erro 429 ou após 8 s, e cache opcional na tabela `ia_cache`. Implemente `embed()` com o
> modelo fixado em `EMBEDDING_MODEL`. Escreva testes com os provedores simulados (mock).

**Pronto quando:** os testes cobrem sucesso, JSON inválido, alternância para o Groq e cache.

---

## Tarefa 6 — Mapa de saberes

> Implemente `extrairSaberes` e as funções de domínio que alimentam a tabela `saberes`:
> (a) saberes declarados no perfil, com fonte `perfil`, confiança 1 e confirmado;
> (b) saberes extraídos de posts, comentários e resumos de Faísca, com a evidência.
> Gere o embedding de cada saber. Crie `scripts/processar-saberes.ts`, que processa todo o seed uma vez
> respeitando os limites de requisição (fila com pausa entre chamadas).
> Crie `confirmarSaber(saberId)` para a dona do saber.

**Pronto quando:** depois do script, a tabela `saberes` tem dados com evidência e embedding.

---

## Tarefa 7 — Match (busca e ranqueamento)

> Implemente `interpretarPedido`, `buscarCandidatas`, `ranquear` e `sugerirConexoes` da seção 7,
> respeitando as regras da seção 6 (não indicar a própria solicitante, diversidade, comunidades privadas).
> Exponha `POST /api/faiscas/buscar` (pedido em texto → 3 pessoas com motivo e evidências).
> Crie `scripts/avaliar-match.ts` com 10 pedidos de teste e a pessoa esperada para cada um;
> o script imprime a taxa de acerto.

**Pronto quando:** o script de avaliação roda e mostra o acerto; o endpoint responde em até 10 s.

---

## Tarefa 8 — Ciclo da Faísca

> Implemente o domínio da Faísca: `criarFaisca`, `aceitarFaisca`, `recusarFaisca`, `cancelarFaisca`,
> `registrarAnotacoes`, `concluirFaisca` (gera o resumo), `autorizarPublicacao` e
> `publicarComoDica` (cria post com coautoras e quiz). Use `gerarPauta`, `gerarResumo` e `gerarQuiz`.
> Ao concluir, envie o resumo para `extrairSaberes`. Valide as regras de permissão da seção 6.
> Exponha route handlers finos em `app/api/faiscas/`.

**Pronto quando:** pela página de debug é possível percorrer criar → aceitar → concluir → publicar.

---

## Tarefa 9 — Integrações de chat e vídeo

> Em `lib/integrations/stream.ts`: gerar token de usuária no servidor (`GET /api/chat/token`),
> sincronizar perfis como usuárias do Stream, criar canal 1:1 da Faísca e canal de grupo.
> Em `lib/integrations/daily.ts`: criar sala com expiração para cada Faísca aceita.
> Ligue isso a `aceitarFaisca`. Se uma integração falhar, a Faísca continua aceita e a operação pode
> ser refeita por `reprocessarIntegracoes(faiscaId)`.
> Implemente o domínio de grupos (`criarGrupo`, `entrarNoGrupo`, `sairDoGrupo`) e
> `sugerirMensagens` e `sugerirAssunto` (seção 7).

**Pronto quando:** aceitar uma Faísca cria canal e sala; os ids ficam salvos na Faísca.

---

## Tarefa 10 — Comunidades, conteúdo, eventos e indicadores

> Implemente o domínio de comunidades (entrar, sair, listar com regras de privacidade), posts,
> comentários, reações, respostas de quiz e eventos (participar, cancelar participação).
> Crie `obterIndicadores()` para a visão da liderança: total de Faíscas realizadas, saberes mapeados,
> percentual de conexões entre regionais diferentes, dicas publicadas e saberes mais frequentes.
> Novos posts e comentários disparam `extrairSaberes` em segundo plano.

**Pronto quando:** todas as funções têm testes de domínio e podem ser chamadas pela página de debug.

---

## Tarefa 11 — Preparação para a demo

> Rode o fluxo completo da demo por script: Ana pede ajuda para apresentar à diretoria, Carla aparece
> entre as 3 indicações, a Faísca é aceita, concluída e publicada como dica com quiz, e Carla recebe um
> saber reconhecido. Pré-aqueça o `ia_cache` com as respostas desse roteiro. Documente em
> `docs/demo.md` como resetar o banco e repetir a demo.

**Pronto quando:** `npm run demo:reset` deixa tudo pronto para apresentar em menos de 1 minuto.

---

## O que NÃO pedir ao Codex por enquanto

- Telas, componentes, estilos ou rotas com nome de tela.
- Notificações e e-mails (dependem da jornada final).
- Fluxos que dependem da ordem das telas.
- Login real (SSO).
