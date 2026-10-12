import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCharacters from "./tools/list-characters";
import listMyShips from "./tools/list-my-ships";
import searchShipDatabase from "./tools/search-ship-database";
import listBuilds from "./tools/list-builds";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "starfleet-ops-hub",
  title: "Starfleet Ops Hub",
  version: "0.1.0",
  instructions:
    "Read-only access to the signed-in captain's Star Trek Online characters, personal ships, builds, and the shared STO ship database. Never invent ship stats; missing values mean the data is not yet populated.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCharacters, listMyShips, searchShipDatabase, listBuilds],
});
