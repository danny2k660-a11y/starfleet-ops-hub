create table if not exists public.sto_ship_catalog_imports (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  source_url text,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','validated','applied','rejected')),
  imported_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
alter table public.sto_ship_catalog_imports enable row level security;
drop policy if exists "Users can manage own ship imports" on public.sto_ship_catalog_imports;
create policy "Users can manage own ship imports" on public.sto_ship_catalog_imports for all using (auth.uid()=imported_by) with check (auth.uid()=imported_by);
create index if not exists sto_ship_catalog_imports_status_idx on public.sto_ship_catalog_imports(status, created_at desc);