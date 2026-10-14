create function operar_faisca(faisca_id uuid, usuaria_id uuid, acao text, dados jsonb default '{}') returns jsonb
language plpgsql set search_path=public as $$
declare f faiscas; begin
 select * into f from faiscas where id=faisca_id for update;
 if not found then raise exception 'Faísca não encontrada'; end if;
 if usuaria_id not in (f.solicitante_id,f.convidada_id) then raise exception 'Somente participantes'; end if;
 if acao in ('aceitar','recusar') then
  if usuaria_id <> f.convidada_id or f.status <> 'pendente' then raise exception 'Convite não permitido'; end if;
  if acao='aceitar' then
   if not ((dados->>'horario')::timestamptz=any(f.horarios_propostos)) then raise exception 'Horário inválido'; end if;
   update faiscas set status='aceita',horario=(dados->>'horario')::timestamptz where id=f.id;
  else update faiscas set status='recusada' where id=f.id; end if;
 elsif acao='cancelar' then
  if f.status not in ('pendente','aceita') then raise exception 'Estado não permite cancelamento'; end if;
  update faiscas set status='cancelada' where id=f.id;
 elsif acao='anotar' then
  if f.status <> 'aceita' then raise exception 'Estado não permite anotações'; end if;
  update faiscas set anotacoes=jsonb_set(anotacoes,array[usuaria_id::text],dados->'texto') where id=f.id;
 elsif acao='concluir' then
  if f.status <> 'aceita' then raise exception 'Estado não permite conclusão'; end if;
  if f.anotacoes <> dados->'anotacoes' then raise exception 'Anotações mudaram; gere o resumo novamente'; end if;
  if not (f.anotacoes ? f.solicitante_id::text and f.anotacoes ? f.convidada_id::text) then raise exception 'Faltam anotações'; end if;
  update faiscas set status='realizada',resumo=dados->'resumo' where id=f.id;
  insert into ia_jobs(fonte,fonte_id,profile_id,texto) values
   ('faisca',f.id,f.solicitante_id,f.anotacoes->>f.solicitante_id::text),
   ('faisca',f.id,f.convidada_id,f.anotacoes->>f.convidada_id::text) on conflict do nothing;
 elsif acao='autorizar' then
  if f.status <> 'realizada' then raise exception 'Estado não permite autorização'; end if;
  update faiscas set publicacao_autorizada_por=array(select distinct unnest(f.publicacao_autorizada_por||array[usuaria_id])) where id=f.id;
 else raise exception 'Operação inválida'; end if;
 return (select to_jsonb(x) from faiscas x where id=f.id);
end $$;
create function publicar_faisca(faisca_id uuid, usuaria_id uuid, perguntas jsonb) returns jsonb
language plpgsql set search_path=public as $$
declare f faiscas; p posts; begin
 select * into f from faiscas where id=faisca_id for update;
 if not found then raise exception 'Faísca não encontrada'; end if;
 if usuaria_id not in (f.solicitante_id,f.convidada_id) then raise exception 'Somente participantes'; end if;
 if f.status <> 'realizada' or f.resumo is null or not (f.publicacao_autorizada_por @> array[f.solicitante_id,f.convidada_id]) then raise exception 'Publicação não autorizada'; end if;
 select * into p from posts where origem_faisca_id=f.id;
 if found then return to_jsonb(p); end if;
 insert into posts(autora_id,tipo,titulo,corpo,origem_faisca_id) values(f.solicitante_id,'dica',f.resumo->'rascunho_dica'->>'titulo',f.resumo->'rascunho_dica'->>'corpo',f.id) returning * into p;
 insert into post_coautoras(post_id,profile_id) values(p.id,f.solicitante_id),(p.id,f.convidada_id);
 insert into quizzes(post_id,perguntas) values(p.id,perguntas);
 return to_jsonb(p);
end $$;
create function registrar_saber(dados jsonb) returns jsonb language plpgsql set search_path=public as $$
declare s saberes; begin
 insert into saberes(profile_id,saber,evidencia,fonte,fonte_id,confianca,confirmado,embedding)
 values((dados->>'profile_id')::uuid,dados->>'saber',dados->>'evidencia',(dados->>'fonte')::fonte_saber,(dados->>'fonte_id')::uuid,(dados->>'confianca')::numeric,(dados->>'confirmado')::boolean,(dados->>'embedding')::vector)
 on conflict (profile_id,saber,fonte,(coalesce(fonte_id,'00000000-0000-0000-0000-000000000000'::uuid)))
 do update set evidencia=excluded.evidencia,confianca=excluded.confianca,embedding=excluded.embedding returning * into s;
 return to_jsonb(s);
end $$;
create function pegar_job() returns jsonb language plpgsql set search_path=public as $$
declare j ia_jobs; begin
 select * into j from ia_jobs where estado in ('pendente','erro') and tentativas<3 or (estado='processando' and updated_at<now()-interval '10 minutes') order by created_at for update skip locked limit 1;
 if not found then return null; end if;
 update ia_jobs set estado='processando',tentativas=tentativas+1,erro=null where id=j.id returning * into j;
 return to_jsonb(j);
end $$;
-- RPCs não podem ser usadas pelo cliente anônimo; todas recebem a identidade verificada pelo servidor.
revoke execute on function operar_faisca(uuid,uuid,text,jsonb),publicar_faisca(uuid,uuid,jsonb),registrar_saber(jsonb),pegar_job(),buscar_saberes(vector,int,uuid) from public;
grant execute on function operar_faisca(uuid,uuid,text,jsonb),publicar_faisca(uuid,uuid,jsonb),registrar_saber(jsonb),pegar_job(),buscar_saberes(vector,int,uuid) to service_role;
