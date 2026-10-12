-- Give fleet projects a first-class purpose/category for acquisition and build planning.
alter table public.projects
  add column if not exists project_type text not null default 'other';

alter table public.projects
  drop constraint if exists projects_project_type_check;

alter table public.projects
  add constraint projects_project_type_check
  check (project_type in ('build','ship acquisition','upgrade','reputation','campaign','collection','other'));

create index if not exists projects_user_status_idx
  on public.projects(user_id, status, priority);
