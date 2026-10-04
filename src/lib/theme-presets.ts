export type ThemePreset = {
  id: string;
  name: string;
  era: string;
  identity: string;
  preferredFactions: string[];
  guidance: string[];
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "terran-empire",
    name: "Terran Empire",
    era: "Mirror Universe",
    identity: "Imperial Terran military hardware and aggressive Mirror-Universe presentation.",
    preferredFactions: ["Terran", "Federation"],
    guidance: [
      "Prefer Terran/Mirror-Universe hulls and equipment where the game provides them.",
      "Use Imperial or Terran vanity/visual identity when available.",
      "Record any deliberate non-Terran component as a captured, repurposed or experimental asset in build notes.",
    ],
  },
  {
    id: "mirror-universe",
    name: "Mirror Universe",
    era: "Mirror Universe",
    identity: "Mirror-era identity without requiring a specific factional ship roster.",
    preferredFactions: ["Terran", "Federation", "Klingon", "Romulan"],
    guidance: [
      "Prioritize Mirror-universe ships, uniforms, weapons and consoles.",
      "Keep cross-faction equipment justified by the captain's story.",
    ],
  },
  {
    id: "federation-canon",
    name: "Federation Canon",
    era: "Prime Timeline",
    identity: "Federation Starfleet presentation with canon-first equipment choices.",
    preferredFactions: ["Federation"],
    guidance: [
      "Prefer Federation hulls and Starfleet equipment.",
      "Use the ship's era and on-screen identity as the primary selection rule.",
    ],
  },
  {
    id: "romulan-tal-shiar",
    name: "Romulan / Tal Shiar",
    era: "Romulan Republic / Tal Shiar",
    identity: "Romulan intelligence and Tal Shiar military identity.",
    preferredFactions: ["Romulan"],
    guidance: [
      "Prefer Romulan, Tal Shiar and intelligence-themed equipment.",
      "Use plasma or other lore-consistent weapon families where appropriate.",
    ],
  },
  {
    id: "klingon-warrior",
    name: "Klingon Warrior",
    era: "Klingon Empire",
    identity: "Klingon military identity and close-combat warrior presentation.",
    preferredFactions: ["Klingon"],
    guidance: [
      "Prefer Klingon hulls and Klingon-aligned equipment.",
      "Treat Federation technology as captured, experimental or diplomatic equipment when used.",
    ],
  },
  {
    id: "dominion",
    name: "Dominion",
    era: "Dominion War",
    identity: "Jem'Hadar and Dominion military presentation.",
    preferredFactions: ["Dominion", "Jem'Hadar", "Cardassian"],
    guidance: [
      "Prefer Dominion/Jem'Hadar ships and equipment.",
      "Use Cardassian assets only where the build concept supports the story.",
    ],
  },
  {
    id: "borg",
    name: "Borg",
    era: "Delta Quadrant",
    identity: "Borg collective / assimilated technology theme.",
    preferredFactions: ["Borg"],
    guidance: [
      "Prioritize Borg-derived or assimilated technology.",
      "Record non-Borg equipment as adapted or assimilated technology when appropriate.",
    ],
  },
];

export function getThemePreset(id?: string | null) {
  return THEME_PRESETS.find((theme) => theme.id === id) ?? null;
}
