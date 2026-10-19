# Contratos da API

Todas as entradas e saídas de domínio são definidas em `lib/schemas/entities.ts`.
O piloto real usa Supabase Auth verificado, cookies HttpOnly e autorização por
participante. `/api/auth/link`, `/auth/callback`, `/api/auth/renovar` e
`/api/auth/sair` implementam entrada e sessão. As APIs de IA exigem consentimento
registrado e quota por conta. Veja [ativação](ativar-piloto.md).

`POST /api/dev/entrar-como` é exclusivo da apresentação explícita com
`DEMO_MODE=true`; fica bloqueado no piloto. Seu cookie fictício nunca autentica
uma participante do piloto.

| Método e rota | Entrada / comportamento |
| --- | --- |
| GET /api/health | Verifica consulta ao Supabase; 200 ok ou 503 indisponível |
| GET /api/perfis | Lista perfis |
| PATCH /api/perfis | Atualiza o perfil atual com profileInput |
| GET /api/faiscas | Lista só as Faíscas das participantes |
| POST /api/faiscas | convidada_id, pedido, tema, horarios_propostos; no piloto, chave_pedido UUID por envio; solicitante vem da sessão |
| POST /api/faiscas/buscar | pedido → até 3 indicações fundamentadas; prazo total de 45 s com cancelamento da IA |
| POST /api/faiscas/obter | faisca_id |
| POST /api/faiscas/aceitar | faisca_id, horario; só convidada |
| POST /api/faiscas/recusar | faisca_id; só convidada |
| POST /api/faiscas/cancelar | faisca_id; participante |
| POST /api/faiscas/anotar | faisca_id, texto; participante |
| POST /api/faiscas/concluir | faisca_id; exige anotações das duas |
| POST /api/faiscas/autorizar | faisca_id; registra autorização da participante |
| POST /api/faiscas/publicar | faisca_id; exige autorização das duas, cria dica e quiz atomicamente |
| POST /api/faiscas/reprocessar | faisca_id; retenta Stream, Daily e pauta, sem desfazer aceite |
| POST /api/faiscas/video | faisca_id → URL de sala privada e token temporário |
| GET /api/comunidades | Públicas e privadas das quais é membro |
| POST /api/comunidades | communityInput; criadora vira moderadora |
| POST /api/comunidades/entrar ou /sair | community_id; privada não admite ingresso sem convite |
| POST /api/comunidades/admitir | community_id, profile_id; só moderadora |
| GET /api/posts | Posts visíveis |
| POST /api/posts | postInput; autora vem da sessão; origem_faisca_id deve ser null |
| POST /api/posts/obter ou /comentarios | post_id |
| POST /api/posts/comentar | post_id, corpo; autora vem da sessão |
| POST /api/posts/reagir | post_id, tipo: curtir, inspirador ou util |
| POST /api/posts/quiz | post_id; perguntas sem gabarito |
| POST /api/posts/responder-quiz | quiz_id, respostas: três índices 0–3 |
| GET /api/eventos | Eventos visíveis |
| POST /api/eventos | eventInput |
| POST /api/eventos/participar ou /cancelar | event_id |
| GET /api/grupos | Grupos públicos e privados da usuária |
| POST /api/grupos | nome, descricao, is_private; criadora vem da sessão |
| POST /api/grupos/entrar, /sair ou /reprocessar | grupo_id |
| POST /api/grupos/convidar | grupo_id, profile_id; só criadora |
| GET /api/chat/token | Token Stream de uma hora; nenhuma mensagem é persistida localmente |
| GET /api/saberes | Saberes da própria usuária, inclusive aguardando confirmação |
| POST /api/saberes/confirmar | saber_id; só a dona |
| POST /api/ia/mensagens | faisca_id; usa últimas 10 mensagens no Stream, sem cache |
| POST /api/ia/assuntos | grupo_id; só participantes |
| POST /api/ia/conexoes | Objetivos do perfil atual → indicações |
| GET /api/indicadores | Indicadores da demo; acesso de liderança requer SSO futuro |

Erros: JSON `{ "erro": "mensagem em português" }`, com 400 para entrada inválida,
401 para sessão ausente, 403 para permissão, 404 para registro ausente,
409 para estado incompatível, 502/504 para IA, 503 para integração/configuração.
Identificadores fornecidos no corpo nunca substituem a identidade da sessão.

Posts e comentários enfileiram jobs de extração em uma transação por trigger.
Execute `npm run processar-saberes` como worker: reclama jobs com SKIP LOCKED,
retenta até três vezes e recupera jobs interrompidos após dez minutos. A fila
é persistente e não depende de promessas em segundo plano numa função Vercel.
Em produção, agende o worker em um serviço apropriado. Messages de chat nunca entram nessa fila.

A busca pública exclui todo conteúdo privado, mesmo para quem é membro, para
que não contribua para indicações públicas. Saberes derivados de trocas exigem
confirmação da autora. Evidências extraídas devem ser trechos literais.

`POST /api/auth/link` recebe `email`, `retorno` opcional e `modo` (`entrar` ou `cadastrar`). O padrão é `entrar`, com criação de usuária desativada no Auth; somente `cadastrar` usa `shouldCreateUser=true`. Ambos enviam link mágico, preservando PKCE e os limites de envio.
