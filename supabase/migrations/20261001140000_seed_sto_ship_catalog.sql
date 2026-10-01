-- Initial STO ship catalogue seed.
-- Names are real STO ships already represented in the user's fleet planning data.
INSERT INTO public.sto_ships (name, ship_class, faction, tier, description, data_version)
SELECT v.name, v.ship_class, v.faction, v.tier, v.description, 'catalog-1'
FROM (VALUES
  ('Rex Pilot Escort','Pilot Escort','Federation/Terran','T6','Terran Rex pilot escort.','catalog'),
  ('Terran Adamant Heavy Raider','Heavy Raider','Terran Empire','T6','Terran Adamant heavy raider.','catalog'),
  ('Mirror Crossfield Science Destroyer','Science Destroyer','Terran Empire','T6','Mirror Crossfield science destroyer.','catalog'),
  ('Concorde Operations Command Battlecruiser','Command Battlecruiser','Alliance/Federation','T6','Concorde operations command battlecruiser.','catalog'),
  ('Geneva Science Command Battlecruiser','Science Command Battlecruiser','Federation','T6','Geneva science command battlecruiser.','catalog'),
  ('Styx Terran Dreadnought Cruiser','Dreadnought Cruiser','Terran Empire','T6','Styx Terran dreadnought cruiser.','catalog'),
  ('Presidio Tactical Command Battlecruiser','Command Battlecruiser','Federation','T6','Presidio tactical command battlecruiser.','catalog'),
  ('Paladin Temporal Battlecruiser','Temporal Battlecruiser','Federation','T6','Paladin temporal battlecruiser.','catalog'),
  ('K''vort Temporal Flight-Deck Cruiser','Temporal Flight-Deck Cruiser','Klingon Empire','T6','K''vort temporal flight-deck cruiser.','catalog'),
  ('Noble Intel Battlecruiser','Intel Battlecruiser','Federation','T6','Noble intel battlecruiser.','catalog'),
  ('Gomtuu','Star Cruiser','Independent','T6','Gomtuu space whale ship.','catalog'),
  ('Empress Miracle Worker Alliance Juggernaut','Juggernaut','Alliance','T6','Empress Miracle Worker Alliance Juggernaut.','catalog'),
  ('Voth Stronghold Miracle Worker Dreadnought Cruiser','Dreadnought Cruiser','Voth','T6','Voth Stronghold miracle worker dreadnought cruiser.','catalog'),
  ('Garrett Command Alliance Dreadnought Cruiser','Dreadnought Cruiser','Alliance','T6','Garrett command alliance dreadnought cruiser.','catalog'),
  ('Federation Intel Holoship','Intel Ship','Federation','T6','Federation intelligence holoship.','catalog'),
  ('Merchantman Freighter','Freighter','Independent','T6','Merchantman freighter.','catalog'),
  ('Hur''q Vedcrid Hive Dreadnought Carrier','Dreadnought Carrier','Hur''q','T6','Hur''q Vedcrid Hive dreadnought carrier.','catalog'),
  ('Legendary Scimitar Intel Dreadnought Warbird','Dreadnought Warbird','Romulan Republic','T6','Legendary Scimitar intel dreadnought warbird.','catalog'),
  ('Thrai Dreadnought Warbird','Dreadnought Warbird','Romulan Republic','T6','Thrai dreadnought warbird.','catalog'),
  ('Breen Yod-Thot Dreadnought Carrier','Dreadnought Carrier','Breen','T6','Breen Yod-Thot dreadnought carrier.','catalog'),
  ('Herald Quas Flight Deck Carrier','Flight-Deck Carrier','Herald','T6','Herald Quas flight deck carrier.','catalog'),
  ('Gorn Hunter Pilot Raider','Pilot Raider','Gorn','T6','Gorn Hunter pilot raider.','catalog'),
  ('Tal Shiar Khlinae Adapted Battlecruiser','Battlecruiser','Romulan/Tal Shiar','T6','Tal Shiar Khlinae adapted battlecruiser.','catalog'),
  ('Bajoran Interceptor','Interceptor','Bajoran','T6','Bajoran interceptor.','catalog'),
  ('Pathfinder Long Range Science Vessel','Science Vessel','Federation','T6','Pathfinder long range science vessel.','catalog'),
  ('Terran Trailblazer Science Warship','Science Warship','Terran Empire','T6','Terran Trailblazer science warship.','catalog'),
  ('Adamant Heavy Raider','Heavy Raider','Federation','T6','Adamant heavy raider.','catalog')
) AS v(name, ship_class, faction, tier, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sto_ships s WHERE lower(s.name) = lower(v.name)
);
