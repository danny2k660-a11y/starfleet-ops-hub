-- Append-only per-user activity history for important operations and diagnostics.
create table if not exists public.user_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  action text not null check (char_length(action) between 1 and 80),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  summary text not null check (char_length(summary) between 1 and 500),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_audit_log enable row level security;
drop policy if exists user_audit_log_select_own on public.user_audit_log;
drop policy if exists user_audit_log_insert_own on public.user_audit_log;
create policy user_audit_log_select_own on public.user_audit_log
  for select to authenticated using (user_id = auth.uid());
create policy user_audit_log_insert_own on public.user_audit_log
  for insert to authenticated with check (user_id = auth.uid());

revoke update, delete on public.user_audit_log from authenticated;
grant select, insert on public.user_audit_log to authenticated;

create or replace function public.record_sto_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_summary text default '',
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if nullif(trim(p_action), '') is null or nullif(trim(p_entity_type), '') is null or nullif(trim(p_summary), '') is null then
    raise exception 'Audit action, entity type and summary are required';
  end if;
  insert into public.user_audit_log(user_id, action, entity_type, entity_id, summary, details)
  values (auth.uid(), left(trim(p_action), 80), left(trim(p_entity_type), 80), p_entity_id, left(trim(p_summary), 500), coalesce(p_details, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.record_sto_audit_event(text, text, uuid, text, jsonb) from public, anon;
grant execute on function public.record_sto_audit_event(text, text, uuid, text, jsonb) to authenticated;

create index if not exists user_audit_log_user_created_idx
  on public.user_audit_log(user_id, created_at desc);
