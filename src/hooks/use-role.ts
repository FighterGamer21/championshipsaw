import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "owner" | "admin" | "moderator";

const REQUEST_TIMEOUT_MS = 8000;

let cachedUserId: string | null = null;
let cachedRoles: Role[] = [];
let hasRoleCache = false;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Refresh the page or sign in again.`));
    }, REQUEST_TIMEOUT_MS);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export function useRole() {
  const [loading, setLoading] = useState(!hasRoleCache);
  const [userId, setUserId] = useState<string | null>(cachedUserId);
  const [roles, setRoles] = useState<Role[]>(cachedRoles);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const sessionReadyRef = useRef(false);

  const loadRoles = useCallback(async (uid: string | null) => {
    const canUseCache = hasRoleCache && cachedUserId === uid;
    setLoading(!canUseCache);
    setError(null);

    if (!uid) {
      cachedUserId = null;
      cachedRoles = [];
      hasRoleCache = true;
      setUserId(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      if (canUseCache) {
        setRoles(cachedRoles);
      }

      const { data, error: rolesError } = await withTimeout(
        supabase.from("user_roles").select("role").eq("user_id", uid),
        "Loading admin role",
      );

      if (rolesError) throw rolesError;

      setUserId(uid);
      const nextRoles = ((data ?? []) as { role: Role }[]).map((r) => r.role);
      cachedUserId = uid;
      cachedRoles = nextRoles;
      hasRoleCache = true;
      setRoles(nextRoles);
    } catch (err) {
      console.error("[Admin auth]", err);
      setUserId(uid);
      if (canUseCache) {
        setRoles(cachedRoles);
      } else {
        setRoles([]);
        setError(err instanceof Error ? err.message : "Could not load admin role.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const setSessionUser = (uid: string | null, ready = false) => {
      if (!active) return;
      setUserId(uid);
      if (ready) {
        sessionReadyRef.current = true;
        setSessionReady(true);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSessionUser(session?.user?.id ?? null, event === "INITIAL_SESSION" || sessionReadyRef.current);
    });

    withTimeout(supabase.auth.getSession(), "Loading session")
      .then(({ data }) => setSessionUser(data.session?.user?.id ?? null, true))
      .catch((err) => {
        if (!active) return;
        console.error("[Admin auth]", err);
        setError(err instanceof Error ? err.message : "Could not load session.");
        sessionReadyRef.current = true;
        setSessionReady(true);
        setLoading(false);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    loadRoles(userId);
  }, [loadRoles, sessionReady, userId]);

  const isOwner = roles.includes("owner");
  const isAdmin = isOwner || roles.includes("admin");
  const isModerator = isAdmin || roles.includes("moderator");
  return { loading, error, userId, roles, isOwner, isAdmin, isModerator, refresh: () => loadRoles(userId) };
}
