# MVP visual para apresentação

O MVP mantém Next.js 16 e React 19, por escolha da usuária, com Tailwind,
Framer Motion, primitivas Radix no padrão shadcn/ui, Lucide e Sonner.
A interface é mobile-first, com navegação inferior no celular e uma área de trabalho
com menu lateral e colunas no desktop. Rotas: Início, Rede, Biblioteca de saberes,
Agenda, Chats, Comunidades, Perfil e Configurações. `/dev` continua independente.

## Executar e publicar na Vercel

1. Node >=22, `npm ci`, `npm run dev`.
2. Sem nenhuma chave, o modo de apresentação funciona: pedido, match com
   evidência do catálogo fictício, convite e aceite simulado, pauta, chamada
   simulada de vinte minutos, anotação, dica, quiz, autorizações e publicação.
3. Para produção: `npm run build` e `npm start`. Na Vercel, selecione o projeto
   Next.js e mantenha as variáveis padrão para uma apresentação sem dependências externas.
4. Para usar IA de verdade apenas na apresentação, configure PITCH_AI_MODE=live,
   OPENROUTER_API_KEY e OPENROUTER_MODEL com um modelo disponível na conta.
   O modelo gratuito sugerido pode mudar ou ter quota indisponível. Qualquer falha,
   JSON inválido ou prazo acima de 7,5 s ativa o exemplo fictício identificado.

## Roteiro

- No Início, clique “Apresentar um projeto” e encontre sua Faísca.
- Veja a candidata e sua evidência; o catálogo contém oito perfis fictícios, com sugestões locais por especialidade e opção de buscar outra.
- Convide para café e clique “Simular aceite de Carla”. Nenhum convite externo é enviado.
- Leia a pauta, entre na chamada e teste microfone/câmera simulados. Nenhum
  dispositivo é acessado. Encerre o encontro e escreva um aprendizado fictício.
- Sintetize, responda o quiz e confira os acertos. A dica só pode ser publicada
  depois de Ana autorizar e de simular explicitamente a autorização de Carla.
- Abra o perfil de Carla: o saber e a dica reconhecidos aparecem e persistem após reload.
- Agenda contém o café, filtros por tipo/data e confirmação de eventos fictícios.
- Chats oferece conversas locais com respostas simuladas; não usa Stream nem IA.
- Comunidades permite buscar, participar/sair, escrever posts, comentar e curtir, com persistência local.
- Perfil permite editar a bio e os saberes de Ana, editar objetivos, consultar reconhecimentos e acessar dicas salvas.

## Persistência e limites

O catálogo inicial é fictício e o progresso fica em localStorage sob
`entre-elas:apresentacao:v1`. Isso permite executar sem Supabase, simular uma
apresentação e publicar na Vercel imediatamente. Não há sincronização entre dispositivos.
Se localStorage estiver indisponível, o fluxo segue em memória até a página fechar.
Conteúdo simulado tem identificação visível; não é prova de IA ou integração real.

Este modo não modifica as tabelas reais, não autentica pessoas reais, não cria
canais/salas reais nem publica dados no Supabase. As APIs reais e as regras de
consentimento, privacidade, Stream, Daily e Gemini/Groq permanecem disponíveis
conforme docs/api.md e docs/demo.md, pendentes de credenciais e validação externa.

O banco existente já tem pgvector e schema completo. Use suas migrations e
`supabase/seed/mvp.sql` para um seed mínimo de três perfis. Os vetores seguem em
768 dimensões para preservar compatibilidade: não execute um schema alternativo
384 sobre o banco atual nem trunque vetores. O seed não inventa embeddings.

## Verificações

`npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.
`npm run test:db` verifica os domínios reais com o banco local preparado.
`npm run test:e2e` gera o build e executa os dez cenários contra um servidor
de produção na porta 3200. Usa `/usr/bin/chromium` quando disponível ou
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Em máquinas sem Chromium, instale pelo
Playwright (`npx playwright install chromium`), mantendo TLS e verificação de artefatos.

## Recursos do upgrade

- `/rede`: busca sem acentos, filtros por área/regional e conexão direta com uma pessoa.
- `/saberes`: busca, favoritos, compartilhamento e leitura de dicas; publicações novas incluem quiz.
- Busca global no cabeçalho, também por Ctrl/Cmd+K no desktop.
- Agenda em America/Sao_Paulo, navegação entre semanas/anos, exportação ICS,
  cancelamento de convites aceitos e retomada do rascunho de cada encontro.
- `/configuracoes`: exportar backup JSON, importar até 10 MB com confirmação e
  validação, restaurar dados e consultar instruções de instalação.
- Estado interno v2 com migração da chave v1 existente. Convites e publicações
  usam IDs estáveis; consentimento exige encontro concluído e ambas as autorizações.
  Rascunhos anteriores ficam associados ao respectivo encontro.
- Avisos para modo offline, armazenamento indisponível ou conteúdo corrompido.
  Um backup inválido não substitui o estado atual; dados corrompidos originais
  ficam protegidos até uma restauração ou limpeza explícita.
- Ícones instaláveis, manifest e service worker. O cache contém apenas recursos
  públicos; APIs e respostas personalizadas não entram no cache. A jornada já
  carregada pode usar exemplos locais offline; novas navegações podem mostrar
  a página offline. Isso não equivale a sincronização offline do backend real.

A migração e os backups são de apresentação: use somente dados fictícios.
A pipeline em `.github/workflows/qualidade.yml` executa lint, tipos, testes,
auditoria de produção, navegador e banco local em jobs separados.
