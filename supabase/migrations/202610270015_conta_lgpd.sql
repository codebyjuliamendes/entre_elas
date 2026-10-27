-- O chat do piloto guarda o texto no próprio banco desde que o Stream deixou de ser usado.
-- Bancos que já receberam a coluna manualmente não mudam.
alter table piloto_mensagens
  add column if not exists texto text not null default ''
  check (char_length(texto) <= 2000);

-- LGPD: a participante apaga a própria conta. O que é só dela é removido; o que divide
-- com outra pessoa (Faíscas e dicas em coautoria) continua, sem identificá-la.
create or replace function piloto_excluir_conta(usuaria_id uuid) returns jsonb
language plpgsql set search_path=public as $$ declare conta piloto_contas; begin
 select * into conta from piloto_contas where profile_id=usuaria_id for update;
 if not found then raise exception 'Conta não encontrada'; end if;
 update faiscas set status='cancelada'
  where status in ('pendente','aceita') and usuaria_id in (solicitante_id,convidada_id);
 update faiscas set anotacoes = anotacoes - usuaria_id::text
  where anotacoes ? usuaria_id::text;
 delete from piloto_mensagens where autora_id=usuaria_id;
 -- A dica escrita a quatro mãos passa para a coautora em vez de sumir para ela.
 update posts p set autora_id=c.profile_id from post_coautoras c
  where p.autora_id=usuaria_id and c.post_id=p.id and c.profile_id<>usuaria_id;
 delete from post_coautoras c using posts p
  where c.post_id=p.id and (c.profile_id=usuaria_id or c.profile_id=p.autora_id);
 delete from posts where autora_id=usuaria_id;
 delete from comments where autora_id=usuaria_id;
 delete from reactions where profile_id=usuaria_id;
 delete from quiz_respostas where profile_id=usuaria_id;
 delete from community_members where profile_id=usuaria_id;
 delete from grupo_members where profile_id=usuaria_id;
 delete from event_participantes where profile_id=usuaria_id;
 delete from piloto_favoritos where profile_id=usuaria_id;
 delete from piloto_relatos where profile_id=usuaria_id;
 delete from ia_jobs where profile_id=usuaria_id;
 delete from saberes where profile_id=usuaria_id;
 delete from piloto_contas where profile_id=usuaria_id;
 -- O perfil fica como referência anônima das Faíscas e avaliações agregadas.
 update profiles set nome='Participante removida', cargo='—', area='—', cidade='—',
  regional='—', foto_url=null, interesses='{}', objetivos='{}'
  where id=usuaria_id;
 return jsonb_build_object('ok',true,'auth_user_id',conta.auth_user_id);
end;$$;
revoke all on function piloto_excluir_conta(uuid) from public;
grant execute on function piloto_excluir_conta(uuid) to service_role;
