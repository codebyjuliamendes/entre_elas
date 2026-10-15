-- Identidade do piloto separada das personas e independente do schema auth local.
create table piloto_contas (
 auth_user_id uuid primary key, profile_id uuid not null unique references profiles(id),
 onboarding boolean not null default false, ia_consentimento boolean not null default false,
 consentimento_versao text, consentimento_em timestamptz, created_at timestamptz not null default now()
);
create table piloto_favoritos (profile_id uuid references profiles(id) on delete cascade,post_id uuid references posts(id) on delete cascade,primary key(profile_id,post_id));
create table piloto_limites (chave text not null, janela timestamptz not null, quantidade integer not null,primary key(chave,janela));
alter table piloto_contas enable row level security;
alter table piloto_favoritos enable row level security;
alter table piloto_limites enable row level security;
create function piloto_provisionar(auth_id uuid) returns uuid language plpgsql set search_path=public as $$
declare pid uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(auth_id::text,0));
 select profile_id into pid from piloto_contas where auth_user_id=auth_id;
 if pid is null then
  insert into profiles(nome,cargo,area,cidade,regional) values('Nova participante','A preencher','A preencher','A preencher','A preencher') returning id into pid;
  insert into piloto_contas(auth_user_id,profile_id) values(auth_id,pid);
 end if;
 return pid;
end; $$;
create function piloto_consumir(chave_input text,janela_input timestamptz,limite_input integer) returns boolean language plpgsql set search_path=public as $$
declare n integer;
begin
 if limite_input<1 or limite_input>1000 or length(chave_input)>200 then raise exception 'Limite inválido'; end if;
 insert into piloto_limites values(chave_input,janela_input,1)
 on conflict(chave,janela) do update set quantidade=piloto_limites.quantidade+1 where piloto_limites.quantidade<limite_input
 returning quantidade into n;
 return n is not null;
end; $$;
revoke all on function piloto_provisionar(uuid),piloto_consumir(text,timestamptz,integer) from public;
grant execute on function piloto_provisionar(uuid),piloto_consumir(text,timestamptz,integer) to service_role;
grant all on piloto_contas,piloto_favoritos,piloto_limites to service_role;
