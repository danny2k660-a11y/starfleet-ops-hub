import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_ships",
  title: "List my ships",
  description: "List the signed-in captain's personal ships, optionally for one character.",
  inputSchema: {
    character_id: z.string().uuid().optional().describe("Only ships owned by this character."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ character_id }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("user_ships")
      .select("id,custom_name,ownership_status,notes,character_id,sto_ship_id,current_build_id,t6_upgraded,t6x_upgraded,t6x2_upgraded,date_acquired")
      .order("custom_name");
    if (character_id) q = q.eq("character_id", character_id);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const ships = (data ?? []).map((s) => ({ ...s }));
    return {
      content: [{ type: "text", text: JSON.stringify(ships) }],
      structuredContent: { ships },
    };
  },
});
