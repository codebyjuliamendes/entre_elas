# Ativar o piloto real da banca

O piloto foi dimensionado inicialmente para até dez pessoas, com cadastro aberto,
link mágico por e-mail e Faíscas
entre participantes reais. `APP_MODE=apresentacao` mantém o modo anterior;
`APP_MODE=piloto` usa `/piloto` e redireciona as rotas antigas. Nunca use as
personas do seed como contas de jurados. O frontend do piloto usa APIs e dados
no Supabase; não há aceite simulado nem fonte de dados em localStorage.

## Configuração externa necessária

1. Aplique as migrations em ordem no Supabase escolhido, incluindo 006–011.
   Elas adicionam contas vinculadas à identidade Auth, favoritos, limites atômicos,
   miniaturas de foto, busca vetorial restrita e metadados de mensagens e revisão atômica da síntese. Não
   habilite políticas públicas: a service role fica exclusivamente no servidor.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave
   pública do projeto) e `SUPABASE_SERVICE_ROLE_KEY` nas variáveis seguras.
   Postgres/PostgREST locais não oferecem Supabase Auth nem entrega de e-mail.
3. Defina `APP_URL` como a URL HTTPS pública da aplicação. No Supabase Auth,
   habilite login por e-mail, configure Site URL e permita exatamente
   `https://SEU-DOMINIO/auth/callback`. Use SMTP próprio para envio público e
   verifique limites de entrega da conta. Configure expiração do link em dez
   minutos, compatível com o cookie temporário PKCE.
4. Não há lista de convidados: qualquer e-mail válido pode solicitar o link e
   entrar após a confirmação. Habilite novos cadastros no Supabase Auth.
   `PILOT_LEADER_EMAILS` define explicitamente quem
   vê as métricas; não existe promoção de papel pelo formulário de perfil.
   `PILOT_STARTS_AT` pode fixar o início UTC das métricas. Sem valor, utiliza a
   criação da primeira conta desse piloto; não mistura contagens do seed.
   Configure os dois templates e o remetente seguindo `supabase/templates/README.md`.
5. Configure Gemini/Groq, modelos/embedding 768 e Stream/Daily com as credenciais
   reais. Nenhuma geração, mensagem ou chamada remota foi comprovada sem elas.
   A busca vetorial exige embeddings reais: o perfil oferece indexação dos saberes.
6. Ative `APP_MODE=piloto`, desative `DEMO_MODE` e faça build/deploy. O código
   também bloqueia o login/debug fictícios se DEMO_MODE ficar ligado por engano.
   Este documento não executa deploy nem modifica o Supabase hospedado.

## Primeiro acesso e operação

O link é pessoal e deve ser aberto no mesmo navegador/dispositivo em que foi
solicitado: PKCE verifica o vínculo com o cookie HttpOnly temporário. Para entrar
em outro aparelho, solicite outro link; a conta e os dados continuam os mesmos.
A sessão usa cookies HttpOnly/SameSite e renovação com refresh token, sem expor
service role ao navegador. A identidade é verificada no Auth a cada acesso.

O onboarding explica pedido/conexão, troca de vinte minutos e perfil. A IA pode
sugerir um rascunho de perfil que a pessoa revisa antes de salvar. A alternativa
manual funciona sem consentimento de IA. O perfil e a foto ficam no servidor;
miniaturas raster compactadas ficam no Postgres e só são exibidas a contas do
piloto. Não é necessário usar o bucket Storage para essa miniatura do MVP.

A primeira pessoa verá a rede em formação até outra concluir o perfil. A busca
com IA só indica participantes que concluíram o perfil, autorizaram IA e têm
saberes indexados. Se não houver resultados ou quota, a lista de pessoas permite
convite manual. Nunca se inventa uma pessoa ou uma resposta para preencher a rede.

A convidada aceita na própria conta. A aplicação tenta criar Stream, sala privada
Daily e pauta; falhas ficam visíveis e permitem retentativa. Nenhuma mensagem
é respondida automaticamente. O chat tem atualização a cada dez segundos;
convites e conteúdo, a cada quinze segundos enquanto a aba está visível.
Anotações são individuais e a síntese exige registros das duas participantes.
Há conclusão manual sem IA. A dica só publica após ambas autorizarem; publicar
novamente retorna a mesma publicação. Antes da publicação, uma revisão revoga
as duas autorizações; autorizar uma versão desatualizada é recusado no banco.
Cada pessoa pode retirar sua própria autorização enquanto a dica não foi publicada. No piloto, um quiz de leitura determinístico
permite publicar sem depender de uma nova chamada de IA.

A extração de saberes é explícita na Faísca concluída e autorizada. Exige consentimento
atual de IA das duas e evidencia literal nas anotações de cada autora. Os saberes
extraídos só ficam públicos depois de a própria pessoa confirmá-los no perfil.
O worker geral não está autorizado implicitamente a enviar textos reais: os
wrappers de IA recusam chamadas sem identidade/consentimento no modo piloto.

## Privacidade, quotas e métricas

O app informa que Gemini gratuito pode usar textos para melhorar produtos, lista
Google/Groq e permite autorizar/revogar IA. Consentimento é registrado com data e
versão; revogar bloqueia novos envios, sem alegar apagar dados já processados.
Pauta e resumo verificam consentimento das duas antes de processar seus perfis ou
anotações. Fotos não vão à IA. Sugestões de IA a partir de chat/grupo ficam
bloqueadas no piloto. Não use dados sensíveis, confidenciais ou de terceiros.

Limite persistente de sessenta chamadas lógicas de IA por pessoa/dia, incluindo
cache, com janela UTC e incremento atômico. Provider mantém cache e fallback Groq;
embeddings continuam Gemini, sem substituir vetores por números fictícios. Se
ambos falharem, o app informa indisponibilidade e mantém dados já salvos.
Pedidos de link têm limite de cinco por e-mail/hora e cem por hora no aplicativo,
além dos limites do Auth/SMTP. O limite global protege a quota no cadastro aberto.

Painel acessível somente aos e-mails de liderança configurados. Contagens do
piloto: participantes, Faíscas realizadas entre contas reais, dicas dessas trocas,
saberes confirmados de origem Faísca, inscrições em eventos e metadados de
mensagens confirmadas pelo Stream. IDs/autoria/data de mensagens são persistidos
para contagem; o texto continua no Stream. Inscrição não é presença realizada.

O painel contabiliza inscrições, sem alegar que a roda ocorreu. A liderança pode agendar uma roda real com horário/local/link. O conteúdo de
exemplo já existente tem identificação de origem; nenhuma roda é apresentada
como organizada sem que alguém a agende. WhatsApp, respostas/publicações diárias
de personas e presença automática em rodas não foram implementados.

## Verificações obrigatórias no ambiente público

Antes de convidar a banca: testar entrega de e-mail/PKCE/renovação/logout com duas
contas, acesso em outro aparelho, persistência, convite/aceite/recusa, chat real,
câmera/microfone e encerramento da sala, geração/embeddings/cache/quota/fallback,
autorizações independentes/publicação, indexação/confirmação de saberes e painel.
As salas são privadas; tokens emitidos no piloto expiram em cinco minutos e só
são entregues às participantes de encontros aceitos. Cancelar/concluir tenta
excluir a sala; falha externa fica indicada para retentativa e pode deixar um
token emitido válido para novos acessos até expirar. A expiração do token não
garante expulsão de uma chamada já iniciada se a exclusão remota falhar. Isso requer verificação real com Daily.

Os testes `test:e2e:piloto` usam contrato Auth local simulado e Postgres real,
não enviam e-mails reais nem usam os serviços externos. Não representam teste
end-to-end do Supabase Auth hospedado, SMTP, Gemini/Groq, Stream ou Daily.
Não liberar o piloto externo apenas com esses testes locais.

## Recuperação e retomada

A aba e a Faísca aberta ficam na URL; recarregar ou voltar/avançar no navegador
retoma a visualização, com acesso novamente verificado no servidor. A URL não
concede permissão a uma pessoa que não participa do encontro.

Repetir o mesmo envio de convite após perder a resposta usa a mesma chave da
solicitação e recupera o registro original. A migration 011 impede duplicação
sob concorrência e rejeita reutilizar a chave com outro conteúdo. A chave vale
para aquela tentativa na página; editar o pedido cria uma nova intenção de envio.
Não é uma autorização para repetir automaticamente outras operações de escrita.

Respostas antigas de atualização não sobrescrevem o estado mais recente. Sem
rede, o app informa a situação e atualiza ao reconectar. Rascunhos ainda não
salvos permanecem apenas na página aberta; esse aviso não promete salvamento
offline. Falha temporária ao renovar sessão não força logout; pedidos simultâneos
compartilham a renovação. Uma sessão realmente inválida exige novo login.

A renovação da sessão e o novo login também preservam aba/encontro. O retorno
é limitado a `/piloto`, com parâmetros validados; URLs externas são descartadas.
