import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Record ship-granted items as unlocked/available for each selected character.
 * This never equips an item or activates a trait slot.
 */
export async function ensureShipUnlocksForCharacters(
  userId: string,
  ship: Pick<Tables<"sto_ships">, "id" | "name" | "ship_trait" | "special_console" | "special_weapons">,
  characterIds: string[],
  sourceName: string,
): Promise<void> {
  const ids = Array.from(new Set(characterIds.filter(Boolean)));
  if (!ids.length) return;

  const unlockRows: Array<{
    user_id: string; character_id: string; sto_ship_id: string;
    unlock_type: "ship_trait" | "console" | "special_weapon"; name: string; source_name: string;
  }> = [];
  for (const characterId of ids) {
    if (ship.ship_trait) unlockRows.push({ user_id: userId, character_id: characterId, sto_ship_id: ship.id, unlock_type: "ship_trait", name: ship.ship_trait, source_name: sourceName });
    if (ship.special_console) unlockRows.push({ user_id: userId, character_id: characterId, sto_ship_id: ship.id, unlock_type: "console", name: ship.special_console, source_name: sourceName });
    if (ship.special_weapons) unlockRows.push({ user_id: userId, character_id: characterId, sto_ship_id: ship.id, unlock_type: "special_weapon", name: ship.special_weapons, source_name: sourceName });
  }
  if (unlockRows.length) {
    const { error } = await supabase.from("character_ship_unlocks").upsert(unlockRows, {
      onConflict: "user_id,character_id,sto_ship_id,unlock_type,name",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  if (ship.ship_trait) {
    const { data: trait, error: traitError } = await supabase.from("trait_catalog").select("id").ilike("name", ship.ship_trait).limit(1).maybeSingle();
    if (traitError) throw traitError;
    if (trait) {
      for (const characterId of ids) {
        const { data: existing, error: existingError } = await supabase.from("character_traits").select("id")
          .eq("user_id", userId).eq("character_id", characterId).eq("trait_id", trait.id).limit(1).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) {
          const { error } = await supabase.from("character_traits").insert({
            user_id: userId, character_id: characterId, trait_id: trait.id, active: false, slot_index: null,
            domain: "space", trait_category: "starship", slot_group: null, source_type: "ship_unlock", source_name: ship.name,
          });
          if (error) throw error;
        }
      }
    }
  }

  const equipment = [
    ship.special_console ? { name: ship.special_console, category: "Console" } : null,
    ship.special_weapons ? { name: ship.special_weapons, category: "Experimental Weapon" } : null,
  ].filter((item): item is { name: string; category: string } => item !== null);
  for (const characterId of ids) {
    for (const item of equipment) {
      const { data: existing, error: lookupError } = await supabase.from("equipment_items").select("id")
        .eq("user_id", userId).eq("character_id", characterId).eq("name", item.name).eq("category", item.category).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      if (!existing) {
        const { error } = await supabase.from("equipment_items").insert({
          user_id: userId, character_id: characterId, name: item.name, category: item.category,
          quantity: 1, source: "Ship unlock", notes: "Unlocked from ship: " + ship.name,
        });
        if (error) throw error;
      }
    }
  }
}
