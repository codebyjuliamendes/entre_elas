-- "Abro Faíscas": cada participante define quantos convites topa receber em 30 dias.
-- 0 pausa novos convites. Convites recusados ou cancelados não ocupam vaga.
alter table piloto_contas
  add column faiscas_por_mes smallint not null default 4
  check (faiscas_por_mes between 0 and 20);

create or replace function piloto_convites_recebidos(pessoa uuid)
returns int language sql stable set search_path=public as $$
 select count(*)::int from faiscas
 where convidada_id=pessoa and status in ('pendente','aceita','realizada')
 and created_at > now() - interval '30 days';
$$;
revoke all on function piloto_convites_recebidos(uuid) from public;
grant execute on function piloto_convites_recebidos(uuid) to service_role;

-- Mesmo contrato do convite idempotente, com a checagem de vagas da convidada.
create or replace function piloto_criar_convite(usuaria_id uuid,chave uuid,dados jsonb) returns jsonb
language plpgsql set search_path=public as $$ declare f faiscas; limite smallint; begin
 if chave is null or usuaria_id is distinct from (dados->>'solicitante_id')::uuid then raise exception 'Identidade ou chave inválida';end if;
 perform pg_advisory_xact_lock(hashtextextended(usuaria_id::text||chave::text,0));
 select * into f from faiscas where solicitante_id=usuaria_id and chave_pedido=chave;
 if found then
  if f.convidada_id is distinct from (dados->>'convidada_id')::uuid or f.pedido is distinct from dados->>'pedido' or f.tema is distinct from dados->>'tema' or to_jsonb(f.horarios_propostos) is distinct from to_jsonb(array(select jsonb_array_elements_text(dados->'horarios_propostos')::timestamptz)) then raise exception 'Esta chave já foi usada para outro convite';end if;
  return to_jsonb(f);
 end if;
 select faiscas_por_mes into limite from piloto_contas where profile_id=(dados->>'convidada_id')::uuid and onboarding;
 if not found then raise exception 'Escolha uma pessoa com perfil concluído no piloto';end if;
 -- Trava por convidada para dois convites simultâneos não ultrapassarem o limite.
 perform pg_advisory_xact_lock(hashtextextended('vagas'||(dados->>'convidada_id'),0));
 if limite=0 then raise exception 'Esta pessoa pausou novos convites. Escolha outra pessoa da rede';end if;
 if piloto_convites_recebidos((dados->>'convidada_id')::uuid)>=limite then raise exception 'Esta pessoa já recebeu todos os convites que abriu para este mês. Escolha outra pessoa da rede';end if;
 if exists(select 1 from jsonb_array_elements_text(dados->'horarios_propostos') h where h::timestamptz<=now()) then raise exception 'Proponha horários futuros';end if;
 insert into faiscas(solicitante_id,convidada_id,pedido,tema,horarios_propostos,chave_pedido) values(usuaria_id,(dados->>'convidada_id')::uuid,dados->>'pedido',dados->>'tema',array(select jsonb_array_elements_text(dados->'horarios_propostos')::timestamptz),chave) returning * into f;
 return to_jsonb(f);
end;$$;
revoke all on function piloto_criar_convite(uuid,uuid,jsonb) from public;
grant execute on function piloto_criar_convite(uuid,uuid,jsonb) to service_role;

-- A curadoria não indica quem pausou ou está sem vagas, o que distribui a demanda.
create or replace function buscar_saberes_piloto(query_embedding vector(768),limite int,excluir_profile_id uuid)
returns table(profile_id uuid,nome text,area text,regional text,evidencias text[],similaridade double precision)
language sql stable set search_path=public as $$
 select p.id,p.nome,p.area,p.regional,array_agg(distinct s.evidencia),max(1-(s.embedding <=> query_embedding))
 from saberes_publicos s join profiles p on p.id=s.profile_id join piloto_contas c on c.profile_id=p.id
 where c.onboarding and c.ia_consentimento and s.embedding is not null and p.id<>excluir_profile_id
 and (s.fonte<>'perfil' or s.saber=any(p.interesses))
 and piloto_convites_recebidos(p.id)<c.faiscas_por_mes
 group by p.id,p.nome,p.area,p.regional order by max(1-(s.embedding <=> query_embedding)) desc
 limit least(greatest(limite,0),10);
$$;
notify pgrst,'reload schema';
