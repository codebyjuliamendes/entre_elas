# Roteiro da demonstração

Objetivo: em 90 segundos, a banca precisa lembrar de uma coisa só, **a Faísca**: um pedido vira uma conversa útil, e a conversa vira conhecimento da empresa.

## Antes de apresentar

- [ ] Abrir o piloto já logada com uma conta de liderança (`PILOT_LEADER_EMAILS`) e outra conta de participante em outro navegador.
- [ ] Ter uma Faísca já realizada, com resumo e dica publicada, para mostrar o fim do ciclo sem esperar.
- [ ] No painel de liderança, clicar em **Atualizar dados reais do piloto** e depois em **Copiar resumo para a apresentação**. Colar os números no slide de resultados.
- [ ] Deixar a demonstração sem cadastro aberta numa aba, como plano B se a rede falhar.
- [ ] Testar o áudio e o vídeo da chamada no próprio local.

## Roteiro (90 segundos)

| Tempo | Tela | Fala |
|---|---|---|
| 0–15 s | Início | "A Ana é técnica de campo em Pelotas. Ela vai apresentar um projeto à diretoria pela primeira vez. Alguém na Equatorial já passou por isso, mas ela não sabe quem." |
| 15–35 s | Pedido e indicações | Digitar o pedido. "A IA indica três colegas e mostra **por que** indicou cada uma: este é o trecho real da experiência da Carla. Ela é de outra regional; a Ana nunca a encontraria sozinha." |
| 35–50 s | Convite e encontro | "Um convite para 20 minutos. A pauta já vem pronta, com chat e vídeo." |
| 50–70 s | Aprendizado e dica | "Depois da conversa, cada uma registra o que aprendeu. Com a autorização **das duas**, o aprendizado vira uma dica para toda a rede, e o saber da Carla fica reconhecido." |
| 70–90 s | Painel de liderança | "Para a Equatorial, isto vira um mapa: quantas conexões entre regionais, se as trocas foram úteis, quais temas as pessoas procuram e ninguém oferece, e que conhecimento está concentrado em uma só pessoa." |

Frase de fechamento: **"Toda mulher da Equatorial sabe algo que outra precisa aprender. O Entre Elas faz esse encontro acontecer e mostra para a empresa o que ela sabe."**

## Perguntas que a banca deve fazer

**"Isso não é só mais uma rede social interna?"**
Não. Não existe feed para rolar. Tudo começa por um pedido concreto e termina em um aprendizado registrado. O produto final é o mapa de saberes confirmado por trocas reais, não o engajamento.

**"Por que só para mulheres? E os homens?"**
O foco responde a uma desigualdade real de acesso a redes e mentoria. A mesma mecânica pode incluir aliados como convidados, e essa é uma decisão de produto que queremos tomar com a Equatorial e com as próprias participantes.

**"E se a IA indicar a pessoa errada?"**
Cada indicação mostra a evidência que a motivou, a participante pode recusar e sempre existe a escolha manual. A IA sugere; quem decide são as pessoas. Ela também nunca é usada para avaliar desempenho.

**"Os dados vão para o Google?"**
No piloto, só de quem autorizou depois de um aviso explícito, porque usamos o plano gratuito para testar. Em produção, a IA roda em contrato corporativo, sem uso dos dados para treinamento. Ver [Caminho para produção](caminho-producao.md).

**"Como funciona para quem está em campo, sem tempo para vídeo?"**
O PWA funciona no celular e indica quando a conexão cai. O próximo passo é oferecer Faísca por áudio, assíncrona e presencial na mesma base, com avisos pelo Teams.

**"Como escala para a empresa toda?"**
Login com a conta Microsoft da empresa, chat e vídeo pelo Teams, IA corporativa e banco gerenciado. A arquitetura já separa domínio, IA e integrações, então trocar provedores não muda as regras do produto.

**"Quem oferece ajuda não vai ficar sobrecarregada?"**
Cada pessoa decide se aceita um convite. A evolução prevista inclui limite mensal de convites e rodas em grupo quando vários pedidos se repetem.

**"Quais são os resultados?"**
Mostrar o slide com os números reais do painel e uma ou duas falas de participantes do piloto.
