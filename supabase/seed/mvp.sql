-- Seed mínimo idempotente para as tabelas existentes do Entre Elas.
-- Aplique as migrations primeiro. Não altera a dimensão 768 dos vetores existentes.
insert into public.profiles(id,nome,cargo,area,cidade,regional,foto_url,interesses,objetivos) values
('00000000-0000-4000-8000-000000000001','Ana Ribeiro','Técnica de campo','Operações','Pelotas','Sul',null,array['Manutenção de redes','Segurança em campo'],array['Apresentar projetos à diretoria']),
('00000000-0000-4000-8000-000000000002','Carla Souza','Gerente de projetos','Projetos','Porto Alegre','Metropolitana',null,array['Apresentações à diretoria','Gestão de projetos'],array['Compartilhar experiência em apresentações']),
('00000000-0000-4000-8000-000000000004','Daniela Costa','Analista de dados','Dados','Belém','Pará',null,array['Excel e indicadores','Análise de dados'],array['Ensinar análise de dados'])
on conflict(id) do nothing;
insert into public.saberes(profile_id,saber,evidencia,fonte,fonte_id,confianca,confirmado,embedding) values
('00000000-0000-4000-8000-000000000002','Apresentações à diretoria','Já apresentou projetos à diretoria e compartilhou como organizar objetivo, indicadores e decisão esperada.','perfil',null,1,true,null),
('00000000-0000-4000-8000-000000000004','Análise de dados','Usou análise de dados de consumo de energia para transformar indicadores em decisões da equipe.','perfil',null,1,true,null),
('00000000-0000-4000-8000-000000000001','Segurança em campo','Compartilhou aprendizados sobre manutenção de redes e segurança em campo.','perfil',null,1,true,null)
on conflict do nothing;
-- Embeddings não são inventados. Gere os vetores com processar-saberes e o modelo configurado.
