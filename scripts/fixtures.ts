import { z } from 'zod';
import { profileInput } from '@/lib/schemas/entities';
export function uuid(n:number):string {return z.uuid().parse(`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`);}
const pessoas=[
 ['Ana Ribeiro','Técnica de campo','Operações','Pelotas','Sul','manutenção de redes elétricas','apresentar projetos à diretoria'],
 ['Carla Souza','Gerente de projetos','Projetos','Porto Alegre','Metropolitana','apresentação de projetos à diretoria','compartilhar experiência em apresentações'],
 ['Beatriz Lima','Engenheira','Segurança','São Luís','Maranhão','segurança no trabalho em redes elétricas','aprender liderança'],
 ['Daniela Costa','Analista','Dados','Belém','Pará','análise de dados de consumo de energia','ensinar análise de dados'],
 ['Elisa Santos','Supervisora','Atendimento','Maceió','Alagoas','atendimento inclusivo a clientes','aprender indicadores'],
 ['Fernanda Alves','Especialista','Sustentabilidade','Teresina','Piauí','projetos de energia solar','compartilhar sustentabilidade'],
 ['Gabriela Rocha','Coordenadora','Pessoas','Porto Alegre','Sul','mentoria e liderança de equipes','aprender comunicação'],
 ['Helena Martins','Técnica','Automação','Macapá','Amapá','automação de subestações','ensinar automação'],
 ['Isabela Pereira','Analista','Finanças','Goiânia','Goiás','planejamento financeiro de projetos','aprender gestão de projetos'],
 ['Juliana Oliveira','Engenheira','Planejamento','Pelotas','Sul','planejamento de expansão de redes','compartilhar planejamento'],
 ['Larissa Melo','Advogada','Jurídico','São Luís','Maranhão','regulação do setor elétrico','ensinar regulação'],
 ['Mariana Dias','Especialista','Comunicação','Belém','Pará','comunicação clara e facilitação','aprender análise de dados']
];
export const profiles=pessoas.map(([nome,cargo,area,cidade,regional,saber,objetivo],i)=>({id:uuid(i+1),...profileInput.parse({nome,cargo,area,cidade,regional,interesses:[saber],objetivos:[objetivo]})}));
export const communities=[['Mulheres em Campo','Trocas sobre operação e segurança'],['Projetos e Inovação','Aprendizados em projetos'],['Dados e Energia','Uso de dados no setor elétrico'],['Liderança Reservada','Discussões fictícias de liderança']].map(([nome,descricao],i)=>({id:uuid(101+i),nome,descricao,is_private:i===3}));
export const posts=Array.from({length:15},(_,i)=>({id:uuid(201+i),autora_id:profiles[i%12].id,community_id:communities[i%4].id,tipo:(i%3===0?'dica':'discussao') as 'dica'|'discussao',titulo:`Aprendizado ${i+1}: ${profiles[i%12].interesses[0]}`,corpo:`Sou ${profiles[i%12].nome}. Tenho experiência com ${profiles[i%12].interesses[0]}. Na minha equipe, apliquei esse conhecimento em um projeto fictício e compartilhei os resultados em uma reunião.`,origem_faisca_id:null}));
export const comments=posts.map((p,i)=>({id:uuid(301+i),post_id:p.id,autora_id:p.autora_id,corpo:`No meu trabalho fictício, usei ${profiles[i%12].interesses[0]} para resolver um desafio da equipe.`}));
export const events=Array.from({length:5},(_,i)=>({id:uuid(401+i),titulo:`Encontro ${i+1}`,descricao:'Encontro fictício de troca de experiências.',inicio:`2026-11-${String(i+10).padStart(2,'0')}T15:00:00Z`,tipo:(i%2?'mentoria':'evento') as 'mentoria'|'evento',community_id:communities[i%4].id}));
export const pedidos=[
 ['Preciso apresentar um projeto à diretoria',2],['Quero aprender segurança no trabalho em redes elétricas',3],['Quero analisar dados de consumo de energia',4],['Preciso melhorar o atendimento inclusivo aos clientes',5],['Quero iniciar um projeto de energia solar',6],['Busco mentoria para liderar minha equipe',7],['Preciso automatizar uma subestação',8],['Quero planejar o orçamento financeiro de um projeto',9],['Preciso planejar a expansão de redes elétricas',10],['Quero entender a regulação do setor elétrico',11]
].map(([pedido,esperada])=>({pedido:String(pedido),esperada:uuid(Number(esperada))}));
