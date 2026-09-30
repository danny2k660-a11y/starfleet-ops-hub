CREATE TABLE public.sto_ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ship_class text,
  faction text,
  tier text,
  hull_modifier numeric,
  shield_modifier numeric,
  turn_rate numeric,
  impulse_modifier numeric,
  inertia numeric,
  base_hull integer,
  base_shields integer,
  fore_weapon_slots integer,
  aft_weapon_slots integer,
  experimental_weapon_slot boolean,
  hangar_bays integer,
  engineering_console_slots integer,
  science_console_slots integer,
  tactical_console_slots integer,
  universal_console_slots integer,
  bridge_officer_stations jsonb,
  ship_trait text,
  special_console text,
  special_weapons text,
  special_mechanics text,
  description text,
  image_url text,
  source_reference text,
  data_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sto_ships TO authenticated;
GRANT ALL ON public.sto_ships TO service_role;
ALTER TABLE public.sto_ships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sto ships readable" ON public.sto_ships FOR SELECT TO authenticated USING (true);
CREATE TRIGGER sto_ships_updated_at BEFORE UPDATE ON public.sto_ships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX sto_ships_name_idx ON public.sto_ships (lower(name));

CREATE TABLE public.user_ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE RESTRICT,
  sto_ship_id uuid NOT NULL REFERENCES public.sto_ships(id) ON DELETE RESTRICT,
  custom_name text NOT NULL,
  t6_upgraded boolean NOT NULL DEFAULT false,
  t6x_upgraded boolean NOT NULL DEFAULT false,
  t6x2_upgraded boolean NOT NULL DEFAULT false,
  current_build_id uuid REFERENCES public.builds(id) ON DELETE SET NULL,
  theme_id uuid,
  notes text,
  ownership_status text NOT NULL DEFAULT 'owned',
  date_acquired date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ships TO authenticated;
GRANT ALL ON public.user_ships TO service_role;
ALTER TABLE public.user_ships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user ships" ON public.user_ships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_ships_updated_at BEFORE UPDATE ON public.user_ships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX user_ships_user_idx ON public.user_ships (user_id);
CREATE INDEX user_ships_character_idx ON public.user_ships (character_id);

CREATE OR REPLACE FUNCTION public.validate_user_ship()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.characters WHERE id = NEW.character_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'Character does not belong to this user';
  END IF;
  IF NEW.current_build_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.builds WHERE id = NEW.current_build_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'Build does not belong to this user';
  END IF;
  IF NEW.ownership_status NOT IN ('owned','wishlist','retired') THEN
    RAISE EXCEPTION 'Invalid ownership status';
  END IF;
  IF NEW.t6x2_upgraded THEN NEW.t6x_upgraded := true; END IF;
  IF NEW.t6x_upgraded THEN NEW.t6_upgraded := true; END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.validate_user_ship() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER user_ships_validate BEFORE INSERT OR UPDATE ON public.user_ships FOR EACH ROW EXECUTE FUNCTION public.validate_user_ship();

INSERT INTO public.sto_ships (name, ship_class, faction, tier, description, source_reference, data_version) VALUES
('Test Ship Alpha (placeholder)', 'Test class', 'Federation', 'T6', 'Test record for demonstrating the Add Ship workflow. No official statistics entered.', 'Test data — not official', 'test'),
('Test Ship Bravo (placeholder)', 'Test class', 'Klingon Empire', 'T6', 'Test record for demonstrating the Add Ship workflow. No official statistics entered.', 'Test data — not official', 'test');