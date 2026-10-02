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

      console.warn("[STO Command Center] No active session; returning to the native sign-in bootstrap.");
      throw redirect({ to: "/auth" });
    } catch (error) {
      if (error && typeof error === "object" && "isRedirect" in error) throw error;
      console.error("[STO Command Center] Authentication bootstrap failed:", error);
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
