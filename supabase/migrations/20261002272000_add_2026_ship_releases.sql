-- Add verified-by-publication identity records for 2026 T6 releases that post-date
-- the community 2025-11-11 baseline. These are NOT STOWiki-verified.
INSERT INTO public.sto_ships (name,ship_class,faction,tier,description,source_key,source_url,verified_at,data_version)
VALUES
('NP Miracle Worker Light Escort','Light Escort','Federation','T6','2026 Enterprise Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/04/05/an-enterprising-value-value-series-and-the-16th-anniversary-enterprise-starships-bundle/',NULL,'community-current-2026'),
('Andorian Kumari Pilot Light Battlecruiser','Light Battlecruiser','Federation/Andorian','T6','2026 Enterprise Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/04/05/an-enterprising-value-value-series-and-the-16th-anniversary-enterprise-starships-bundle/',NULL,'community-current-2026'),
('NV Multi-Mission Temporal Cruiser','Multi-Mission Temporal Cruiser','Federation','T6','2026 Enterprise Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/04/05/an-enterprising-value-value-series-and-the-16th-anniversary-enterprise-starships-bundle/',NULL,'community-current-2026'),
('Suurok Intel Science Destroyer','Science Destroyer','Vulcan','T6','2026 Enterprise Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/04/05/an-enterprising-value-value-series-and-the-16th-anniversary-enterprise-starships-bundle/',NULL,'community-current-2026'),
('Armstrong Miracle Worker Dreadnought Cruiser','Dreadnought Cruiser','Federation/Kelvin Timeline','T6','2026 Kelvin Timeline Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/08/04/changing-the-timeline-revisiting-mudds-into-darkness-and-beyond-choice-pack-and-mega-bundle/',NULL,'community-current-2026'),
('Newton Command Science Carrier','Science Carrier','Federation/Kelvin Timeline','T6','2026 Kelvin Timeline Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/07/21/kelvin-timeline-bundle-the-things-that-really-red-matter/',NULL,'community-current-2026'),
('Salcombe Intel Escort','Intel Escort','Federation/Kelvin Timeline','T6','2026 Kelvin Timeline Bundle ship; identity sourced from contemporary release coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/07/21/kelvin-timeline-bundle-the-things-that-really-red-matter/',NULL,'community-current-2026'),
('Narada Miracle Worker Juggernaut','Miracle Worker Juggernaut','Romulan/Kelvin Timeline','T6','2026 Kelvin Timeline ship; identity sourced from contemporary review coverage.','community-current-2026','https://joeandsto.wordpress.com/2026/09/19/narada-ya-business-joe-previews-the-review-of-the-narada-with-a-contest/',NULL,'community-current-2026')
ON CONFLICT DO NOTHING;

INSERT INTO public.sto_data_sources
(source_key,name,base_url,source_type,purpose,notes)
VALUES
('community-current-2026','Contemporary STO release coverage','https://joeandsto.wordpress.com/','community','Identity coverage for post-2025 T6 releases absent from the imported 2025 catalogue baseline.','Used only for catalogue identity/provenance. Never treated as STOWiki verification.')
ON CONFLICT (source_key) DO UPDATE SET
name=EXCLUDED.name,base_url=EXCLUDED.base_url,source_type=EXCLUDED.source_type,
purpose=EXCLUDED.purpose,notes=EXCLUDED.notes,updated_at=now();