# AGENTS.md — Entre Elas (back-end)

> Leia este arquivo inteiro antes de qualquer tarefa. Ele vale para todo o repositório.

## 1. O produto

Entre Elas é um app web instalável (PWA) que conecta mulheres da Equatorial por interesses,
competências e objetivos. Uma **IA curadora** aprende, a partir do perfil e das trocas
(fórum, dicas, Faíscas), quem sabe o quê, e conecta quem quer aprender com quem já viveu aquilo.

Conceito central: **Faísca** — uma conversa de 20 minutos entre duas colaboradoras, sugerida pela IA,
com pauta gerada antes e resumo gerado depois. O resumo volta para a IA e alimenta o mapa de saberes.

Projeto de hackathon (prazo de uma semana). Prioridade: funcionar de ponta a ponta, com código simples.

## 2. Escopo visual e organização por domínio

Atualização autorizada pela usuária em 15/10/2026: implementar o MVP visual mobile-first, com jornada de seis etapas, navegação, telas periféricas e fallback para apresentação. O upgrade autorizado inclui layout desktop, rede, biblioteca, comunidades interativas, backup e PWA, mantendo a separação entre apresentação local e backend real. Next.js 16 e React 19 foram mantidos por escolha explícita da usuária. Em 15/10/2026 a usuária ampliou o escopo para um piloto real de três dias, até dez pessoas previstas, login por link mágico e trocas entre participantes. A usuária posteriormente definiu cadastro aberto, sem lista de convidados; qualquer e-mail válido pode receber o link. O painel de liderança permanece restrito. APP_MODE=piloto usa identidade verificada e dados no servidor, sem aceite/consentimento simulado; exige aviso e opção explícita de IA, preservando alternativa manual. A interface de apresentação permanece isolada. O restante das regras de domínio continua válido. Portanto:

- Organize o código por **domínio** (perfil, saber, Faísca, comunidade, post, evento, chat, IA),
  **nunca por tela**. Não crie regras de negócio chamadas "home", "tela" ou "page data"; componentes de apresentação podem seguir as rotas.
- Componentes, páginas e estilos do MVP são permitidos em `components/` e `app/`. A página `app/dev/` continua sendo um debug independente, sem reaproveitamento no produto.
- Não codifique regras de **ordem de jornada** (ex.: "só pode entrar na chamada depois de abrir o chat").
  Implemente apenas regras de **domínio** (ex.: "só a convidada pode aceitar uma Faísca").
- Toda função pública de domínio recebe e devolve dados validados por **Zod**. Esses schemas são o contrato
  que o front vai consumir, seja qual for o desenho final.
- Na dúvida entre algo genérico e algo específico de uma tela, escolha o genérico e registre a dúvida
  em `docs/decisoes.md`.

## 3. Stack

- Next.js (App Router) + TypeScript estrito
- Supabase: Postgres + pgvector + Storage
- IA de geração: Gemini (plano gratuito, modelos Flash/Flash-Lite), com Groq como alternativa automática
- IA de embeddings: Gemini (um único modelo, fixado em configuração)
- Chat: Stream Chat (SDK de servidor)
- Vídeo: Daily (API REST para criar salas)
- Front-end: Tailwind CSS, Framer Motion, componentes no padrão shadcn/ui com primitivas Radix, Lucide e Sonner
- IA da apresentação: Vercel AI SDK + OpenRouter (Llama); fallback fictício identificado, em até 8 segundos. Gemini/Groq e embeddings existentes continuam na integração real.
- Validação: Zod · Testes: Vitest + Playwright · Deploy: Vercel

Não instale outras bibliotecas sem justificar em `docs/decisoes.md`.

## 4. Estrutura de pastas

```
lib/
  domain/        # regras de negócio puras, por entidade (perfil.ts, faisca.ts, ...)
  schemas/       # schemas Zod (contratos de entrada e saída)
  db/            # cliente Supabase e consultas
  ai/
    provider.ts  # interface única: gerar(prompt, schema) e embed(texto)
    gemini.ts
    groq.ts
    prompts/     # um arquivo por prompt, com versão
    curadora/    # extração, busca, ranqueamento, pauta, resumo, quiz, sugestões
  integrations/
    stream.ts
    daily.ts
  auth/
    current-user.ts  # getCurrentUser(): hoje lê um cookie de demo; amanhã, SSO
app/
  api/             # route handlers finos: validam, chamam lib/domain, devolvem JSON
  dev/             # página de debug (sem design)
supabase/
  migrations/
  seed/
scripts/           # seed, pré-processamento de saberes, avaliação da IA
tests/
docs/
  decisoes.md
```

Server Actions devem ser finas e chamar `lib/domain` no backend real ou os contratos e funções de apresentação em `lib/demo`, via adaptador `lib/ai/pitch.ts`.

## 5. Modelo de dados (Postgres)

Nomes de tabelas e colunas em português, sem acento, snake_case. Toda tabela tem
`id uuid default gen_random_uuid()`, `created_at` e `updated_at`.

- `profiles`: nome, cargo, area, cidade, regional, foto_url, interesses text[], objetivos text[]
- `saberes`: profile_id, saber, evidencia, fonte (`perfil` | `forum` | `dica` | `faisca`),
  fonte_id, confianca numeric(0–1), confirmado boolean, embedding vector(EMBEDDING_DIM)
- `communities`: nome, descricao, is_private
- `community_members`: community_id, profile_id, papel (`membro` | `moderadora`)
- `posts`: autora_id, community_id (nullable), tipo (`discussao` | `dica`), titulo, corpo, origem_faisca_id (nullable)
- `post_coautoras`: post_id, profile_id
- `comments`: post_id, autora_id, corpo
- `reactions`: post_id, profile_id, tipo
- `quizzes`: post_id, perguntas jsonb
- `quiz_respostas`: quiz_id, profile_id, respostas jsonb, acertos int
- `faiscas`: solicitante_id, convidada_id, pedido, tema, horarios_propostos timestamptz[],
  horario timestamptz, status (`pendente` | `aceita` | `recusada` | `realizada` | `cancelada`),
  pauta jsonb, anotacoes jsonb (por participante), resumo jsonb,
  publicacao_autorizada_por uuid[], stream_channel_id, daily_room_url
- `grupos`: nome, descricao, is_private, criado_por, stream_channel_id
- `events`: titulo, descricao, inicio timestamptz, tipo (`evento` | `mentoria` | `atividade`), community_id
- `event_participantes`: event_id, profile_id
- `ia_cache`: chave (hash do prompt + versão), resposta jsonb, created_at

Use enums do Postgres para os campos com valores fixos.
Crie a função SQL `buscar_saberes(query_embedding, limite, excluir_profile_id)` que devolve
os saberes mais próximos por similaridade de cosseno, já agregados por pessoa.

## 6. Regras de domínio (valem para qualquer design)

- Só a **convidada** aceita ou recusa uma Faísca; só as participantes registram anotações.
- Ao **aceitar** uma Faísca: criar canal 1:1 no Stream, criar sala no Daily, gerar a pauta.
  Se uma integração falhar, a Faísca continua aceita e o erro fica registrado para nova tentativa.
- O resumo de uma Faísca só vira dica pública quando **as duas** autorizarem.
- Um saber vindo de trocas (fonte diferente de `perfil`) só aparece publicamente se `confirmado = true`.
- Conteúdo de comunidade privada só é visível para membros e **não** gera sugestões para não membros.
- Mensagens de chat **não** alimentam o mapa de saberes e **não** são armazenadas fora do Stream.
- O ranqueador não deve indicar a própria solicitante e deve favorecer diversidade de áreas e regionais.

## 7. IA curadora

No backend real, chamadas Gemini/Groq passam por `lib/ai/provider.ts` (a apresentação usa a camada Vercel AI SDK documentada na seção 3):

- `gerar<T>(prompt, schemaZod, opcoes)`: pede saída em JSON, valida com Zod, tenta de novo uma vez
  se o JSON for inválido, usa o Groq se o Gemini responder 429 ou passar do tempo limite (8 s),
  e grava/lê o `ia_cache` quando `opcoes.cache = true`.
- `embed(texto)`: sempre o mesmo modelo de embedding, definido em `EMBEDDING_MODEL`.
  Nunca troque o modelo sem recriar todos os vetores.

Funções da curadora (cada uma com prompt próprio em `lib/ai/prompts/`):

| Função | Entrada | Saída |
|---|---|---|
| `extrairSaberes` | texto de uma troca + autora | lista de `{ saber, evidencia, confianca }` |
| `interpretarPedido` | pedido em texto livre | 2 a 3 saberes necessários |
| `buscarCandidatas` | saberes necessários | até 10 pessoas (via `buscar_saberes`) |
| `ranquear` | pedido + candidatas | 3 pessoas com `motivo` citando evidência real |
| `sugerirConexoes` | objetivos do perfil | mesma saída de `ranquear` |
| `gerarPauta` | dois perfis + tema | 3 perguntas |
| `gerarResumo` | anotações das duas | aprendizados, próximos passos, rascunho de dica |
| `gerarQuiz` | texto de uma dica | 3 perguntas de múltipla escolha |
| `sugerirMensagens` | tema + últimas 10 mensagens | 3 sugestões curtas |
| `sugerirAssunto` | interesses das participantes do grupo | 2 assuntos |

Regras dos prompts: uma tarefa por prompt, saída sempre em JSON, português do Brasil,
nunca inventar evidências que não estão na entrada.

**Privacidade:** o plano gratuito do Gemini pode usar os dados enviados. Na apresentação e nos testes, use **somente dados fictícios**. No piloto autorizado pela usuária, textos reais só podem ser enviados após aviso explícito e consentimento registrado; a alternativa manual deve continuar disponível. Verifique o consentimento de ambas antes de processar anotações da Faísca.

## 8. Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
EMBEDDING_MODEL=
EMBEDDING_DIM=
GROQ_API_KEY=
GROQ_MODEL=
STREAM_API_KEY=
STREAM_API_SECRET=
DAILY_API_KEY=
DEMO_MODE=true
```

Mantenha um `.env.example` sempre atualizado. Nunca faça commit de chaves.
A chave `SUPABASE_SERVICE_ROLE_KEY` só pode ser usada no servidor.

## 9. Página de debug

`app/dev/` pode ter formulários e saídas em JSON **sem nenhum estilo**, apenas para testar
funções do domínio e da IA. Ela só aparece quando `DEMO_MODE=true` e não deve ser reaproveitada pelo front.

## 10. Padrões de código

- TypeScript estrito, sem `any`.
- Funções de domínio puras sempre que possível; acesso a banco e APIs fica nas camadas `db/` e `integrations/`.
- Erros tipados (`ErroDominio`, `ErroIntegracao`, `ErroIA`) com mensagens em português.
- Datas sempre em UTC no banco.
- Cada tarefa entrega: código, testes do domínio, atualização do `.env.example` (se preciso)
  e uma linha em `docs/decisoes.md` quando houver escolha não óbvia.

## 11. Definição de pronto

Uma tarefa está pronta quando:
1. `npm run build`, `npm run lint` e `npm test` passam;
2. a função pode ser chamada pela página de debug ou por um script;
3. o fluxo de apresentação funciona sem credenciais, identifica simulações e exige autorização das duas participantes para publicar;
4. o fluxo real mantém as permissões e não recebe dados simulados como se fossem reais.
