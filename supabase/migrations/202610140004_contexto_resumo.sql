alter table ia_jobs add column contexto jsonb;
create function contextualizar_job() returns trigger language plpgsql set search_path=public as $$ begin
 if new.fonte='faisca' then new.contexto=(select resumo from faiscas where id=new.fonte_id); end if;
 return new;
end $$;
create trigger contexto_faisca before insert on ia_jobs for each row execute function contextualizar_job();
-- Storage existe no Supabase hospedado, mas não no Postgres de testes locais.
do $$ begin if to_regclass('storage.buckets') is not null then
 insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('fotos-perfil','fotos-perfil',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
end if; end $$;
