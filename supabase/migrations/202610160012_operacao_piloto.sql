-- Indexação completa ou nenhuma alteração, com proteção contra edição concorrente.
create function piloto_indexar_perfil(usuaria_id uuid, perfil_lido jsonb, saberes_input jsonb)
returns jsonb language plpgsql set search_path=public as $$
declare p profiles; item jsonb; esperados text[]; recebidos text[];
begin
 select * into p from profiles where id=usuaria_id for update;
 if not found then raise exception 'Perfil não encontrado'; end if;
 if not exists(select 1 from piloto_contas where profile_id=p.id and ia_consentimento) then raise exception 'Autorize a IA antes de indexar'; end if;
 if to_jsonb(p) is distinct from perfil_lido then raise exception 'Seu perfil mudou; atualize a página e tente novamente'; end if;
 if jsonb_typeof(saberes_input)<>'array' or jsonb_array_length(saberes_input)>8 then raise exception 'Saberes inválidos'; end if;
 select coalesce(array_agg(distinct x order by x),'{}') into esperados from unnest(p.interesses) x;
 select coalesce(array_agg(distinct x->>'saber' order by x->>'saber'),'{}') into recebidos from jsonb_array_elements(saberes_input) x;
 if esperados is distinct from recebidos or cardinality(recebidos)<>jsonb_array_length(saberes_input) then raise exception 'Indexação não corresponde aos saberes atuais'; end if;
 for item in select * from jsonb_array_elements(saberes_input) loop
  if item->>'embedding' is null or vector_norm((item->>'embedding')::vector(768))=0 then raise exception 'Embedding inválido'; end if;
  perform registrar_saber(jsonb_build_object('profile_id',p.id,'saber',item->>'saber','evidencia',p.nome||' declara no perfil: '||(item->>'saber'),'fonte','perfil','fonte_id',null,'confianca',1,'confirmado',true,'embedding',item->>'embedding'));
 end loop;
 delete from saberes where profile_id=p.id and fonte='perfil' and not(saber=any(p.interesses));
 return jsonb_build_object('ok',true,'indexados',cardinality(esperados));
end;$$;
revoke all on function piloto_indexar_perfil(uuid,jsonb,jsonb) from public;
grant execute on function piloto_indexar_perfil(uuid,jsonb,jsonb) to service_role;

-- Um saber removido do perfil não volta a indicar a pessoa antes da reindexação.
create or replace function buscar_saberes_piloto(query_embedding vector(768),limite int,excluir_profile_id uuid)
returns table(profile_id uuid,nome text,area text,regional text,evidencias text[],similaridade double precision)
language sql stable set search_path=public as $$
 select p.id,p.nome,p.area,p.regional,array_agg(distinct s.evidencia),max(1-(s.embedding <=> query_embedding))
 from saberes_publicos s join profiles p on p.id=s.profile_id join piloto_contas c on c.profile_id=p.id
 where c.onboarding and c.ia_consentimento and s.embedding is not null and p.id<>excluir_profile_id
 and (s.fonte<>'perfil' or s.saber=any(p.interesses))
 group by p.id,p.nome,p.area,p.regional order by max(1-(s.embedding <=> query_embedding)) desc
 limit least(greatest(limite,0),10);
$$;

create table piloto_relatos (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references profiles(id) on delete cascade,
 categoria text not null check(categoria in('acesso','ia','convite','chat','video','perfil','outro')),
 descricao text not null check(char_length(descricao) between 10 and 2000),
 estado text not null default 'aberto' check(estado in('aberto','resolvido')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table piloto_relatos enable row level security;
create trigger piloto_relatos_timestamp before update on piloto_relatos for each row execute function atualizar_timestamp();
create index piloto_relatos_profile_idx on piloto_relatos(profile_id,created_at desc);
grant all on piloto_relatos to service_role;
notify pgrst,'reload schema';
