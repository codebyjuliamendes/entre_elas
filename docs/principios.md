# Princípios do produto

## 1. Começar pela necessidade real

A experiência nasce do que a participante quer compreender, resolver ou explorar. Um pedido claro orienta a busca e ajuda a outra pessoa a perceber como sua experiência pode contribuir.

**Na prática:** incentivar descrições em linguagem cotidiana; permitir ajustar o pedido; oferecer caminhos quando a primeira sugestão não fizer sentido.

## 2. Valorizar experiências diversas

Conhecimento não se resume a cargo, formação ou especialidade formal. Projetos realizados, desafios enfrentados, aprendizados construídos na prática e formas de colaboração também revelam experiências que podem ajudar outra pessoa.

**Na prática:** dar espaço para que cada participante conte sua trajetória com as próprias palavras e evite tratar um perfil incompleto como falta de capacidade.

## 3. Conectar com contexto

Uma sugestão deve mostrar o que aproximou o pedido da experiência da outra pessoa. A conexão serve para iniciar uma conversa, não para declarar que alguém é a resposta definitiva.

**Na prática:** explicar a relevância percebida, reconhecer incerteza e deixar a participante escolher, recusar ou procurar manualmente.

## 4. Manter a decisão com as pessoas

A Faísca pertence às participantes. A inteligência artificial pode facilitar a descoberta e a preparação, mas não substitui a escuta, o julgamento ou a relação humana.

**Na prática:** tornar o uso de IA compreensível e opcional; permitir revisão; oferecer alternativa manual; não transformar recomendações em avaliação de desempenho.

## 5. Compartilhar com consentimento

Uma conversa pode conter experiências pessoais e aprendizados de valor. A participante decide o que quer registrar e se sua contribuição pode circular para outras pessoas.

**Na prática:** registrar aprendizados por participante e pedir autorização de todas antes de publicar uma dica derivada do encontro.

## 6. Reconhecer reciprocidade

Uma Faísca não é uma consulta unilateral. Quem pede orientação também oferece contexto, perguntas e reflexão; quem compartilha pode aprender com a forma como a outra pessoa aplica ou questiona aquela experiência.

**Na prática:** reconhecer as duas perspectivas no encerramento e não atribuir todo o valor do encontro a uma única participante.

## 7. Aprender com o uso real

O MVP é uma hipótese que precisa ser confrontada com a experiência das participantes. O produto deve evoluir a partir das dúvidas, das conexões que aconteceram e das oportunidades que não foram atendidas.

**Na prática:** combinar sinais de uso com relatos qualitativos e distinguir resultados observados de benefícios ainda esperados.

## Decisões registradas

- **Entrada pelo pedido (19/10/2026):** o cadastro do piloto começa perguntando com o que a pessoa precisa de ajuda. O pedido já aparece pronto na busca e sugere o primeiro objetivo do perfil, que ela pode editar. Quem prefere só conhecer a rede pode pular.
- **Abro Faíscas (19/10/2026):** cada participante define quantos convites topa receber a cada 30 dias (padrão 4; 0 pausa). Convites recusados ou cancelados não ocupam vaga. O banco recusa convites acima do limite, e a curadoria deixa de indicar quem está sem vagas, distribuindo a demanda e protegendo as pessoas mais procuradas.
- **Demonstração sem cadastro (19/10/2026):** o login oferece "Explorar sem cadastro", que abre `/demonstracao`: o app real do piloto rodando com uma rede fictícia de 13 colaboradoras. As respostas vêm de um simulador no navegador (`lib/piloto/demonstracao`), que aplica as mesmas regras de domínio (só a convidada aceita, a dica exige as duas autorizações, quem pausou não recebe convites). Nada chega ao servidor, ao banco ou a provedores de IA, e uma faixa fixa avisa que pessoas, conversas, números, curadoria e videochamada são simulados. O simulador só existe enquanto essa página está aberta, então o fluxo real nunca recebe dados fictícios.
- **Faísca dentro do expediente (19/10/2026):** por orientação da mentoria, a plataforma incentiva o uso no ambiente de trabalho. Muitas mulheres não têm tempo para networking fora do expediente, como mães atípicas e quem cuida de familiares em casa. O convite recomenda horários de segunda a sexta, das 8h às 18h (Brasília), e avisa, sem bloquear, quando alguma opção fica fora disso. O painel de liderança mostra a porcentagem das Faíscas marcadas no horário de trabalho. Condições de cuidado nunca são campo obrigatório nem deduzidas pela IA: a pessoa só conta se quiser, como saber próprio ou entrando na comunidade "Cuidar e Trabalhar".
- **De projeto de hackathon a produto: Tecida (26/10/2026):** depois do 3º lugar no Hackathon Equatorial, a equipe decidiu transformar o app em startup. O produto passa a se chamar **Tecida** (uma rede tecida por mulheres) e a conversa de 20 minutos continua se chamando **Faísca**. A marca da Equatorial sai do produto e fica apenas na história ("nasceu no Hackathon Equatorial"), em materiais de apresentação. Identificadores internos (cookies, chaves de armazenamento, nome do pacote) continuam com o nome antigo para não desconectar ninguém, e backups exportados com o nome antigo continuam aceitos.
