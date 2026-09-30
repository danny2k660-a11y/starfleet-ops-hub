import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({ meta: [{ title: "Themes — STO Command Center" }] }),
  component: Page,
});

const presets = [
  { name: "Terran Empire", faction: "Terran", era: "Mirror Universe", priority: "Theme First", description: "Imperial Terran styling, ships, equipment and visual identity." },
  { name: "Romulan", faction: "Romulan", era: "Romulan", priority: "Theme First", description: "Romulan identity with room for non-themed performance builds." },
  { name: "Hur'q", faction: "Hur'q", era: "Dominion", priority: "Theme First", description: "Strict Hur'q carrier and swarm identity." },
  { name: "Discovery-era Terran", faction: "Terran", era: "Discovery", priority: "Theme First", description: "Discovery-era Terran Empire visual and equipment direction." },
  { name: "Canon / Screen Accurate", faction: "Any", era: "Any", priority: "Theme First", description: "Prioritise screen and canon accuracy over optimisation." },
];

function Page() {
  return <AppShell><div className="space-y-6"><div><h1 className="text-2xl font-semibold">Themes</h1><p className="text-sm text-muted-foreground">Build identity and theme rules — theme first, without forcing every build into the same box.</p></div><div className="grid gap-4 sm:grid-cols-2">{presets.map((p)=><Card key={p.name} className="border-primary/20"><CardHeader><CardTitle className="text-base">{p.name}</CardTitle></CardHeader><CardContent><div className="mb-2 flex gap-2 text-xs"><span className="rounded border px-2 py-1">{p.faction}</span><span className="rounded border px-2 py-1">{p.era}</span><span className="rounded border border-primary/30 px-2 py-1 text-primary">{p.priority}</span></div><p className="text-sm text-muted-foreground">{p.description}</p></CardContent></Card>)}</div></div></AppShell>;
}
