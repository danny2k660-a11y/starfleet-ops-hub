-- Immutable per-user snapshots let a build evolve without losing previous configurations.
create table if not exists public.build_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  build_id uuid not null references public.builds(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  summary text,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (build_id, version_number)
);

alter table public.build_versions enable row level security;
drop policy if exists build_versions_owner_all on public.build_versions;
create policy build_versions_owner_all
  on public.build_versions for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.builds b where b.id = build_id and b.user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.builds b where b.id = build_id and b.user_id = auth.uid())
  );

grant select, insert, update, delete on public.build_versions to authenticated;
create index if not exists build_versions_build_created_idx
  on public.build_versions(build_id, created_at desc);
