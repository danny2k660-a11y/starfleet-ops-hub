import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_ship_database",
  title: "Search ship database",
  description: "Search the shared STO ship database by name or class and return base stats as recorded (empty fields mean not yet populated).",
  inputSchema: {
    query: z.string().trim().min(1).describe("Part of a ship name or class."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query }, ctx) => {
    const safe = query.replace(/[%,()]/g, " ");
    const { data, error } = await supabaseForUser(ctx)
      .from("sto_ships")
      .select("id,name,ship_class,faction,tier,hull_modifier,shield_modifier,turn_rate,impulse_modifier,inertia,base_hull,base_shields,fore_weapon_slots,aft_weapon_slots,hangar_bays,experimental_weapon_slot,ship_trait,special_console")
      .or(`name.ilike.%${safe}%,ship_class.ilike.%${safe}%`)
      .limit(25);
    if (error) throw new ToolError(error.message);
    const ships = (data ?? []).map((s) => ({ ...s }));
    return {
      content: [{ type: "text", text: ships.length ? JSON.stringify(ships) : "No matching ships. Ship data may not yet be populated." }],
      structuredContent: { ships },
    };
  },
});
