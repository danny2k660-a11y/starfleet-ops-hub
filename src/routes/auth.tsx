import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radar, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "STO Command Center" },
      {
        name: "description",
        content: "STO Command Center — your personal Star Trek Online fleet operations console.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Initialising command console…");

  useEffect(() => {
    let cancelled = false;

    async function initialiseGuestSession() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        let session = sessionData.session;

        if (!session && Capacitor.isNativePlatform()) {
          const saved = await Preferences.get({ key: "sto-command-session" });
          if (saved.value) {
            try {
              const parsed = JSON.parse(saved.value);
              const restored = await supabase.auth.setSession(parsed);
              session = restored.data.session;
            } catch (restoreError) {
              console.warn("[STO Command Center] Saved session restore failed:", restoreError);
            }
          }
        }

        if (session) {
          if (Capacitor.isNativePlatform()) {
            await Preferences.set({
              key: "sto-command-session",
              value: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            });
          }
          if (!cancelled) await navigate({ to: "/dashboard", replace: true });
          return;
        }

        setMessage("Establishing device command session…");
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;

        if (Capacitor.isNativePlatform() && data.session) {
          await Preferences.set({
            key: "sto-command-session",
            value: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });
        }

        if (!cancelled) {
          await navigate({ to: "/dashboard", replace: true });
        }
      } catch (error) {
        console.error("[STO Command Center] Guest session failed:", error);
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? `Command session could not be started: ${error.message}`
              : "Command session could not be started.",
          );
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (Capacitor.isNativePlatform() && nextSession) {
        void Preferences.set({
          key: "sto-command-session",
          value: JSON.stringify({
            access_token: nextSession.access_token,
            refresh_token: nextSession.refresh_token,
          }),
        });
      }
    });

    initialiseGuestSession();
    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-primary/50 text-primary glow-primary">
          <Radar className="size-7" />
        </div>
        <p className="lcars-label mt-5">Command Console</p>
        <h1 className="mt-1 text-2xl">STO Command Center</h1>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>{message}</span>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          No Google or email sign-in is required. This device uses an anonymous command session.
        </p>
      </div>
    </div>
  );
}
