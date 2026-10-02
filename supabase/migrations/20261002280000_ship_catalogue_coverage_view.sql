-- Central coverage/readiness view for the shared ship catalogue.
-- Verification is deliberately separated from provenance:
-- STOWiki verified = directly verified against STOWiki;
-- Official STO = sourced from an official STO announcement/site but not STOWiki-verified;
-- Community = community reference data that still requires authoritative verification.
create or replace view public.sto_ship_catalogue_coverage
with (security_invoker = true)
as
select
  count(*)::bigint as catalogue_records,
  count(*) filter (where tier = 'T6')::bigint as t6_records,
  count(*) filter (where source_key = 'stowiki' and verified_at is not null)::bigint as stowiki_verified,
  count(*) filter (where source_key = 'official-sto-2026')::bigint as official_sto_2026,
  count(*) filter (where source_key = 'community-stoshipdb')::bigint as community_reference,
  count(*) filter (where ship_class is not null and faction is not null and tier is not null)::bigint as classification_complete,
  count(*) filter (where hull_modifier is not null and shield_modifier is not null and turn_rate is not null and impulse_modifier is not null and inertia is not null)::bigint as mobility_complete,
  count(*) filter (where fore_weapon_slots is not null and aft_weapon_slots is not null and engineering_console_slots is not null and science_console_slots is not null and tactical_console_slots is not null)::bigint as layout_complete,
  count(*) filter (where bridge_officer_stations is not null)::bigint as seating_complete,
  count(*) filter (where source_key is not null and source_url is not null and source_reference is not null)::bigint as provenance_complete,
  count(*) filter (where tier = 'T6'
    and ship_class is not null
    and faction is not null
    and hull_modifier is not null
    and shield_modifier is not null
    and turn_rate is not null
    and impulse_modifier is not null
    and inertia is not null
    and fore_weapon_slots is not null
    and aft_weapon_slots is not null
    and engineering_console_slots is not null
    and science_console_slots is not null
    and tactical_console_slots is not null
    and bridge_officer_stations is not null
    and source_key is not null
    and source_url is not null
    and source_reference is not null
  )::bigint as t6_records_complete
from public.sto_ships;

comment on view public.sto_ship_catalogue_coverage is
'Read-only catalogue coverage metrics. STOWiki verification is distinct from official and community provenance.';