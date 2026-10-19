-- Avaliação curta e opcional de cada participante depois da Faísca, sem texto livre.
-- Alimenta somente indicadores agregados do painel de liderança.
create table piloto_avaliacoes (
 id uuid primary key default gen_random_uuid(),
 faisca_id uuid not null references faiscas(id) on delete cascade,
 profile_id uuid not null references profiles(id) on delete cascade,
 utilidade smallint not null check(utilidade between 1 and 5),
 voltaria boolean not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(faisca_id, profile_id)
);
alter table piloto_avaliacoes enable row level security;
create trigger piloto_avaliacoes_timestamp before update on piloto_avaliacoes for each row execute function atualizar_timestamp();
grant all on piloto_avaliacoes to service_role;
notify pgrst,'reload schema';
