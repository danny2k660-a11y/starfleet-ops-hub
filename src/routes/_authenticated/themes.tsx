import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { THEME_PRESETS } from "@/lib/theme-presets";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({ meta: [{ title: "Themes — STO Command Center" }] }),
  component: ThemesPage,
});

function ThemesPage() {
  const qc = useQueryClient();
  const ships = useQuery({
    queryKey: ["theme_ships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_ships")
        .select("id,custom_name,theme_id,ownership_status,characters(name),sto_ships(name,faction,ship_class)")
        .eq("ownership_status", "owned")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const assign = useMutation({
    mutationFn: async ({ shipId, themeId }: { shipId: string; themeId: string }) => {
      const { error } = await supabase.from("user_ships").update({ theme_id: themeId === "none" ? null : themeId } as never).eq("id", shipId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["theme_ships"] });
      await qc.invalidateQueries({ queryKey: ["user_ships"] });
      toast.success("Theme identity saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Themes" subtitle="Theme identity and compliance">
      <div className="space-y-6">
        <div>
          <p className="lcars-label">Theme library</p>
          <h1 className="font-display text-2xl tracking-wide text-primary sm:text-3xl">Build the story first</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Assign a theme identity to each owned ship. The app keeps the theme separate from DPS optimisation so a build can be audited against the captain's intended identity.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {THEME_PRESETS.map((theme) => (
            <div key={theme.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="lcars-label">{theme.era}</p>
                  <h2 className="font-display text-lg text-primary">{theme.name}</h2>
                </div>
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-2 text-sm">{theme.identity}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {theme.preferredFactions.map((faction) => <Badge key={faction} variant="outline">{faction}</Badge>)}
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {theme.guidance.map((rule) => <li key={rule}>• {rule}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="lcars-label">Fleet theme assignments</p>
              <p className="text-sm text-muted-foreground">Choose a theme for each owned ship. “No theme” leaves the ship unassigned.</p>
            </div>
            <Badge variant="outline">{ships.data?.filter((s) => s.theme_id).length ?? 0} themed</Badge>
          </div>

          {ships.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading fleet…</p>
          ) : ships.isError ? (
            <p className="mt-4 text-sm text-primary">Could not load your fleet theme assignments.</p>
          ) : (ships.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No owned ships are registered yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {(ships.data ?? []).map((ship) => {
                const current = THEME_PRESETS.find((theme) => theme.id === ship.theme_id);
                return (
                  <div key={ship.id} className="flex flex-col gap-3 rounded border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-primary">{ship.custom_name || ship.sto_ships?.name || "Unnamed ship"}</p>
                      <p className="text-xs text-muted-foreground">
                        {ship.characters?.name || "Unassigned character"} · {ship.sto_ships?.faction || "Faction unknown"} · {ship.sto_ships?.ship_class || "Class unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {current && <Badge variant="outline">{current.name}</Badge>}
                      <Select value={ship.theme_id || "none"} onValueChange={(themeId) => assign.mutate({ shipId: ship.id, themeId })}>
                        <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Select theme" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No theme</SelectItem>
                          {THEME_PRESETS.map((theme) => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded border border-primary/20 bg-primary/5 p-4">
          <p className="lcars-label">How compliance works</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Theme identity is now stored on the ship instance. The build editor can use that identity to show the intended rules without pretending that an unverified item catalogue is canon. Automatic item-by-item compliance will only be marked when the underlying catalogue provides enough structured evidence.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
