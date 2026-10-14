create function enfileirar_conteudo() returns trigger language plpgsql set search_path=public as $$ begin
 if tg_table_name='posts' then
  if new.origem_faisca_id is null then insert into ia_jobs(fonte,fonte_id,profile_id,texto) values(case when new.tipo='dica' then 'dica'::fonte_saber else 'forum'::fonte_saber end,new.id,new.autora_id,new.corpo) on conflict do nothing; end if;
 else insert into ia_jobs(fonte,fonte_id,profile_id,texto) values('forum',new.id,new.autora_id,new.corpo) on conflict do nothing; end if;
 return new;
end $$;
create trigger posts_fila after insert on posts for each row execute function enfileirar_conteudo();
create trigger comments_fila after insert on comments for each row execute function enfileirar_conteudo();
create function criar_comunidade(dados jsonb, usuaria_id uuid) returns jsonb language plpgsql set search_path=public as $$
declare c communities; begin
 insert into communities(nome,descricao,is_private) values(dados->>'nome',dados->>'descricao',(dados->>'is_private')::boolean) returning * into c;
 insert into community_members(community_id,profile_id,papel) values(c.id,usuaria_id,'moderadora');
 return to_jsonb(c);
end $$;
revoke execute on function criar_comunidade(jsonb,uuid) from public;
grant execute on function criar_comunidade(jsonb,uuid) to service_role;
