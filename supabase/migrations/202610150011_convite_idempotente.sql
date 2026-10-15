alter table faiscas add column chave_pedido uuid;
create unique index faiscas_chave_pedido on faiscas(solicitante_id,chave_pedido) where chave_pedido is not null;
create function piloto_criar_convite(usuaria_id uuid,chave uuid,dados jsonb) returns jsonb
language plpgsql set search_path=public as $$ declare f faiscas;begin
 if chave is null or usuaria_id is distinct from (dados->>'solicitante_id')::uuid then raise exception 'Identidade ou chave inválida';end if;
 perform pg_advisory_xact_lock(hashtextextended(usuaria_id::text||chave::text,0));
 select * into f from faiscas where solicitante_id=usuaria_id and chave_pedido=chave;
 if found then
  if f.convidada_id is distinct from (dados->>'convidada_id')::uuid or f.pedido is distinct from dados->>'pedido' or f.tema is distinct from dados->>'tema' or to_jsonb(f.horarios_propostos) is distinct from to_jsonb(array(select jsonb_array_elements_text(dados->'horarios_propostos')::timestamptz)) then raise exception 'Esta chave já foi usada para outro convite';end if;
  return to_jsonb(f);
 end if;
 if not exists(select 1 from piloto_contas where profile_id=(dados->>'convidada_id')::uuid and onboarding) then raise exception 'Escolha uma pessoa com perfil concluído no piloto';end if;
 if exists(select 1 from jsonb_array_elements_text(dados->'horarios_propostos') h where h::timestamptz<=now()) then raise exception 'Proponha horários futuros';end if;
 insert into faiscas(solicitante_id,convidada_id,pedido,tema,horarios_propostos,chave_pedido) values(usuaria_id,(dados->>'convidada_id')::uuid,dados->>'pedido',dados->>'tema',array(select jsonb_array_elements_text(dados->'horarios_propostos')::timestamptz),chave) returning * into f;
 return to_jsonb(f);
end;$$;
revoke all on function piloto_criar_convite(uuid,uuid,jsonb) from public;
grant execute on function piloto_criar_convite(uuid,uuid,jsonb) to service_role;
