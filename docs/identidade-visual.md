# Identidade visual

## Essência da marca

Entre Elas representa a energia que surge quando uma experiência encontra uma pergunta. A Faísca é o símbolo desse encontro: uma ideia compartilhada que pode abrir caminhos para quem aprende, para quem ensina e para toda a rede.

A identidade visual foi desenvolvida a partir do kit enviado pela designer, composto pelo símbolo em variações de cor e por uma paleta de rosa-claro, coral, rosa, roxo e azul profundo.

## Ideia do símbolo

O traço assimétrico da Faísca sugere movimento e espontaneidade. Ele evita a aparência de um selo formal: as conexões não seguem sempre um roteiro previsível, e cada conversa pode produzir um resultado diferente.

O símbolo funciona como assinatura do produto e como um elemento de reconhecimento nos momentos em que uma conexão começa, uma ideia aparece ou um aprendizado é compartilhado.

## Personalidade

- **Acolhedora:** aproxima sem intimidar e dá espaço para diferentes vozes.
- **Vibrante:** comunica iniciativa, curiosidade e energia coletiva.
- **Confiante:** valoriza o que cada participante já construiu.
- **Próxima:** fala de forma direta, humana e respeitosa.
- **Colaborativa:** evidencia que conhecimento cresce quando circula.

## Linguagem de cor

O **azul profundo** oferece estabilidade e dá base para a leitura. Os tons de **rosa e coral** trazem calor, presença e movimento. O **roxo** marca momentos de ação e descoberta. O **rosa-claro** cria áreas acolhedoras e destaca o símbolo em fundos escuros.

As cores mais intensas devem chamar atenção para uma ação ou um momento importante; áreas neutras e claras ajudam a manter o conteúdo confortável de ler. A composição busca equilíbrio entre energia visual e confiança.

## Aplicação na experiência

A marca deve funcionar em telas pequenas e grandes, em áreas claras e escuras, sem competir com o conteúdo das participantes. O símbolo pode aparecer sozinho quando o contexto já identifica o produto; em apresentações institucionais, o nome Entre Elas acompanha a marca para deixar a iniciativa imediatamente reconhecível.

A escrita segue o mesmo tom: frases próximas e claras, sem tratar a IA como autoridade e sem transformar a experiência de uma participante em uma classificação. O convite é para descobrir, conversar e compartilhar no próprio ritmo.

## Base de referência

O símbolo e as cores do app vêm dos vetores oficiais enviados pela designer (pasta Logos/SVG): rosa-claro `#ffd5eb`, coral `#fc544c`, rosa `#f25fa8`, roxo `#a330a5`, roxo profundo `#93278f` e azul profundo `#0f094c`. O vetor e a paleta ficam em `lib/identidade.ts`, e `scripts/gerar-marca.mjs` regenera os ícones a partir deles.

## Linguagem da interface

- **Tipografia:** títulos em Fraunces, com tom editorial e humano; textos em Figtree, legível em telas pequenas. As duas fontes são servidas pelo próprio app.
- **Menos caixas:** a estrutura vem do espaço e de linhas finas, não de cartões com borda. Listas de pessoas, comunidades e dicas são abertas, separadas por divisórias.
- **Cor com intenção:** fundos chapados, sem degradês decorativos. O degradê coral → roxo aparece só no próprio símbolo da Faísca.
- **Uma ação principal por bloco:** as demais ações são links de texto.
- **Símbolo próprio:** o ícone da Faísca substitui o brilho genérico usado por produtos de IA.

As regras ficam documentadas em `app/editorial.css`, a última camada de estilos carregada.

## App do piloto

O app real segue o visual aprovado nas telas do pitch (`app/piloto.css`): topo azul-marinho com a marca, fundo rosado, conteúdo em cartões brancos suaves, opções selecionáveis com círculo de seleção, rosa da marca para seleção e números, e o degradê coral → roxo apenas nas barras de gráfico. O painel de liderança usa cartões de indicadores no topo e cartões de gráficos (roscas para conexões entre regionais e áreas, barras para lacunas e oferta).
