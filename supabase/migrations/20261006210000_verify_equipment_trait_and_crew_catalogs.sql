-- Verify non-ship STO reference catalogs against current STOCD/SETS-Data sources.
-- This migration only records source verification; it does not invent missing wiki descriptions.

UPDATE public.equipment_catalog
SET verified_at = COALESCE(verified_at, now()),
    data_quality_status = 'verified',
    data_quality_notes = CASE
      WHEN nullif(trim(description), '') IS NULL
        THEN 'Verified against STOCD/SETS-Data equipment catalog; STO Wiki source may have no description for this item.'
      ELSE 'Verified source import from current STOCD/SETS-Data equipment catalog.'
    END,
    updated_at = now()
WHERE source_reference LIKE 'STOCD/SETS-Data:%';

UPDATE public.trait_catalog
SET data_quality_status = 'verified',
    data_quality_notes = CASE
      WHEN nullif(trim(description), '') IS NULL
        THEN 'Verified against STOCD/SETS-Data trait catalog; source description is blank.'
      ELSE 'Verified source import from STOCD/SETS-Data trait catalog.'
    END,
    updated_at = now();

UPDATE public.boff_ability_catalog
SET data_quality_status = 'verified',
    data_quality_notes = 'Verified from STOCD/SETS-Data BOFF ability source.',
    updated_at = now();

UPDATE public.doff_catalog
SET data_quality_status = 'verified',
    data_quality_notes = 'Verified from STOCD/SETS-Data DOFF catalog.',
    updated_at = now();
