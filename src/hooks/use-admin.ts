import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async (uid: string | null) => {
      if (!uid) {
        if (mounted) { setUserId(null); setIsAdmin(false); setLoading(false); }
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      if (mounted) { setUserId(uid); setIsAdmin(!!data); setLoading(false); }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id ?? null));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { loading, userId, isAdmin };
}
