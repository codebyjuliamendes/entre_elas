create function piloto_revisar_resumo(faisca_id uuid,usuaria_id uuid,novo_resumo jsonb) returns jsonb
language plpgsql set search_path=public as $$ declare f faiscas;begin
 select * into f from faiscas where id=faisca_id for update;
 if not found or usuaria_id not in(f.solicitante_id,f.convidada_id) then raise exception 'Somente participantes';end if;
 if f.status<>'realizada' or exists(select 1 from posts where origem_faisca_id=f.id) then raise exception 'Dica indisponível para revisão';end if;
 update faiscas set resumo=novo_resumo,publicacao_autorizada_por='{}' where id=f.id;
 return (select to_jsonb(x) from faiscas x where id=f.id);
end;$$;
create function piloto_autorizar(faisca_id uuid,usuaria_id uuid,resumo_lido jsonb,autorizado boolean) returns jsonb
language plpgsql set search_path=public as $$ declare f faiscas;begin
 select * into f from faiscas where id=faisca_id for update;
 if not found or usuaria_id not in(f.solicitante_id,f.convidada_id) then raise exception 'Somente participantes';end if;
 if f.status<>'realizada' or f.resumo is distinct from resumo_lido then raise exception 'A síntese mudou; leia a versão atual antes de autorizar';end if;
 if exists(select 1 from posts where origem_faisca_id=f.id) then raise exception 'Dica já publicada';end if;
 update faiscas set publicacao_autorizada_por=case when autorizado then array(select distinct unnest(f.publicacao_autorizada_por||array[usuaria_id])) else array_remove(f.publicacao_autorizada_por,usuaria_id) end where id=f.id;
 return (select to_jsonb(x) from faiscas x where id=f.id);
end;$$;
revoke all on function piloto_revisar_resumo(uuid,uuid,jsonb),piloto_autorizar(uuid,uuid,jsonb,boolean) from public;
grant execute on function piloto_revisar_resumo(uuid,uuid,jsonb),piloto_autorizar(uuid,uuid,jsonb,boolean) to service_role;
