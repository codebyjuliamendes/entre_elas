create extension if not exists vector with schema public;
create type fonte_saber as enum ('perfil','forum','dica','faisca');
create type papel_comunidade as enum ('membro','moderadora');
create type tipo_post as enum ('discussao','dica');
create type tipo_reacao as enum ('curtir','inspirador','util');
create type status_faisca as enum ('pendente','aceita','recusada','realizada','cancelada');
create type tipo_evento as enum ('evento','mentoria','atividade');
create table profiles (id uuid primary key default gen_random_uuid(), nome text not null, cargo text not null, area text not null, cidade text not null, regional text not null, foto_url text, interesses text[] not null default '{}', objetivos text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table communities (id uuid primary key default gen_random_uuid(), nome text not null, descricao text not null, is_private boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table community_members (id uuid primary key default gen_random_uuid(), community_id uuid not null references communities on delete cascade, profile_id uuid not null references profiles on delete cascade, papel papel_comunidade not null default 'membro', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(community_id,profile_id));
create table faiscas (id uuid primary key default gen_random_uuid(), solicitante_id uuid not null references profiles, convidada_id uuid not null references profiles, pedido text not null, tema text not null, horarios_propostos timestamptz[] not null, horario timestamptz, status status_faisca not null default 'pendente', pauta jsonb, anotacoes jsonb not null default '{}', resumo jsonb, publicacao_autorizada_por uuid[] not null default '{}', stream_channel_id text, daily_room_url text, integracao_erros text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(solicitante_id <> convidada_id), check(cardinality(horarios_propostos) between 1 and 10));
create table posts (id uuid primary key default gen_random_uuid(), autora_id uuid not null references profiles, community_id uuid references communities, tipo tipo_post not null, titulo text not null, corpo text not null, origem_faisca_id uuid unique references faiscas, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table post_coautoras (id uuid primary key default gen_random_uuid(), post_id uuid not null references posts on delete cascade, profile_id uuid not null references profiles, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(post_id,profile_id));
create table comments (id uuid primary key default gen_random_uuid(), post_id uuid not null references posts on delete cascade, autora_id uuid not null references profiles, corpo text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table reactions (id uuid primary key default gen_random_uuid(), post_id uuid not null references posts on delete cascade, profile_id uuid not null references profiles, tipo tipo_reacao not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(post_id,profile_id));
create table quizzes (id uuid primary key default gen_random_uuid(), post_id uuid not null unique references posts on delete cascade, perguntas jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table quiz_respostas (id uuid primary key default gen_random_uuid(), quiz_id uuid not null references quizzes on delete cascade, profile_id uuid not null references profiles, respostas jsonb not null, acertos int not null check(acertos between 0 and 3), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(quiz_id,profile_id));
create table saberes (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles on delete cascade, saber text not null, evidencia text not null, fonte fonte_saber not null, fonte_id uuid, confianca numeric not null check(confianca between 0 and 1), confirmado boolean not null default false, embedding vector(768), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index saberes_origem on saberes(profile_id,saber,fonte,coalesce(fonte_id,'00000000-0000-0000-0000-000000000000'::uuid));
create index saberes_vetor on saberes using hnsw(embedding vector_cosine_ops);
create table grupos (id uuid primary key default gen_random_uuid(), nome text not null, descricao text not null, is_private boolean not null default false, criado_por uuid not null references profiles, stream_channel_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table grupo_members (id uuid primary key default gen_random_uuid(), grupo_id uuid not null references grupos on delete cascade, profile_id uuid not null references profiles, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(grupo_id,profile_id));
create table events (id uuid primary key default gen_random_uuid(), titulo text not null, descricao text not null, inicio timestamptz not null, tipo tipo_evento not null, community_id uuid references communities, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table event_participantes (id uuid primary key default gen_random_uuid(), event_id uuid not null references events on delete cascade, profile_id uuid not null references profiles, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(event_id,profile_id));
create table ia_cache (id uuid primary key default gen_random_uuid(), chave text not null unique, resposta jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table ia_jobs (id uuid primary key default gen_random_uuid(), fonte fonte_saber not null, fonte_id uuid not null, profile_id uuid not null references profiles, texto text not null, estado text not null default 'pendente' check(estado in ('pendente','processando','concluido','erro')), erro text, tentativas int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(fonte,fonte_id,profile_id));
create function atualizar_timestamp() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','communities','community_members','faiscas','posts','post_coautoras','comments','reactions','quizzes','quiz_respostas','saberes','grupos','grupo_members','events','event_participantes','ia_cache','ia_jobs'] loop
 execute format('create trigger atualizar_%I before update on %I for each row execute function atualizar_timestamp()',t,t);
 execute format('alter table %I enable row level security',t);
end loop; end $$;
-- Sem políticas públicas: acesso somente pela service role, com permissões verificadas no domínio.
create index posts_comunidade on posts(community_id);
create index comments_post on comments(post_id);
create index saberes_profile on saberes(profile_id);
create index faiscas_solicitante on faiscas(solicitante_id);
create index faiscas_convidada on faiscas(convidada_id);
create index ia_jobs_estado on ia_jobs(estado);
create function buscar_saberes(query_embedding vector(768), limite int, excluir_profile_id uuid)
returns table(profile_id uuid,nome text,area text,regional text,evidencias text[],similaridade double precision)
language sql stable set search_path=public as $$
 with visiveis as (
 select s.*, 1-(s.embedding <=> query_embedding) as score from saberes s
 where s.confirmado and s.embedding is not null and s.profile_id <> excluir_profile_id
 and (s.fonte in ('perfil','faisca') or exists (
 select 1 from posts p left join comments cm on cm.post_id=p.id
 left join communities c on c.id=p.community_id
 where (p.id=s.fonte_id or cm.id=s.fonte_id) and (p.community_id is null or not c.is_private)))
 ) select p.id,p.nome,p.area,p.regional,array_agg(distinct s.evidencia),max(s.score)
 from visiveis s join profiles p on p.id=s.profile_id group by p.id,p.nome,p.area,p.regional
 order by max(s.score) desc limit least(greatest(limite,0),10);
$$;
