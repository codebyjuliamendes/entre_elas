# Identidade visual — referência da designer

A referência disponível é a imagem enviada no chat: símbolo de Faísca assimétrico,
variantes claras/escuras e cinco faixas de cor. Não há fonte, vetor original nem
valores oficiais. O símbolo foi reconstruído manualmente em SVG; as cores são
aproximações da imagem, não extrações de um arquivo original sem compressão.

| Cor | Aproximação | Aplicação |
| --- | --- | --- |
| Rosa-claro | `#FFD4E8` | Símbolo sobre fundos escuros, acolhimento |
| Coral | `#FF514B` | Destaques, ponto da assinatura e degradê |
| Rosa | `#EF59A4` | Acentos e evidências da Faísca |
| Roxo | `#A32FA6` | Botões primários e links |
| Azul profundo | `#100C4D` | Texto, navegação e abertura |

O fundo neutro rosado é `#FFF8FB`. Texto branco sobre roxo tem contraste de
aproximadamente 5,98:1; azul sobre rosa-claro, 13,40:1. Coral e rosa vivo não
recebem texto branco pequeno: são acentos ou fundos para texto azul. O degradê
é decorativo; o acesso principal permanece sobre cor sólida legível.

`lib/identidade.ts` guarda o traço e as cores; `components/Marca.tsx` aplica o
mesmo símbolo no login, onboarding, cabeçalhos e navegação. `app/identidade.css`
alinha as interfaces de piloto e apresentação. Rótulos de demonstração, dados,
consentimentos, permissões e integrações não foram alterados.

## Arquivos da marca

- `public/marca-simbolo.svg`: azul, fundo transparente.
- `public/marca-simbolo-branco.svg`: branco, fundo transparente.
- `public/marca-simbolo-rosa.svg`: rosa-claro, fundo transparente.
- `public/icon.svg`, `icon-192.png`, `icon-512.png`: ícone instalável com degradê.

`node scripts/gerar-marca.mjs` atualiza esses assets a partir do vetor versionado,
sem rede. Usa o sharp presente na instalação do Next. Os PNGs ficam versionados;
nenhuma nova dependência é necessária para executar o app. O símbolo ocupa uma
área central com margem para recortes maskable. O manifest e a cor do navegador
usam a nova identidade; o service worker incrementa o cache de recursos públicos.

## E-mail

Os dois templates conservam `{{ .ConfirmationURL }}` e o fluxo PKCE. O ícone PNG
usa Site URL do Auth; o nome e o botão continuam visíveis se imagens forem
bloqueadas. Copiar os HTMLs atualizados no Supabase ainda é uma configuração
externa: alterações no Git não modificam os templates hospedados nem enviam e-mails.
As capturas locais são prévias de navegador, não testes de entrega em Gmail/Outlook.
