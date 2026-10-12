-- Keep user-entered bridge officer records separate from the canonical BOFF catalogue assignments.
create table if not exists public.character_bridge_officers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  species text,
  career text,
  rank text,
  specialization text,
  traits jsonb not null default '[]'::jsonb,
  abilities jsonb not null default '[]'::jsonb,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.character_bridge_officers enable row level security;
drop policy if exists character_bridge_officers_owner_all on public.character_bridge_officers;
create policy character_bridge_officers_owner_all
  on public.character_bridge_officers for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  );

grant select, insert, update, delete on public.character_bridge_officers to authenticated;
create index if not exists character_bridge_officers_character_idx
  on public.character_bridge_officers(user_id, character_id, active);
drop trigger if exists character_bridge_officers_updated_at on public.character_bridge_officers;
create trigger character_bridge_officers_updated_at
  before update on public.character_bridge_officers
  for each row execute function public.update_updated_at_column();
