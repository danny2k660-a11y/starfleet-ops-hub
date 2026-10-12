import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_characters",
  title: "List characters",
  description: "List the signed-in captain's Star Trek Online characters.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("characters")
      .select("id,name,faction,career,species,level,notes")
      .order("name");
    if (error) throw new ToolError(error.message);
    const characters = (data ?? []).map((c) => ({ ...c }));
    return {
      content: [{ type: "text", text: JSON.stringify(characters) }],
      structuredContent: { characters },
    };
  },
});
