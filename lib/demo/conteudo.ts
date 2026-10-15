import { z } from "zod";
import { postComunidadeSchema } from "./schemas";
import { CARLA_ID } from "./catalogo";
export const postsIniciais = z.array(postComunidadeSchema).parse([
  {
    id: "10000000-0000-4000-8000-000000000001",
    comunidade_id: "tecnologia",
    autora_id: "00000000-0000-4000-8000-000000000004",
    titulo: "Um indicador pode contar uma boa história",
    corpo:
      "Antes de abrir a planilha, pergunte: qual decisão esse dado precisa ajudar a tomar? Isso mudou a forma como organizo meus exemplos de indicadores. Que pergunta ajuda você a começar?",
    created_at: "2026-10-15T12:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    comunidade_id: "lideranca",
    autora_id: CARLA_ID,
    titulo: "Não espere saber tudo para compartilhar",
    corpo:
      "Qual foi o melhor conselho que você recebeu no começo da carreira? O meu foi: não espere saber tudo para compartilhar o que já sabe. Uma experiência pequena também pode abrir caminhos.",
    created_at: "2026-10-15T11:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    comunidade_id: "campo",
    autora_id: "00000000-0000-4000-8000-000000000003",
    titulo: "A escuta também é uma ferramenta de segurança",
    corpo:
      "Em um cenário fictício de treinamento, começamos pela pergunta: o que preocupa você nesta atividade? Escutar a equipe ajuda a perceber riscos antes de escolher a solução.",
    created_at: "2026-10-15T10:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    comunidade_id: "bem-estar",
    autora_id: "00000000-0000-4000-8000-000000000007",
    titulo: "Uma pausa que aproxima",
    corpo:
      "Reservar vinte minutos para conversar sem julgamento pode mudar o dia de alguém. Qual pequeno hábito ajuda você a cuidar das suas conexões?",
    created_at: "2026-10-15T09:00:00Z",
  },
]);
export const dicasIniciais = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    perfil_id: CARLA_ID,
    titulo: "Antes dos slides, escolha a decisão",
    dica: "Uma apresentação fica mais clara quando começa por uma pergunta: qual decisão precisa ser tomada? Organize objetivo, evidências e próximo passo. Os slides vêm depois dessa estrutura.",
    saber_reconhecido: "Apresentações à diretoria",
    categoria: "Carreira",
    fonte: "demonstracao" as const,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    perfil_id: "00000000-0000-4000-8000-000000000004",
    titulo: "Transforme números em uma conversa",
    dica: "Escolha um indicador por vez. Explique o que ele mede, compare com uma referência e conte por que a mudança importa. Uma boa pergunta vale mais do que uma tela cheia de gráficos.",
    saber_reconhecido: "Comunicação de dados",
    categoria: "Tecnologia",
    fonte: "demonstracao" as const,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    perfil_id: "00000000-0000-4000-8000-000000000007",
    titulo: "Mentoria começa pela escuta",
    dica: "Antes de oferecer um conselho, entenda o desafio. Pergunte o que a pessoa já tentou e qual apoio seria útil. Termine a troca combinando um pequeno passo possível.",
    saber_reconhecido: "Mentoria e escuta",
    categoria: "Liderança",
    fonte: "demonstracao" as const,
  },
];
