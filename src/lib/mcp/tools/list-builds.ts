import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_builds",
  title: "List builds",
  description: "List the signed-in captain's ship builds.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("builds")
      .select("id,name,role,status,notes,ship_instance_id")
      .order("name");
    if (error) throw new ToolError(error.message);
    const builds = (data ?? []).map((b) => ({ ...b }));
    return {
      content: [{ type: "text", text: JSON.stringify(builds) }],
      structuredContent: { builds },
    };
  },
});
