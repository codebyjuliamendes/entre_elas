import type { DadosPiloto } from "@/lib/piloto/dados";
import type { IndicadoresPiloto } from "@/lib/piloto/metricas";
import type { Relato } from "@/lib/piloto/relatos";
import { avaliarIndexacao } from "@/lib/domain/perfil-indexacao";
import { calcularDisponibilidade } from "@/lib/domain/disponibilidade";

// Rede fictícia da demonstração pública. Nenhum nome, número ou relato aqui é real:
// tudo existe só no navegador de quem visita e some ao recarregar a página.
export type Pessoa = DadosPiloto["pessoas"][number];
export type Mensagem = {
  id: string;
  texto: string;
  autora_id: string;
  created_at: string;
};
export type Comentario = { id: string; corpo: string; autora_id: string };
export type EstadoDemonstracao = {
  dados: DadosPiloto;
  mensagens: Record<string, Mensagem[]>;
  comentarios: Record<string, Comentario[]>;
  relatos: Relato[];
  indicadores: IndicadoresPiloto;
  /** Experiências que a curadoria simulada cita como evidência, por pessoa. */
  experiencias: Record<string, string[]>;
  limites: Record<string, number>;
  /** Faíscas criadas durante a visita, em que a colega fictícia responde sozinha. */
  criadasNaVisita: string[];
};

export const idDemo = (n: number) =>
  `de000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const ANA = idDemo(1);

type Semente = [
  n: number,
  nome: string,
  cargo: string,
  area: string,
  cidade: string,
  regional: string,
  interesses: string[],
  objetivos: string[],
  experiencias: string[],
  limite: number,
];
const SEMENTES: Semente[] = [
  [
    1,
    "Ana Ribeiro",
    "Técnica de manutenção de redes",
    "Operações",
    "Bragança, PA",
    "Pará",
    [
      "Inspeção de redes de distribuição",
      "Segurança em campo",
      "Inspeção com drones",
    ],
    [
      "Apresentar resultados para a diretoria",
      "Liderar equipes de campo",
      "Trabalhar com indicadores",
    ],
    [
      "Fez mais de 300 inspeções de rede no interior do Pará",
      "Ajudou a testar drones na inspeção de linhas em Bragança",
    ],
    4,
  ],
  [
    2,
    "Carla Souza",
    "Gerente de projetos",
    "Engenharia",
    "São Luís, MA",
    "Maranhão",
    [
      "Apresentações à diretoria",
      "Gestão de projetos",
      "Indicadores de desempenho",
    ],
    ["Liderar equipes de campo"],
    [
      "Apresentou o plano de expansão do Maranhão ao comitê de diretoria em 2025",
      "Montou o roteiro de três indicadores usado nas reuniões mensais de obras",
    ],
    4,
  ],
  [
    3,
    "Renata Lima",
    "Engenheira de segurança do trabalho",
    "Segurança do trabalho",
    "Teresina, PI",
    "Piauí",
    ["Segurança em campo", "NR-10", "Análise de risco antes da manobra"],
    ["Apresentar resultados para a diretoria"],
    [
      "Criou a conversa de cinco minutos antes da manobra adotada por equipes do Piauí",
      "Coordena a semana de prevenção de acidentes da regional",
    ],
    4,
  ],
  [
    4,
    "Patrícia Rocha",
    "Técnica de automação",
    "Operações",
    "Macapá, AP",
    "Amapá",
    ["Automação de subestações", "Telecomando", "Leitura de diagramas"],
    ["Liderar equipes de campo", "Falar em público"],
    [
      "Participou da automação de quatro subestações no Amapá",
      "Ensina leitura de diagrama unifilar para técnicas recém-chegadas",
    ],
    4,
  ],
  [
    5,
    "Juliana Alves",
    "Analista de dados",
    "Tecnologia",
    "Belém, PA",
    "Pará",
    ["Power BI", "Excel avançado", "Indicadores de desempenho"],
    ["Falar em público"],
    [
      "Construiu o painel de qualidade do fornecimento usado pela regional Pará",
      "Ensina a escolher três indicadores antes de abrir o Power BI",
    ],
    2,
  ],
  [
    6,
    "Fernanda Costa",
    "Supervisora de atendimento",
    "Comercial",
    "Maceió, AL",
    "Alagoas",
    ["Liderança de equipes", "Gestão de conflitos", "Atendimento ao cliente"],
    ["Trabalhar com indicadores"],
    [
      "Assumiu a primeira supervisão aos 29 anos com uma equipe de 22 pessoas",
      "Reduziu reclamações reabertas com uma rotina de retorno ao cliente",
    ],
    4,
  ],
  [
    7,
    "Beatriz Nunes",
    "Engenheira de planejamento",
    "Planejamento da expansão",
    "Goiânia, GO",
    "Goiás",
    ["Orçamento de obras", "Planejamento de rede", "Geração distribuída"],
    ["Negociar com fornecedores"],
    [
      "Planeja o orçamento das obras de expansão em Goiás",
      "Montou um modelo simples de orçamento para obras pequenas",
    ],
    4,
  ],
  [
    8,
    "Larissa Moura",
    "Analista de gente e gestão",
    "Recursos humanos",
    "Porto Alegre, RS",
    "Rio Grande do Sul",
    ["Plano de desenvolvimento", "Feedback", "Mentoria"],
    ["Trabalhar com indicadores"],
    [
      "Conduz a trilha de desenvolvimento de novas líderes da distribuidora",
      "Ajuda colegas a transformar experiências em um PDI com uma primeira ação",
    ],
    4,
  ],
  [
    9,
    "Camila Duarte",
    "Coordenadora de manutenção",
    "Operações",
    "Imperatriz, MA",
    "Maranhão",
    [
      "Liderança de equipes",
      "Escalas de plantão",
      "Gestão de equipes terceirizadas",
    ],
    ["Apresentar resultados para a diretoria"],
    [
      "Foi a primeira mulher a coordenar a manutenção em Imperatriz",
      "Lidera 40 eletricistas, entre próprios e terceirizados",
    ],
    4,
  ],
  [
    10,
    "Marina Teles",
    "Especialista em regulação",
    "Regulação",
    "Brasília, DF",
    "Holding",
    ["Regulação do setor elétrico", "Negociação", "Comunicação clara"],
    ["Gestão de projetos"],
    [
      "Representa a empresa em audiências públicas da ANEEL",
      "Prepara negociações com roteiro de concessões antes da reunião",
    ],
    0,
  ],
  [
    11,
    "Sofia Barros",
    "Eletricista de linha viva",
    "Operações",
    "Parnaíba, PI",
    "Piauí",
    ["Linha viva", "Segurança em campo", "Primeiros socorros"],
    ["Inspeção com drones", "Crescer na carreira"],
    [
      "Uma das primeiras eletricistas de linha viva da regional Piauí",
      "Instrutora de primeiros socorros da equipe de Parnaíba",
    ],
    4,
  ],
  [
    12,
    "Helena Prado",
    "Analista financeira",
    "Finanças",
    "São Luís, MA",
    "Maranhão",
    ["Orçamento", "Excel avançado", "Negociação com fornecedores"],
    ["Comunicação clara"],
    [
      "Negociou a revisão de contratos de frota com três fornecedores",
      "Monta planilhas de orçamento que a equipe de obras usa todo mês",
    ],
    4,
  ],
  [
    13,
    "Débora Freitas",
    "Analista de sustentabilidade",
    "Sustentabilidade",
    "Maceió, AL",
    "Alagoas",
    [
      "Diversidade e inclusão",
      "Conciliar trabalho e cuidado",
      "Comunicação clara",
    ],
    ["Trabalhar com indicadores"],
    [
      "Cuida da mãe idosa e combinou com a equipe uma rotina que cabe no cuidado",
      "Organizou o primeiro censo de diversidade da regional Alagoas",
      "Escreve as campanhas internas de segurança com linguagem simples",
    ],
    4,
  ],
];

export function criarDemonstracao(agora = new Date()): EstadoDemonstracao {
  const t = agora.getTime();
  const iso = (horas: number) => new Date(t + horas * 3600000).toISOString();
  // Horários redondos ajudam a leitura: "amanhã às 10h", não "às 10h37".
  // Encontros em dias úteis: a Faísca acontece dentro do expediente.
  const hora = (dias: number, h: number) => {
    const d = new Date(t + dias * 86400000);
    if (d.getDay() === 6) d.setDate(d.getDate() + (dias < 0 ? -1 : 2));
    if (d.getDay() === 0) d.setDate(d.getDate() + (dias < 0 ? -2 : 1));
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };
  const base = (n: number, horas = -24 * 20) => ({
    id: idDemo(n),
    created_at: iso(horas),
    updated_at: iso(horas),
  });
  const pessoas: Pessoa[] = SEMENTES.map(
    ([n, nome, cargo, area, cidade, regional, interesses, objetivos]) => ({
      ...base(n),
      nome,
      cargo,
      area,
      cidade,
      regional,
      foto_url: null,
      interesses,
      objetivos,
    }),
  );
  const experiencias = Object.fromEntries(
    SEMENTES.map((s) => [idDemo(s[0]), s[8]]),
  );
  const limites = Object.fromEntries(SEMENTES.map((s) => [idDemo(s[0]), s[9]]));
  const [CARLA, RENATA, , JULIANA, , BEATRIZ, , CAMILA, , SOFIA] = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ].map(idDemo);
  const faisca = (
    n: number,
    dados: Partial<DadosPiloto["faiscas"][number]> &
      Pick<
        DadosPiloto["faiscas"][number],
        "solicitante_id" | "convidada_id" | "pedido" | "tema" | "status"
      >,
  ): DadosPiloto["faiscas"][number] => ({
    ...base(n, -24 * 3),
    horarios_propostos: [hora(1, 10)],
    horario: null,
    pauta: null,
    anotacoes: {},
    resumo: null,
    publicacao_autorizada_por: [],
    stream_channel_id: null,
    daily_room_url: null,
    integracao_erros: [],
    ...dados,
  });
  const faiscas: DadosPiloto["faiscas"] = [
    faisca(101, {
      solicitante_id: SOFIA,
      convidada_id: ANA,
      pedido:
        "Vi que você ajudou a testar drones na inspeção em Bragança. Quero entender como começar a usar e o que muda na segurança da equipe.",
      tema: "Drones na inspeção da rede",
      status: "pendente",
      horarios_propostos: [hora(2, 9), hora(3, 15)],
      ...base(101, -5),
    }),
    faisca(102, {
      solicitante_id: ANA,
      convidada_id: CARLA,
      pedido:
        "Vou apresentar os resultados das inspeções à diretoria pela primeira vez. Quero organizar a conversa em torno de uma decisão.",
      tema: "Primeira apresentação à diretoria",
      status: "aceita",
      horarios_propostos: [hora(1, 10)],
      horario: hora(1, 10),
      pauta: {
        perguntas: [
          "Qual decisão a diretoria precisa tomar a partir dos resultados das inspeções?",
          "Na sua primeira apresentação, o que você faria diferente hoje?",
          "Quais três indicadores contam essa história sem excesso de slides?",
        ],
      },
      stream_channel_id: "demonstracao",
      daily_room_url: "https://demonstracao.entreelas.app/sala",
    }),
    faisca(103, {
      solicitante_id: CAMILA,
      convidada_id: ANA,
      pedido:
        "Vou receber duas técnicas novas na equipe e quero saber como você faz o acompanhamento nas primeiras semanas de campo.",
      tema: "Receber técnicas novas no campo",
      status: "aceita",
      horarios_propostos: [hora(0, 8)],
      horario: iso(-3),
      pauta: {
        perguntas: [
          "O que uma técnica nova precisa ver na primeira semana?",
          "Como combinar a conversa de segurança antes de cada saída?",
          "Que pequeno ritual de acompanhamento cabe na rotina?",
        ],
      },
      anotacoes: {
        [ANA]:
          "Camila pediu exemplos de como eu acompanho quem está chegando. Contei do caderno de campo e da conversa de dez minutos no fim do turno.",
      },
      stream_channel_id: "demonstracao",
      daily_room_url: "https://demonstracao.entreelas.app/sala",
    }),
    faisca(104, {
      solicitante_id: ANA,
      convidada_id: RENATA,
      pedido:
        "Quero melhorar a conversa de segurança antes da manobra. A equipe às vezes pula etapas quando está com pressa.",
      tema: "Análise de risco antes da manobra",
      status: "realizada",
      horarios_propostos: [hora(-4, 14)],
      horario: hora(-4, 14),
      pauta: {
        perguntas: [
          "O que a equipe costuma pular quando está com pressa?",
          "Como transformar o checklist em uma conversa curta?",
          "Qual pequeno passo testamos na próxima manobra?",
        ],
      },
      anotacoes: {
        [ANA]:
          "Aprendi a começar pela pergunta “o que mudou desde a última vez aqui?” antes de abrir o checklist.",
        [RENATA]:
          "Compartilhei a conversa de cinco minutos que usamos no Piauí e como registrar o combinado em uma frase.",
      },
      resumo: {
        aprendizados: [
          "Começar a análise de risco com uma pergunta aberta sobre o que mudou no local",
          "Transformar o checklist em uma conversa de cinco minutos, com uma pessoa conduzindo",
          "Registrar o combinado em uma frase que todos repetem antes da manobra",
        ],
        proximos_passos: [
          "Testar a conversa de cinco minutos na próxima manobra em Bragança",
          "Voltar a falar com Renata em duas semanas para contar o resultado",
        ],
        rascunho_dica: {
          titulo: "Antes do checklist, uma pergunta",
          corpo:
            "Antes de abrir o checklist da manobra, pergunte à equipe: “o que mudou desde a última vez que estivemos aqui?”. Em cinco minutos de conversa, com uma pessoa conduzindo, os riscos aparecem com mais facilidade. Termine com uma frase de combinado que todos repetem.",
        },
        evidencias: [
          {
            aprendizado: 0,
            autora_id: ANA,
            trecho:
              "começar pela pergunta “o que mudou desde a última vez aqui?”",
          },
          {
            aprendizado: 1,
            autora_id: RENATA,
            trecho: "a conversa de cinco minutos que usamos no Piauí",
          },
        ],
      },
      publicacao_autorizada_por: [RENATA],
      stream_channel_id: "demonstracao",
      daily_room_url: null,
    }),
    faisca(105, {
      solicitante_id: ANA,
      convidada_id: JULIANA,
      pedido:
        "Tenho os dados de todas as inspeções em planilhas e não sei por onde começar para mostrar o resultado.",
      tema: "Três indicadores que contam a história",
      status: "realizada",
      horarios_propostos: [hora(-12, 16)],
      horario: hora(-12, 16),
      anotacoes: {
        [ANA]:
          "Juliana me ensinou a escolher a pergunta antes do gráfico e a cortar para três indicadores.",
        [JULIANA]:
          "Mostrei como partir da decisão que a diretoria precisa tomar e só depois abrir o Power BI.",
      },
      resumo: {
        aprendizados: [
          "Escolher a pergunta antes de escolher o gráfico",
          "Três indicadores bastam quando cada um responde a uma decisão",
        ],
        proximos_passos: ["Montar o painel das inspeções com três indicadores"],
        rascunho_dica: {
          titulo: "Três indicadores que contam a história",
          corpo:
            "Antes de abrir a planilha, escreva a decisão que precisa ser tomada. Depois escolha no máximo três indicadores, um para cada pergunta da decisão. O resto vai para o anexo.",
        },
      },
      publicacao_autorizada_por: [ANA, JULIANA],
      stream_channel_id: "demonstracao",
      daily_room_url: null,
    }),
    faisca(106, {
      solicitante_id: ANA,
      convidada_id: BEATRIZ,
      pedido:
        "Preciso estimar o custo de uma obra pequena de reforço de rede e nunca fiz um orçamento sozinha.",
      tema: "Primeiro orçamento de obra pequena",
      status: "pendente",
      horarios_propostos: [hora(4, 11), hora(5, 16)],
      ...base(106, -20),
    }),
  ];
  const comunidades: DadosPiloto["comunidades"] = [
    [
      201,
      "Mulheres em Campo",
      "Trocas sobre o dia a dia nas equipes de operação, manutenção e linha viva.",
    ],
    [
      202,
      "Dados para Todas",
      "Planilhas, painéis e indicadores sem medo, com exemplos do dia a dia.",
    ],
    [
      203,
      "Rumo à Liderança",
      "Para quem está assumindo ou quer assumir a primeira equipe.",
    ],
    [
      204,
      "Segurança em Primeiro Lugar",
      "Boas práticas, quase acidentes e o que aprendemos com eles.",
    ],
    [
      205,
      "Cuidar e Trabalhar",
      "Para mães, mães atípicas e quem cuida de familiares: conciliar carreira, plantões e cuidado.",
    ],
  ].map(([n, nome, descricao]) => ({
    ...base(Number(n)),
    nome: String(nome),
    descricao: String(descricao),
    is_private: false,
  }));
  const [CAMPO, DADOS, LIDERANCA, SEGURANCA, MAES] = [
    201, 202, 203, 204, 205,
  ].map(idDemo);
  const post = (
    n: number,
    horas: number,
    autora: string,
    community_id: string | null,
    tipo: "discussao" | "dica",
    titulo: string,
    corpo: string,
    origem_faisca_id: string | null = null,
  ) => ({
    ...base(n, horas),
    autora_id: autora,
    community_id,
    tipo,
    titulo,
    corpo,
    origem_faisca_id,
  });
  const posts: DadosPiloto["posts"] = [
    post(
      301,
      -2,
      idDemo(11),
      CAMPO,
      "discussao",
      "Alguém já usou drone para inspecionar rede em área alagada?",
      "Na época de chuva, metade dos nossos trechos fica difícil de acessar. Queria entender como outras regionais estão fazendo. Bragança já testou, né?",
    ),
    post(
      302,
      -6,
      idDemo(9),
      LIDERANCA,
      "discussao",
      "Primeira semana como coordenadora: o que vocês gostariam de ter ouvido?",
      "Assumi a coordenação de manutenção e quero acertar no começo. Se pudessem voltar à primeira semana como líderes, o que diriam para vocês mesmas?",
    ),
    post(
      303,
      -11,
      idDemo(5),
      null,
      "dica",
      "Três indicadores que contam a história",
      "Antes de abrir a planilha, escreva a decisão que precisa ser tomada. Depois escolha no máximo três indicadores, um para cada pergunta da decisão. O resto vai para o anexo.",
      idDemo(105),
    ),
    post(
      304,
      -20,
      idDemo(3),
      SEGURANCA,
      "dica",
      "Quase acidente também é aula",
      "Toda sexta, a equipe escolhe um quase acidente da semana e conta em três frases: o que aconteceu, o que quase aconteceu e o que muda amanhã. Ninguém é culpada; todo mundo aprende.",
      idDemo(901),
    ),
    post(
      305,
      -30,
      idDemo(13),
      MAES,
      "discussao",
      "Como vocês organizam o plantão com filhos pequenos?",
      "Volto da licença mês que vem e minha escala tem plantão aos sábados. Queria ouvir como outras mães combinam a rede de apoio.",
    ),
    post(
      306,
      -48,
      idDemo(6),
      LIDERANCA,
      "dica",
      "Feedback difícil em quatro frases",
      "1. O que eu vi. 2. O impacto que isso teve. 3. O que eu preciso. 4. Como posso ajudar. Funciona com a equipe e também com a liderança.",
      idDemo(902),
    ),
    post(
      307,
      -70,
      idDemo(12),
      DADOS,
      "discussao",
      "Planilha de orçamento: alguém compartilha um modelo simples?",
      "Estamos padronizando o orçamento de obras pequenas. Se você tem um modelo que funciona, conta aqui como organiza as abas.",
    ),
    post(
      308,
      -96,
      idDemo(8),
      null,
      "dica",
      "PDI com uma primeira ação",
      "Um plano de desenvolvimento não precisa ter dez metas. Escolha uma competência, uma pessoa para conversar e uma ação para os próximos quinze dias.",
      idDemo(903),
    ),
    post(
      309,
      -54,
      idDemo(13),
      MAES,
      "discussao",
      "Networking no intervalo do almoço",
      "Cuido da minha mãe à noite e nunca conseguia ir aos encontros depois do expediente. Marquei minhas Faíscas às 12h30, de terça e quinta. Vinte minutos, pelo celular, e já conheci colegas de três estados.",
    ),
  ];
  const comentarios: Record<string, Comentario[]> = {
    [idDemo(301)]: [
      {
        id: idDemo(401),
        autora_id: idDemo(4),
        corpo:
          "No Amapá ainda não, mas quero muito ouvir a experiência de Bragança!",
      },
      {
        id: idDemo(402),
        autora_id: idDemo(3),
        corpo:
          "Lembrem de incluir o drone na análise de risco: área de voo, rede energizada e quem acompanha em solo.",
      },
    ],
    [idDemo(302)]: [
      {
        id: idDemo(403),
        autora_id: idDemo(6),
        corpo:
          "Que você não precisa saber tudo na primeira semana. Pergunte muito e escute mais ainda.",
      },
      {
        id: idDemo(404),
        autora_id: idDemo(8),
        corpo:
          "Marque uma conversa individual com cada pessoa da equipe nos primeiros 30 dias. Muda tudo.",
      },
      {
        id: idDemo(405),
        autora_id: idDemo(2),
        corpo:
          "Escolha uma vitória pequena para o primeiro mês e celebre com a equipe.",
      },
    ],
    [idDemo(303)]: [
      {
        id: idDemo(406),
        autora_id: idDemo(9),
        corpo:
          "Usei na reunião de ontem e a diretoria entendeu em dez minutos. Obrigada!",
      },
    ],
    [idDemo(304)]: [
      {
        id: idDemo(407),
        autora_id: idDemo(11),
        corpo: "Vamos começar isso na equipe de linha viva de Parnaíba.",
      },
    ],
    [idDemo(305)]: [
      {
        id: idDemo(408),
        autora_id: idDemo(7),
        corpo:
          "Fiz um grupo com outras duas mães da equipe e revezamos as trocas de plantão. Ajuda demais.",
      },
      {
        id: idDemo(409),
        autora_id: idDemo(8),
        corpo:
          "Fala com o RH sobre a escala no retorno. Existe flexibilidade nos primeiros meses.",
      },
    ],
  };
  const eventos: DadosPiloto["eventos"] = [
    [
      501,
      "Roda: a primeira vez liderando",
      "Seis mulheres, seis histórias e um combinado prático para levar para a equipe. Conduzida por Fernanda Costa.",
      hora(2, 18),
      "mentoria",
    ],
    [
      502,
      "Power BI em 30 minutos",
      "Juliana Alves mostra como sair da planilha para um painel com três indicadores.",
      hora(4, 12),
      "atividade",
    ],
    [
      503,
      "Café das eletricistas",
      "Encontro on-line entre eletricistas de todas as regionais. Traga seu café e uma história de campo.",
      hora(6, 8),
      "evento",
    ],
    [
      504,
      "Segurança emocional no campo",
      "Conversa com Renata Lima sobre pressão, pressa e como dizer “pare” com confiança.",
      hora(9, 17),
      "evento",
    ],
  ].map(([n, titulo, descricao, inicio, tipo]) => ({
    ...base(Number(n)),
    titulo: String(titulo),
    descricao: String(descricao),
    inicio: String(inicio),
    tipo: tipo as "evento" | "mentoria" | "atividade",
    community_id: null,
  }));
  const saberes: DadosPiloto["saberes"] = [
    ...pessoas[0].interesses.map((saber, i) => ({
      ...base(601 + i),
      profile_id: ANA,
      saber,
      evidencia: "Declarado no perfil",
      fonte: "perfil" as const,
      fonte_id: null,
      confianca: 1,
      confirmado: true,
      embedding: "demonstracao",
    })),
    {
      ...base(611, -24 * 4),
      profile_id: ANA,
      saber: "Conversa de segurança antes da manobra",
      evidencia:
        "Na Faísca com Renata, contou como abre a análise de risco com uma pergunta sobre o que mudou no local.",
      fonte: "faisca",
      fonte_id: idDemo(104),
      confianca: 0.86,
      confirmado: false,
      embedding: null,
    },
    {
      ...base(612, -24 * 12),
      profile_id: ANA,
      saber: "Acompanhamento de técnicas recém-chegadas",
      evidencia:
        "Explicou o caderno de campo e a conversa de dez minutos no fim do turno.",
      fonte: "faisca",
      fonte_id: idDemo(103),
      confianca: 0.81,
      confirmado: true,
      embedding: null,
    },
  ];
  const mensagens: Record<string, Mensagem[]> = {
    [idDemo(102)]: [
      {
        id: idDemo(701),
        autora_id: CARLA,
        texto:
          "Oi, Ana! Que bom que você me chamou. Já separa os números das inspeções do último trimestre?",
        created_at: iso(-20),
      },
      {
        id: idDemo(702),
        autora_id: ANA,
        texto:
          "Separei! São muitos, por isso queria sua ajuda para escolher o que mostrar.",
        created_at: iso(-19),
      },
      {
        id: idDemo(703),
        autora_id: CARLA,
        texto:
          "Perfeito. Amanhã a gente começa pela decisão que a diretoria precisa tomar. O resto fica fácil.",
        created_at: iso(-18),
      },
    ],
    [idDemo(103)]: [
      {
        id: idDemo(704),
        autora_id: CAMILA,
        texto:
          "Ana, obrigada pela conversa de hoje! Vou testar o caderno de campo com as meninas novas.",
        created_at: iso(-2),
      },
    ],
    [idDemo(104)]: [
      {
        id: idDemo(705),
        autora_id: RENATA,
        texto:
          "Já autorizei a dica. Quando você autorizar, ela vai para a biblioteca da rede!",
        created_at: iso(-30),
      },
    ],
  };
  const relatos: Relato[] = [
    {
      id: idDemo(801),
      profile_id: idDemo(6),
      categoria: "convite",
      descricao:
        "Gostaria de propor mais de três horários quando a colega trabalha em escala.",
      estado: "aberto",
      created_at: iso(-28),
      updated_at: iso(-28),
    },
    {
      id: idDemo(802),
      profile_id: idDemo(4),
      categoria: "video",
      descricao:
        "No celular com internet fraca, o vídeo travou. O chat resolveu e seguimos a conversa.",
      estado: "resolvido",
      created_at: iso(-50),
      updated_at: iso(-40),
    },
  ];
  const indicadores: IndicadoresPiloto = {
    inicio: iso(-24 * 21),
    participantes: 13,
    perfis_completos: 13,
    convites: 38,
    aceitas: 31,
    recusadas: 4,
    realizadas: 24,
    taxa_aceite: 88.6,
    pessoas_conectadas: 13,
    pares_distintos: 22,
    entre_regionais: 79,
    entre_areas: 71,
    no_expediente: 92,
    saberes_reconhecidos: 31,
    dicas_publicadas: 11,
    inscricoes: 46,
    mensagens: 312,
    mapa: {
      oferta: [
        { saber: "Segurança em campo", pessoas: 4 },
        { saber: "Liderança de equipes", pessoas: 3 },
        { saber: "Indicadores de desempenho", pessoas: 3 },
        { saber: "Excel avançado", pessoas: 2 },
        { saber: "Comunicação clara", pessoas: 2 },
      ],
      concentrados: [
        "Automação de subestações",
        "Regulação do setor elétrico",
        "Linha viva",
      ],
      objetivos: 22,
      objetivos_sem_par: 5,
      temas_sem_par: [
        { tema: "falar em público", pessoas: 3 },
        { tema: "negociação com fornecedores", pessoas: 2 },
      ],
    },
    avaliacoes: { respostas: 41, utilidade_media: 4.7, voltariam: 95 },
  };
  const conta: DadosPiloto["conta"] = {
    auth_user_id: idDemo(999),
    consentimento_em: iso(-24 * 20),
    consentimento_versao: "demonstracao",
    created_at: iso(-24 * 20),
    faiscas_por_mes: limites[ANA],
    foto: null,
    ia_consentimento: true,
    onboarding: true,
    profile_id: ANA,
  };
  const dados: DadosPiloto = {
    agora: agora.toISOString(),
    perfil: pessoas[0],
    pessoas,
    conta,
    fotos: Object.fromEntries(pessoas.map((p) => [p.id, null])),
    faiscas,
    comunidades,
    posts,
    eventos,
    membros: [CAMPO, LIDERANCA, SEGURANCA],
    inscricoes: [idDemo(501)],
    favoritos: [idDemo(303), idDemo(304)],
    saberes,
    indexacao: avaliarIndexacao({
      consentimento: true,
      interesses: pessoas[0].interesses,
      saberes,
    }),
    avaliadas: [idDemo(105)],
    disponibilidade: {},
    lider: true,
  };
  const estado: EstadoDemonstracao = {
    dados,
    mensagens,
    comentarios,
    relatos,
    indicadores,
    experiencias,
    limites,
    criadasNaVisita: [],
  };
  recalcularDisponibilidade(estado);
  return estado;
}

/** Vagas por pessoa: limite mensal menos convites ativos recebidos, como no piloto. */
export function recalcularDisponibilidade(estado: EstadoDemonstracao) {
  const ativos = estado.dados.faiscas.filter((f) =>
    ["pendente", "aceita", "realizada"].includes(f.status),
  );
  // Convites de outras pessoas da rede que a visitante não vê, para a disponibilidade parecer viva.
  const fora: Record<string, number> = {
    [idDemo(5)]: 2,
    [idDemo(2)]: 1,
    [idDemo(6)]: 2,
  };
  estado.dados.disponibilidade = Object.fromEntries(
    estado.dados.pessoas.map((p) => [
      p.id,
      calcularDisponibilidade(
        estado.limites[p.id] ?? 4,
        Math.min(
          estado.limites[p.id] ?? 4,
          ativos.filter((f) => f.convidada_id === p.id).length +
            (fora[p.id] ?? 0),
        ),
      ),
    ]),
  );
}
