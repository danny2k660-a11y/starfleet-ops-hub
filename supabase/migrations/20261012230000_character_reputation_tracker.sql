-- Personal reputation progression; names remain user-entered to avoid fabricated catalogue entries.
create table if not exists public.character_reputations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  reputation_name text not null,
  tier integer not null default 0 check (tier between 0 and 6),
  progress integer not null default 0 check (progress between 0 and 100),
  daily_claimed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_id, reputation_name)
);

alter table public.character_reputations enable row level security;
drop policy if exists character_reputations_owner_all on public.character_reputations;
create policy character_reputations_owner_all
  on public.character_reputations for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid())
  );

grant select, insert, update, delete on public.character_reputations to authenticated;
create index if not exists character_reputations_character_idx
  on public.character_reputations(user_id, character_id);
create trigger character_reputations_updated_at
  before update on public.character_reputations
  for each row execute function public.update_updated_at_column();
