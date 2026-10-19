# Entre Elas

### Conhecimento compartilhado transforma conexões em oportunidades.

**Entre Elas** é um MVP criado para o hackathon da Equatorial. A proposta é aproximar mulheres que querem aprender de colegas que podem compartilhar experiências, reconhecendo conhecimentos que muitas vezes ficam invisíveis no dia a dia de uma organização.

[**Acessar o MVP**](https://entre-elas-sigma.vercel.app/)

## O desafio

Nas organizações, experiências valiosas nem sempre chegam a quem precisa delas. Uma colaboradora pode estar buscando orientação enquanto outra já enfrentou um desafio parecido, mas as duas não sabem que poderiam se ajudar.

O Entre Elas transforma essa busca em uma rede de troca: cada pessoa compartilha o que sabe, indica o que quer aprender e encontra conexões relevantes para conversar.

## Como funciona

1. **Monte seu perfil:** conte suas experiências, conhecimentos e objetivos.
2. **Encontre uma conexão:** a Faísca usa os saberes e o pedido para sugerir pessoas que possam contribuir.
3. **Convide para uma conversa:** as participantes combinam uma Faísca de 20 minutos.
4. **Compartilhe aprendizados:** cada pessoa registra o que levou da conversa.
5. **Reconheça o conhecimento:** com autorização das duas, um aprendizado pode virar uma dica para a rede.

## O que torna a Faísca especial

A Faísca é o encontro entre duas pessoas com algo significativo para trocar. A IA ajuda a interpretar o pedido, encontrar experiências relacionadas e preparar uma pauta. As sugestões devem se apoiar em informações do perfil e em evidências das trocas, para que a participante entenda por que aquela conexão foi recomendada.

A IA é uma facilitadora: as pessoas escolhem se querem usá-la, revisam o que será compartilhado e mantêm uma alternativa manual. A publicação de um aprendizado exige autorização de ambas as participantes.

## O MVP reúne

- Perfis com foto, conhecimentos e objetivos de aprendizagem.
- Rede e biblioteca de saberes.
- Sugestões de conexão apoiadas por IA.
- Convites e encontros Faísca entre participantes.
- Chat e chamada de vídeo, conforme a disponibilidade das integrações.
- Registro de aprendizados e publicação consentida de dicas.
- Agenda, comunidades e painel de indicadores da rede.
- Interface adaptada a celulares e computadores.

## Experimente

O MVP está publicado em [entre-elas-sigma.vercel.app](https://entre-elas-sigma.vercel.app/). O acesso de participantes usa link por e-mail. A entrega do e-mail e a disponibilidade de recursos conectados a serviços externos dependem da configuração do ambiente do piloto.

O produto está em validação como MVP de hackathon. Os testes automatizados locais cobrem os principais fluxos de domínio, mas não substituem a verificação dos serviços externos no ambiente publicado.

## Tecnologias

- Next.js 16, React 19 e TypeScript
- Supabase para autenticação e dados
- Gemini para IA e busca semântica, com Groq como alternativa de geração
- Stream e Daily para chat e vídeo
- Vitest e Playwright para validação automatizada

## Princípios do produto

- **Reconhecer saberes:** valorizar experiências práticas e aprendizados compartilhados.
- **Conectar com contexto:** explicar por que uma sugestão pode ser útil.
- **Manter as pessoas no controle:** permitir revisão, consentimento e alternativa manual.
- **Compartilhar com cuidado:** publicar aprendizados somente com autorização de quem participou.
- **Aprender em rede:** transformar conversas em conhecimento acessível à comunidade.

## Documentação do projeto

- [Visão do MVP e roteiro de apresentação](docs/mvp.md)
- [Operação do piloto](docs/operacao-banca.md)
- [Ativação e requisitos do piloto](docs/ativar-piloto.md)
- [Identidade visual](docs/identidade-visual.md)
- [Validação e limites conhecidos](docs/validacao.md)

---

**Entre Elas — uma Faísca pode transformar experiência em oportunidade.**
