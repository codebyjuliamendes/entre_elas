create function buscar_saberes_piloto(query_embedding vector(768),limite int,excluir_profile_id uuid)
returns table(profile_id uuid,nome text,area text,regional text,evidencias text[],similaridade double precision)
language sql stable set search_path=public as $$
 select p.id,p.nome,p.area,p.regional,array_agg(distinct s.evidencia),max(1-(s.embedding <=> query_embedding))
 from saberes_publicos s join profiles p on p.id=s.profile_id join piloto_contas c on c.profile_id=p.id
 where c.onboarding and c.ia_consentimento and s.embedding is not null and p.id<>excluir_profile_id
 group by p.id,p.nome,p.area,p.regional order by max(1-(s.embedding <=> query_embedding)) desc
 limit least(greatest(limite,0),10);
$$;
revoke all on function buscar_saberes_piloto(vector,integer,uuid) from public;
grant execute on function buscar_saberes_piloto(vector,integer,uuid) to service_role;
