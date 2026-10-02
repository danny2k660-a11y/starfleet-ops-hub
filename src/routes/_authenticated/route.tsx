import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          if (!cancelled) {
            await navigate({ to: "/auth", replace: true });
          }
          return;
        }

        if (!cancelled) setCheckingSession(false);
      } catch (error) {
        console.error("[STO Command Center] Session check failed:", error);
        if (!cancelled) {
          await navigate({ to: "/auth", replace: true });
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="lcars-label">Command Console</p>
          <p className="mt-3 text-sm text-muted-foreground">Checking command session…</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
