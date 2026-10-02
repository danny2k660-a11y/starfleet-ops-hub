import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user) {
        return { user: sessionData.session.user };
      }

      const { data: anonymous, error: anonymousError } = await supabase.auth.signInAnonymously();

      if (anonymousError || !anonymous.user) {
        console.error("[STO Command Center] Native guest session unavailable:", anonymousError);
        throw redirect({
          to: "/auth",
          search: { reason: "guest_session_unavailable" },
        });
      }

      return { user: anonymous.user };
    } catch (error) {
      if (error && typeof error === "object" && "isRedirect" in error) throw error;
      console.error("[STO Command Center] Authentication bootstrap failed:", error);
      throw redirect({
        to: "/auth",
        search: { reason: "auth_bootstrap_failed" },
      });
    }
  },
  component: () => <Outlet />,
});
