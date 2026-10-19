# Caminho para produção

O piloto foi construído para validar a experiência em poucos dias, com serviços que não exigem contrato. Este documento descreve o que muda para operar na Equatorial com segurança e em escala.

## O que o piloto usa e o que muda

| Camada | Piloto | Produção na Equatorial |
|---|---|---|
| Identidade | E-mail e senha ou link mágico (Supabase Auth), cadastro aberto | Login único com a conta Microsoft corporativa (Entra ID) |
| IA de texto | Gemini (plano gratuito) com Groq como alternativa automática | Modelo em contrato corporativo (por exemplo, Azure OpenAI ou Vertex AI), sem uso dos dados para treinamento |
| Embeddings | Gemini, 768 dimensões | Mesmo provedor corporativo; a troca de modelo exige recriar todos os vetores |
| Chat | Stream Chat; sem as chaves do Stream, mensagens ficam no próprio banco | Microsoft Teams (chat 1:1 da Faísca) |
| Vídeo | Daily (salas criadas por API) | Reunião do Teams criada com a Faísca |
| Banco | Supabase gerenciado (Postgres + pgvector) | Supabase em região brasileira ou Postgres gerenciado na nuvem da empresa |
| Hospedagem | Vercel | Vercel Enterprise ou nuvem corporativa |

A troca é localizada: as regras de domínio ficam em `lib/domain`, a IA passa por uma interface única em `lib/ai/provider.ts`, e chat e vídeo ficam em `lib/integrations`. Trocar um provedor não altera as regras do produto.

## Privacidade e LGPD

- **Base legal e finalidade:** uso voluntário, com finalidade descrita (conectar pessoas para troca de conhecimento) e consentimento específico para IA.
- **Minimização:** o mapa de saberes usa perfil, pedidos e anotações autorizadas. Mensagens de chat nunca alimentam a IA nem o mapa de saberes.
- **Controle da titular:** a participante revisa o que a IA gerou, pode revogar a autorização de IA e decide a publicação de cada dica junto com a outra participante.
- **Liderança só vê agregados:** o painel não mostra objetivos individuais, e temas só aparecem quando citados por duas ou mais pessoas.
- **Não é avaliação de desempenho:** recomendações e saberes não devem alimentar avaliação ou decisões de carreira sem consentimento da própria pessoa. Isso precisa constar na política de uso.
- **Pendências para produção:** relatório de impacto (RIPD) com o time de privacidade, contrato de operador com o provedor de IA, prazo de retenção e rotina de exclusão a pedido.

## Escala

- **Busca:** a similaridade semântica roda no próprio Postgres (pgvector), com índice vetorial HNSW na tabela de saberes, adequado para dezenas de milhares de perfis.
- **IA:** cada Faísca completa faz um número pequeno e previsível de chamadas: interpretar o pedido, gerar embeddings dos saberes, ranquear, gerar a pauta e gerar o resumo. Respostas repetidas usam cache (`ia_cache`).
- **Custo:** o custo por Faísca é a soma dessas chamadas no preço do contrato corporativo. Ele deve ser calculado com a tabela do provedor escolhido antes do lançamento.
- **Operação:** a falha de uma integração não bloqueia a Faísca, porque o erro fica registrado para nova tentativa e a conversa continua pelo caminho manual.

## Evolução do produto

1. **Começar pelo pedido:** a primeira tela pergunta "com o que você precisa de ajuda agora?", e o perfil se completa aos poucos com sugestões que a pessoa confirma.
2. **Lado de quem oferece:** opção "abro Faíscas" com tema e limite mensal de convites, para não sobrecarregar as mais procuradas.
3. **Formatos para campo:** Faísca por áudio, assíncrona e presencial na mesma base, com avisos pelo Teams.
4. **Rodas:** quando vários pedidos se repetem, a IA sugere uma conversa em grupo.
5. **Portfólio de saberes:** saberes confirmados por trocas, com as evidências, que a própria pessoa pode exportar para o seu PDI.
6. **Mapa de lacunas para RH:** os temas procurados sem oferta orientam formações e convites para quem possa ensinar.
