with bundle_names(name) as (
  values
    ('12th Anniversary Terran'),('13th Anniversary Terran'),('14th Anniversary'),('15th Anniversary'),
    ('Discovery'),('Delta'),('Gamma'),('Heritage'),('Legendary 10th'),('Legendary 11th')
)
insert into public.sto_ship_bundles(name,availability_status,account_unlock,source_reference,data_version,notes)
select name,'unknown',true,'Community reference-layer bundle grouping; verify against the in-game bundle before claiming.','reference-layer-2026-10','Seeded from the ship reference bundle field. Claiming a group marks its listed ships as account-owned.'
from bundle_names
where not exists (select 1 from public.sto_ship_bundles b where lower(b.name)=lower(bundle_names.name));

insert into public.sto_ship_bundle_items(bundle_id,sto_ship_id,item_type,quantity,account_unlock)
select b.id,r.sto_ship_id,'ship',1,true
from public.sto_ship_bundles b
join public.sto_ship_reference_data r on r.bundle=b.name
where b.name in ('12th Anniversary Terran','13th Anniversary Terran','14th Anniversary','15th Anniversary','Discovery','Delta','Gamma','Heritage','Legendary 10th','Legendary 11th')
on conflict (bundle_id,sto_ship_id) do update set account_unlock=excluded.account_unlock;

insert into public.sto_ship_sources(sto_ship_id,source_type,source_name,availability_status,bundle_id,account_unlock,source_reference,data_version,notes)
select r.sto_ship_id,'bundle',b.name,'unknown',b.id,true,'Community reference-layer bundle grouping; verify against the in-game bundle before claiming.','reference-layer-2026-10','Seeded from sto_ship_reference_data.bundle.'
from public.sto_ship_reference_data r
join public.sto_ship_bundles b on b.name=r.bundle
where b.name in ('12th Anniversary Terran','13th Anniversary Terran','14th Anniversary','15th Anniversary','Discovery','Delta','Gamma','Heritage','Legendary 10th','Legendary 11th')
  and not exists (select 1 from public.sto_ship_sources s where s.sto_ship_id=r.sto_ship_id and s.source_type='bundle' and s.bundle_id=b.id);
