-- Extend the 2026 current catalogue with ships confirmed by official STO
-- announcements. These entries are source-tracked, not STOWiki-verified.
INSERT INTO public.sto_ships
(name,ship_class,faction,tier,description,source_key,source_url,verified_at,data_version)
VALUES
('NX Escort Refit','Escort','Federation','T6','16th Anniversary Enterprise Bundle exclusive T6 ship.','official-sto-2026','https://playstartrekonline.com/en/news/article/11580444',NULL,'official-sto-2026'),
('Xindi-Primate Ateleth Dreadnought Cruiser','Dreadnought Cruiser','Xindi','T6','16th Anniversary Enterprise Bundle exclusive account-wide ship.','official-sto-2026','https://www.playstartrekonline.com/en/news/article/11580444',NULL,'official-sto-2026'),
('Damocles Class','Science Destroyer','Federation/Klingon','T6','Infinity Lock Box T6 ship released in 2026.','official-sto-2026','https://www.playstartrekonline.com/en/news/article/11581276',NULL,'official-sto-2026'),
('Constitution Pilot Multi-Mission Cruiser','Multi-Mission Cruiser','Federation','T6','60th Anniversary Starship Icons Prize Pack T6 ship based on Strange New Worlds Constitution.','official-sto-2026','https://www.playstartrekonline.com/en/news/article/11582931',NULL,'official-sto-2026')
ON CONFLICT DO NOTHING;

INSERT INTO public.sto_data_sources
(source_key,name,base_url,source_type,purpose,notes)
VALUES
('official-sto-2026','Star Trek Online official 2026 announcements','https://www.playstartrekonline.com/','official','Current ship identity and release provenance for 2026 additions.','Official release provenance is distinct from STOWiki verification; verified_at remains null until the ship definition is independently corroborated in the chosen wiki source.')
ON CONFLICT (source_key) DO UPDATE SET
name=EXCLUDED.name,base_url=EXCLUDED.base_url,source_type=EXCLUDED.source_type,
purpose=EXCLUDED.purpose,notes=EXCLUDED.notes,updated_at=now();