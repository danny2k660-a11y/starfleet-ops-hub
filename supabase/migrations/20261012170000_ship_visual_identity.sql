-- Persist per-ship visual identity and vanity choices independently of build equipment.
alter table public.user_ships
  add column if not exists prefix text,
  add column if not exists vanity_shield text,
  add column if not exists hull_material text,
  add column if not exists visual_notes text,
  add column if not exists visual_config jsonb not null default '{}'::jsonb;
