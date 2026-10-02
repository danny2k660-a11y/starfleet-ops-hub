-- Acquisition intelligence and account-level ownership for the STO ship catalogue.
-- A catalogue definition describes the ship itself. These tables describe how it can
-- be acquired and whether the signed-in player owns the account-level unlock.
CREATE TABLE public.sto_ship_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  availability_status text NOT NULL DEFAULT 'current'
    CHECK (availability_status IN ('current','rotating','retired','event','unknown')),
  price_currency text,
  price_amount numeric,
  account_unlock boolean NOT NULL DEFAULT true,
  source_reference text,
  verified_at timestamptz NOT NULL DEFAULT now(),
  data_version text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sto_ship_bundles TO authenticated;
GRANT ALL ON public.sto_ship_bundles TO service_role;
ALTER TABLE public.sto_ship_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sto ship bundles readable" ON public.sto_ship_bundles
  FOR SELECT TO authenticated USING (true);
CREATE TRIGGER sto_ship_bundles_updated_at BEFORE UPDATE ON public.sto_ship_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sto_ship_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sto_ship_id uuid NOT NULL REFERENCES public.sto_ships(id) ON DELETE CASCADE,
  source_type text NOT NULL
    CHECK (source_type IN ('c_store','bundle','mudd','lobi','lockbox','promo','event','fleet','reputation','coupon','mission','other')),
  source_name text NOT NULL,
  availability_status text NOT NULL DEFAULT 'unknown'
    CHECK (availability_status IN ('current','rotating','retired','event','unknown')),
  price_currency text,
  price_amount numeric,
  bundle_id uuid REFERENCES public.sto_ship_bundles(id) ON DELETE SET NULL,
  account_unlock boolean NOT NULL DEFAULT true,
  character_restriction text,
  source_reference text,
  verified_at timestamptz NOT NULL DEFAULT now(),
  data_version text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sto_ship_sources TO authenticated;
GRANT ALL ON public.sto_ship_sources TO service_role;
ALTER TABLE public.sto_ship_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sto ship sources readable" ON public.sto_ship_sources
  FOR SELECT TO authenticated USING (true);
CREATE TRIGGER sto_ship_sources_updated_at BEFORE UPDATE ON public.sto_ship_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX sto_ship_sources_ship_idx ON public.sto_ship_sources (sto_ship_id);
CREATE INDEX sto_ship_sources_status_idx ON public.sto_ship_sources (availability_status);
CREATE INDEX sto_ship_sources_bundle_idx ON public.sto_ship_sources (bundle_id);

CREATE TABLE public.sto_ship_bundle_items (
  bundle_id uuid NOT NULL REFERENCES public.sto_ship_bundles(id) ON DELETE CASCADE,
  sto_ship_id uuid NOT NULL REFERENCES public.sto_ships(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'ship',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  account_unlock boolean NOT NULL DEFAULT true,
  PRIMARY KEY (bundle_id, sto_ship_id)
);
GRANT SELECT ON public.sto_ship_bundle_items TO authenticated;
GRANT ALL ON public.sto_ship_bundle_items TO service_role;
ALTER TABLE public.sto_ship_bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sto ship bundle items readable" ON public.sto_ship_bundle_items
  FOR SELECT TO authenticated USING (true);

CREATE TABLE public.sto_ship_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sto_ship_id uuid NOT NULL REFERENCES public.sto_ships(id) ON DELETE CASCADE,
  ownership_status text NOT NULL DEFAULT 'owned'
    CHECK (ownership_status IN ('owned','wishlist','retired')),
  acquisition_source_id uuid REFERENCES public.sto_ship_sources(id) ON DELETE SET NULL,
  acquired_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sto_ship_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sto_ship_ownership TO authenticated;
GRANT ALL ON public.sto_ship_ownership TO service_role;
ALTER TABLE public.sto_ship_ownership ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sto ship ownership" ON public.sto_ship_ownership
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER sto_ship_ownership_updated_at BEFORE UPDATE ON public.sto_ship_ownership
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX sto_ship_ownership_user_idx ON public.sto_ship_ownership (user_id);
CREATE INDEX sto_ship_ownership_ship_idx ON public.sto_ship_ownership (sto_ship_id);

CREATE OR REPLACE FUNCTION public.validate_sto_ship_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.acquisition_source_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.sto_ship_sources
       WHERE id = NEW.acquisition_source_id
         AND sto_ship_id = NEW.sto_ship_id
     ) THEN
    RAISE EXCEPTION 'Acquisition source does not belong to this ship';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_sto_ship_ownership() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sto_ship_ownership_validate
BEFORE INSERT OR UPDATE ON public.sto_ship_ownership
FOR EACH ROW EXECUTE FUNCTION public.validate_sto_ship_ownership();

-- Atomically mark every ship in a verified bundle as owned for the current account.
-- This is deliberately account-level; claiming a character instance remains a separate action.
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
  IF NOT EXISTS (SELECT 1 FROM public.sto_ship_bundles WHERE id = p_bundle_id) THEN
    RAISE EXCEPTION 'Bundle not found';
  END IF;

  INSERT INTO public.sto_ship_ownership (user_id, sto_ship_id, ownership_status, acquired_at)
  SELECT v_user, i.sto_ship_id, 'owned', p_acquired_at
  FROM public.sto_ship_bundle_items i
  WHERE i.bundle_id = p_bundle_id
  ON CONFLICT (user_id, sto_ship_id)
  DO UPDATE SET ownership_status = 'owned', acquired_at = COALESCE(EXCLUDED.acquired_at, public.sto_ship_ownership.acquired_at);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_sto_ship_bundle(uuid, timestamptz) TO authenticated;

CREATE INDEX IF NOT EXISTS sto_ship_bundles_status_idx ON public.sto_ship_bundles (availability_status);
