-- Fix all admin panel writes for the role model used by the app UI.
-- Older policies only checked the literal "admin" role, so owner accounts could
-- open admin screens but fail player, round, settings, posts, and elimination writes.

CREATE OR REPLACE FUNCTION public.is_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'owner')
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('owner','admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_above(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('owner','admin','moderator'))
$$;

CREATE OR REPLACE FUNCTION public.claim_role()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  has_owner boolean;
BEGIN
  IF uid IS NULL THEN RETURN 'unauthenticated'; END IF;
  SELECT email INTO uemail FROM auth.users WHERE id = uid;

  IF lower(coalesce(uemail,'')) = 'fightergamerofficial1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    RETURN 'owner';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('owner','admin')) INTO has_owner;
  IF NOT has_owner THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    RETURN 'admin';
  END IF;

  RETURN 'none';
END $$;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role FROM public.user_roles
WHERE role = 'owner'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role FROM auth.users
WHERE lower(email) = 'fightergamerofficial1@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'fightergamerofficial1@gmail.com'
ON CONFLICT DO NOTHING;

GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_above(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_role() TO authenticated;

DROP POLICY IF EXISTS "Admins manage players" ON public.players;
DROP POLICY IF EXISTS "Admins delete players" ON public.players;
DROP POLICY IF EXISTS "Moderators manage players" ON public.players;
CREATE POLICY "Moderators manage players" ON public.players FOR UPDATE TO authenticated
  USING (public.is_moderator_or_above(auth.uid()))
  WITH CHECK (public.is_moderator_or_above(auth.uid()));
CREATE POLICY "Admins delete players" ON public.players FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins manage eliminations" ON public.eliminations;
DROP POLICY IF EXISTS "Moderators manage eliminations" ON public.eliminations;
CREATE POLICY "Moderators manage eliminations" ON public.eliminations FOR ALL TO authenticated
  USING (public.is_moderator_or_above(auth.uid()))
  WITH CHECK (public.is_moderator_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins manage rounds" ON public.rounds;
CREATE POLICY "Admins manage rounds" ON public.rounds FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins insert settings" ON public.settings;
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins insert settings" ON public.settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins manage posts" ON public.posts;
CREATE POLICY "Admins manage posts" ON public.posts FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins manage bans" ON public.bans;
CREATE POLICY "Admins manage bans" ON public.bans FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.eliminations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bans;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
