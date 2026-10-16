# Histórico da transição para o piloto

> O período foi ampliado para **18 a 23 de outubro, seis dias**. O plano atual está em [operação da banca](operacao-banca.md). O diagnóstico abaixo é histórico.

Escopo solicitado em 15/10/2026. Este documento descreve a transição necessária;
não declara o aplicativo atual pronto para uso real.

Atualização: a implementação do modo piloto foi adicionada. O diagnóstico abaixo
registra o ponto de partida; configuração e validação externa continuam pendentes.
Consulte `docs/ativar-piloto.md` e `docs/validacao.md` para o estado entregue.

## Diagnóstico do código atual

- `components/demo` usa catálogo fictício e estado local. Não há sincronização
  multiusuário; trocar chaves de ambiente não liga essa interface ao backend.
- `getCurrentUser` verifica somente cookie de demonstração e rejeita o modo sem
  DEMO_MODE. Não existe conta individual Supabase Auth na aplicação.
- Backend possui perfil, conteúdo, Faíscas com transições/consentimento atômicos,
  Stream e salas privadas Daily. Clientes e UI reais ainda precisam ser ligados.
- Gemini/Groq possuem cache e fallback, mas falta orçamento persistente por conta.
  A busca tem prazo de 9,5 segundos; seu vencimento não garante cancelamento de
  todas as operações em andamento. Isso deve entrar nos testes de concorrência.
- Indicadores atuais são agregados gerais do banco e autorizados pelo modo demo.
  Não servem como painel de liderança do piloto nem como métricas da banca.
- A chamada visual é simulada e a política HTTP desabilita câmera/microfone.
  Integração de vídeo exige política adequada e testes de acesso à sala.
- Migrations habilitam RLS; o acesso de domínio usa service role no servidor.
  Cada operação precisa continuar verificando identidade e participação. Não
  expor service role ao navegador nem abrir políticas públicas para simplificar.

## Ordem de entrega

1. Identidade: login individual, sessão verificada no servidor, renovação e saída;
   vincular auth user a perfil próprio, controlar admissão ao piloto e impedir
   que contas reais assumam perfis/personas do seed. O modo demo deve ser isolado
   e não fornecer entrada alternativa às APIs do piloto.
2. Persistência: ligar a interface aos domínios/API existentes, por entidade.
   Perfil/foto, convites, anotações, consentimento, dicas, comunidades, favoritos
   e inscrições precisam persistir no servidor. Mensagens reais ficam no Stream,
   conforme o contrato existente. localStorage não é a fonte dos dados do piloto.
3. Faísca entre pessoas: pedido → sugestões fundamentadas → convite pendente →
   resposta exclusivamente pela convidada → pauta → chat/sala privada → anotações
   individuais → síntese → autorização independente de ambas → publicação única.
   A solicitante não pode simular o aceite ou a autorização de outra conta.
4. IA: configurar política de dados antes de enviar conteúdo real; orçamento
   atômico por conta/dia, limites de entrada, cache, fallback, erros recuperáveis,
   tempos máximos e acompanhamento de consumo. Ausência de IA não deve criar
   resultados fictícios apresentados como reais. Conversas de chat não alimentam
   o mapa de saberes; sugestões que enviem trechos ao provedor precisam de política
   explícita de uso e privacidade.
5. Primeiro acesso: três passos sobre a Faísca, perfil em um minuto com sugestão
   de IA editável/confirmada e alternativa manual, primeiro pedido sugerido.
6. Conteúdo: preparar comunidades/posts identificados por origem e eventos com
   datas relativas ao piloto. Personas são opcionais e explicitamente identificadas;
   automação não recebe identidade nem consentimento de uma participante real.
7. Operação: convites/notificações persistentes; atualização entre contas; retomada
   após fechar navegador; logs sem conteúdo pessoal; monitoramento e recuperação.
8. Liderança: autorização por papel e período/coorte do piloto. Contar somente
   eventos confirmados no servidor, separar participantes reais de personas e
   tornar explícitas as definições de encontro realizado e saber reconhecido.
   Mensagens devem usar métricas do Stream, sem copiar seu conteúdo ao Supabase.

## Validação para liberar o piloto

- Duas contas reais em navegadores separados: perfil próprio e dados persistidos
  após sair/entrar e mudar de dispositivo; nenhuma operação em nome da outra.
- Convite recebido na segunda conta, aceite e recusa reais; cancelar/retentar sem
  duplicar canais, salas, resumos ou publicações. Falha externa não apaga o convite.
- Sala privada e chat acessíveis só às participantes, incluindo após cancelamento
  e término; nenhum token em logs ou URL pública compartilhada inadvertidamente.
- As duas anotações corretas alimentam a síntese; uma autorização sozinha não
  publica; revisão concorrente não reutiliza consentimento da versão anterior.
- Quota atômica sob concorrência, reset diário documentado, Gemini indisponível,
  Groq indisponível, cache e retomada sem inventar resultados de produção.
- Cadastro/login com e-mails reais no domínio de produção; entrega e expiração
  de links/códigos, recuperação, logout e restrição da banca verificados.
- Painel reproduz contagem conferida das atividades do piloto e exclui seed,
  simulações, testes técnicos e repetições. Acesso de liderança verificado.
- Nenhuma ativação externa é comprovada só com testes locais ou mocks.

## Informações ainda necessárias

- Quantidade de participantes e uso simultâneo/individual; datas e fuso do piloto.
- Login por link mágico ou códigos individuais entregues à banca.
- Política/provedor de IA para dados reais e comunicação de privacidade.
- Domínio da aplicação, contas/credenciais seguras e acesso às migrations/Auth.

WhatsApp e publicação diária automática por personas são extensões: exigem
configuração de provedor, opt-in/agendamento e orçamento. Não são pré-requisitos
para implementar contas, persistência e a Faísca entre pessoas reais. Nenhuma
mensagem será enviada à banca sem instrução explícita para esse envio.
