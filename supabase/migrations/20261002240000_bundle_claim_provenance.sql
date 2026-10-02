CREATE OR REPLACE FUNCTION public.claim_sto_ship_bundle(
  p_bundle_id uuid,
  p_acquired_at timestamptz DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sto_ship_bundles WHERE id = p_bundle_id
  ) THEN
    RAISE EXCEPTION 'Bundle not found';
  END IF;

  INSERT INTO public.sto_ship_ownership (
    user_id, sto_ship_id, ownership_status, acquisition_source_id, acquired_at
  )
  SELECT
    v_user,
    i.sto_ship_id,
    'owned',
    (
      SELECT src.id
      FROM public.sto_ship_sources src
      WHERE src.sto_ship_id = i.sto_ship_id
        AND src.source_type = 'bundle'
        AND src.bundle_id = p_bundle_id
      ORDER BY src.verified_at DESC, src.id
      LIMIT 1
    ),
    p_acquired_at
  FROM public.sto_ship_bundle_items i
  WHERE i.bundle_id = p_bundle_id
  ON CONFLICT (user_id, sto_ship_id)
  DO UPDATE SET
    ownership_status = 'owned',
    acquisition_source_id = COALESCE(
      EXCLUDED.acquisition_source_id,
      public.sto_ship_ownership.acquisition_source_id
    ),
    acquired_at = COALESCE(
      EXCLUDED.acquired_at,
      public.sto_ship_ownership.acquired_at
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_sto_ship_bundle(uuid, timestamptz) TO authenticated;
