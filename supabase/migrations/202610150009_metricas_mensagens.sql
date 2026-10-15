-- Somente metadados de mensagens confirmadas pelo Stream; nenhum conteúdo de chat.
create table piloto_mensagens (
 id text primary key, faisca_id uuid not null references faiscas(id) on delete cascade,
 autora_id uuid not null references profiles(id), created_at timestamptz not null
);
alter table piloto_mensagens enable row level security;
grant all on piloto_mensagens to service_role;
