import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();

    if (!data.user) {
      const { data: anonymous, error: anonymousError } = await supabase.auth.signInAnonymously();
      if (anonymousError || !anonymous.user) throw redirect({ to: "/auth" });
      return { user: anonymous.user };
    }

    if (error) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
