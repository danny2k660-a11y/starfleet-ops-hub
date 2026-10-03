-- Traits such as Adaptive Defense exist in both Ground and Space variants.
-- Keep the domain in the natural-key constraint so both variants remain distinct.
drop index if exists public.idx_trait_catalog_name_type;
create unique index if not exists idx_trait_catalog_name_type_domain
  on public.trait_catalog(lower(name), trait_type, domain);
