-- Persist acquisition requirements and archive state used by the build planner.
alter table public.builds
  add column if not exists acquisition_needs text[] not null default '{}',
  add column if not exists archived boolean not null default false;

create index if not exists builds_user_archived_updated_idx
  on public.builds(user_id, archived, updated_at desc);
