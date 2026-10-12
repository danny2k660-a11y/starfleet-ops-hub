-- Link saved build traits to the shared trait catalogue and permit multiple traits per loadout.
alter table public.loadout_traits
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists trait_id uuid references public.trait_catalog(id) on delete set null,
  add column if not exists domain text,
  add column if not exists trait_category text;

update public.loadout_traits lt
set user_id = l.user_id
from public.loadouts l
where l.id = lt.loadout_id and lt.user_id is null;

alter table public.loadout_traits alter column user_id set default auth.uid();
alter table public.loadout_traits alter column user_id set not null;

alter table public.loadout_boffs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.loadout_boffs lb
set user_id = l.user_id
from public.loadouts l
where l.id = lb.loadout_id and lb.user_id is null;

alter table public.loadout_boffs alter column user_id set default auth.uid();
alter table public.loadout_boffs alter column user_id set not null;

alter table public.loadout_traits
  drop constraint if exists loadout_traits_loadout_id_trait_type_slot_key;

-- If legacy rows already contain duplicate catalogue links, retain every named trait row
-- but detach all except the newest duplicate from the shared catalogue entry.
with ranked as (
  select id, row_number() over (
    partition by loadout_id, trait_id
    order by created_at desc nulls last, id desc
  ) as rn
  from public.loadout_traits
  where trait_id is not null
)
update public.loadout_traits lt
set trait_id = null
from ranked r
where lt.id = r.id and r.rn > 1;

create unique index if not exists loadout_traits_unique_catalog_trait
  on public.loadout_traits(loadout_id, trait_id)
  where trait_id is not null;

create index if not exists loadout_traits_loadout_type_idx
  on public.loadout_traits(loadout_id, trait_type);
