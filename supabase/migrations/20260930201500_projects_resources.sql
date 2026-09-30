create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null,
 description text,
 status text not null default 'active' check (status in ('active','paused','complete','archived')),
 priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
 character_id uuid references public.characters(id) on delete set null,
 target_date date,
 progress integer not null default 0 check (progress between 0 and 100),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.project_tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 title text not null,
 done boolean not null default false,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.resource_balances (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 character_id uuid references public.characters(id) on delete set null,
 name text not null,
 category text not null default 'Currency',
 quantity bigint not null default 0,
 target bigint,
 notes text,
 updated_at timestamptz not null default now(),
 unique(user_id, character_id, name)
);
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.resource_balances enable row level security;
grant select,insert,update,delete on public.projects, public.project_tasks, public.resource_balances to authenticated;
create policy "own projects" on public.projects for all using (user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own project tasks" on public.project_tasks for all using (user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own resource balances" on public.resource_balances for all using (user_id=auth.uid()) with check(user_id=auth.uid());
create index if not exists projects_user_idx on public.projects(user_id);
create index if not exists project_tasks_project_idx on public.project_tasks(project_id);
create index if not exists resource_balances_user_idx on public.resource_balances(user_id);
