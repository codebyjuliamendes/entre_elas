# Avaliação real — 18 a 23 de outubro de 2026

São seis dias de acesso, com até dez participantes e trocas entre contas
independentes. O aplicativo não encerra contas nem apaga dados no dia 23.
Horários civis nesta orientação são de Brasília (America/Sao_Paulo).

## Configuração para a avaliação

Use `APP_MODE=piloto`, `DEMO_MODE=false`, URL HTTPS pública e credenciais do
Supabase hospedado. Em produção, omitir APP_MODE passa a selecionar o piloto;
a apresentação fictícia exige `APP_MODE=apresentacao` explicitamente.
As páginas e APIs usam a mesma decisão de modo. As actions de apresentação
não substituem a curadoria real.

As migrations 001–011 continuam suficientes: este upgrade não exige nova
migration. Não execute `seed:local`, `seed` ou scripts de reset no projeto da
banca. O feed do piloto exclui autoras sem conta verificada no piloto.
Se houver comunidades/eventos de demonstração importados anteriormente,
revise esses registros antes de liberar a agenda; o aplicativo não apaga
conteúdo existente automaticamente.

Para recortar as métricas desde o primeiro dia, configure opcionalmente:

```dotenv
PILOT_STARTS_AT=2026-10-18T03:00:00Z
```

Isso recorta métricas, não bloqueia testes anteriores. Defina os e-mails de
liderança em `PILOT_LEADER_EMAILS`. O cadastro de participantes é aberto.
Siga [ativar-piloto.md](ativar-piloto.md) para Auth, templates e SMTP.

## Diagnóstico técnico no ambiente do deploy

```sh
npm run verificar:piloto -- --ia
```

O comando verifica presença das variáveis sem mostrar valores, modo real,
URLs públicas, acesso às colunas do banco, cadastro por e-mail, geração real
separadamente no Gemini e no Groq, embedding Gemini de 768 dimensões e acesso
a Stream/Daily por consultas. Cada resultado informa exatamente o que comprova.
A geração usa apenas uma frase técnica fictícia; nenhum texto de participante
é consultado ou enviado. As chamadas de IA consomem uma pequena parte da quota.
Não envia e-mail, não cria salas/canais/usuárias e não faz seed. Variável ausente
ou teste que falha produz código de saída 1. Execute no ambiente que realmente
servirá o app: credenciais da Vercel não são injetadas automaticamente na nuvem
Codex. Não copie chaves para o chat.

O diagnóstico não comprova entrega SMTP, funções SQL completas, políticas do
banco ou qualidade de uma conversa. Um resultado positivo de consulta não
substitui os testes funcionais abaixo.

## Ensaio antes do dia 18

1. Abrir a URL pública em celular, criar duas contas com e-mails distintos e
   receber os links reais. Abrir cada link no mesmo navegador que o solicitou.
2. Completar perfis com experiências próprias que aceitam compartilhar, foto e
   objetivos. Ler e decidir sobre o consentimento da IA em cada conta.
3. Indexar os saberes pelo perfil. Buscar um pedido concreto na outra conta;
   conferir identidade, justificativa e evidências. Testar também pedido sem
   conexão adequada: nunca deve aparecer uma pessoa inventada.
4. Convidar a outra conta, aceitar por ela, trocar mensagens e testar áudio/vídeo
   entre dois aparelhos. Recusar câmera deve permitir continuar usando chat.
5. Cada participante salva suas próprias anotações. Gerar a síntese real,
   conferir aprendizados e trechos usados pela IA. Uma revisão manual retira
   os trechos da geração anterior e exige novas autorizações.
6. Autorizar separadamente e publicar uma única dica. Confirmar o saber
   reconhecido somente quando corresponder à experiência da própria pessoa.
7. Reabrir a conta em outro aparelho solicitando um novo link. Conferir dados
   persistidos e, na liderança, contagens reais da rede. Inscrição em evento
   representa interesse, não presença.

## Continuidade durante os seis dias

Gemini é o gerador principal. Groq é outro gerador real, usado em timeout,
limite de requisições, erros temporários de servidor/rede e resposta inválida
após uma correção. Erros de autenticação não são escondidos. Cache indisponível
ou com resposta inválida não deve bloquear uma geração válida.

A busca tem orçamento total de 45 segundos e cancela trabalho de IA ao esgotar
esse prazo. A interface informa espera e mantém a escolha manual disponível.
Não há conteúdo simulado no fallback do piloto. Se ambos os geradores falharem,
a falha chega à interface. A busca vetorial depende exclusivamente de embeddings
Gemini; Groq não substitui esses vetores. Não troque modelo/dimensão sem reindexar.

Cada aprendizado gerado na síntese precisa de uma citação literal de suporte e
as duas autoras precisam estar representadas. A validação confere origem e texto,
mas não prova que a interpretação da IA seja correta: as duas pessoas revisam e
autorizam a publicação. Dados de chat e foto não entram nessa geração.

Há limite de 60 chamadas lógicas de IA por conta/dia, inclusive cache, com
reinício à meia-noite UTC (21h de Brasília do dia anterior). Uma busca pode
consumir interpretação, embedding e ranking. Limites dos planos Gemini/Groq
são independentes e compartilhados pelo projeto: verifique o orçamento no
console antes do dia 18 e acompanhe quotas diariamente. Não existe garantia
de disponibilidade de plano gratuito por seis dias só porque um teste passou.

Não trate `/api/health` como prova de IA: ele verifica somente o banco.
Quando houver falha, o estado salvo deve continuar acessível e nenhuma
participante deve receber um aceite, mensagem ou evidência inventada.
