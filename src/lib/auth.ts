import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode, loadDemoState } from "@/lib/demo";

function demoUser(): User {
  const profile = loadDemoState().profile;
  return { id: profile.id, email: "demo@local", user_metadata: { full_name: profile.display_name }, app_metadata: {}, aud: "authenticated", created_at: profile.created_at } as User;
}

/** Session-aware user for navigation and workspace access. Data access is still enforced by the backend. */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const syncDemo = () => {
      if (!active) return;
      if (isDemoMode()) {
        setUser(demoUser());
        setReady(true);
      } else {
        supabase.auth.getSession().then(({ data }) => {
          if (!active) return;
          setUser(data.session?.user ?? null);
          setReady(true);
        }).catch(() => {
          if (!active) return;
          setUser(null);
          setReady(true);
        });
      }
    };
    syncDemo();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isDemoMode()) setUser(session?.user ?? null);
      setReady(true);
    });
    window.addEventListener("revisionshield-demo-change", syncDemo);
    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.removeEventListener("revisionshield-demo-change", syncDemo);
    };
  }, []);

  return { user, ready, demo: isDemoMode() };
}
