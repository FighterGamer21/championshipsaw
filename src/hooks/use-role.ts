import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "owner" | "admin" | "moderator";

export function useRole() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    let mounted = true;
    const check = async (uid: string | null) => {
      if (!uid) {
        if (mounted) { setUserId(null); setRoles([]); setLoading(false); }
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (mounted) {
        setUserId(uid);
        setRoles(((data ?? []) as { role: Role }[]).map((r) => r.role));
        setLoading(false);
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user?.id ?? null));
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id ?? null));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const isOwner = roles.includes("owner");
  const isAdmin = isOwner || roles.includes("admin");
  const isModerator = isAdmin || roles.includes("moderator");
  return { loading, userId, roles, isOwner, isAdmin, isModerator };
}
