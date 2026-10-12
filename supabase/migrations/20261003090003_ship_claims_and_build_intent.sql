-- Ship claim metadata and per-owned-ship build intent.
-- Existing ships remain valid and default to the normal build workflow.

alter table public.user_ships
  add column if not exists acquisition_source text,
  add column if not exists acquisition_group text,
  add column if not exists usage_mode text not null default 'build_pending';

alter table public.user_ships
  drop constraint if exists user_ships_usage_mode_check;

alter table public.user_ships
  add constraint user_ships_usage_mode_check
  check (usage_mode in ('build_pending', 'build_created', 'console_trait_only', 'collection_only', 'retired'));

comment on column public.user_ships.acquisition_source is 'How this personal ship was acquired, e.g. Zen Store, Bundle, Event, Lockbox, Lobi, Campaign, Promo, Fleet or Other.';
comment on column public.user_ships.acquisition_group is 'Optional bundle, pack, campaign or reward group name used to organise claims.';
comment on column public.user_ships.usage_mode is 'Whether the owned ship should receive a build prompt or is intentionally kept for console/trait/collection use.';

-- Existing ships with a linked build are already build candidates with a completed build workflow.
update public.user_ships
set usage_mode = 'build_created'
where current_build_id is not null
  and usage_mode = 'build_pending';

create index if not exists user_ships_usage_mode_idx on public.user_ships (usage_mode);
create index if not exists user_ships_acquisition_source_idx on public.user_ships (acquisition_source);
create index if not exists user_ships_acquisition_group_idx on public.user_ships (acquisition_group);
