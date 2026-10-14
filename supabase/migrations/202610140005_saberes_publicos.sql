create view saberes_publicos with (security_invoker=true) as
select s.* from saberes s where s.confirmado and (
 s.fonte in ('perfil','faisca') or exists (
 select 1 from posts p left join comments cm on cm.post_id=p.id
 left join communities c on c.id=p.community_id
 where (p.id=s.fonte_id or cm.id=s.fonte_id) and (p.community_id is null or not c.is_private)));
grant select on saberes_publicos to service_role;
create or replace function buscar_saberes(query_embedding vector(768), limite int, excluir_profile_id uuid)
returns table(profile_id uuid,nome text,area text,regional text,evidencias text[],similaridade double precision)
language sql stable set search_path=public as $$
 select p.id,p.nome,p.area,p.regional,array_agg(distinct s.evidencia),max(1-(s.embedding <=> query_embedding))
 from saberes_publicos s join profiles p on p.id=s.profile_id
 where s.embedding is not null and s.profile_id<>excluir_profile_id
 group by p.id,p.nome,p.area,p.regional order by max(1-(s.embedding <=> query_embedding)) desc
 limit least(greatest(limite,0),10);
$$;
