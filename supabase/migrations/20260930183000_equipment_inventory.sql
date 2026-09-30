CREATE TABLE public.equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  slot text,
  mark text,
  rarity text,
  mods text,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_items TO authenticated;
GRANT ALL ON public.equipment_items TO service_role;
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own equipment" ON public.equipment_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER equipment_items_updated_at BEFORE UPDATE ON public.equipment_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX equipment_items_user_idx ON public.equipment_items (user_id);
CREATE INDEX equipment_items_name_idx ON public.equipment_items (lower(name));

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  quantity integer NOT NULL DEFAULT 1,
  location text NOT NULL DEFAULT 'Character',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inventory" ON public.inventory_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX inventory_items_user_idx ON public.inventory_items (user_id);
CREATE INDEX inventory_items_name_idx ON public.inventory_items (lower(name));