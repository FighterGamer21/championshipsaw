-- Fix admin panel writes for the role model used by the app UI.
-- Older policies only checked the literal "admin" role, so owner accounts could
-- open admin screens but fail player, round, settings, and elimination writes.

DROP POLICY IF EXISTS "Admins manage players" ON public.players;
DROP POLICY IF EXISTS "Admins delete players" ON public.players;
CREATE POLICY "Moderators manage players" ON public.players FOR UPDATE TO authenticated
  USING (public.is_moderator_or_above(auth.uid()))
  WITH CHECK (public.is_moderator_or_above(auth.uid()));
CREATE POLICY "Admins delete players" ON public.players FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admins manage eliminations" ON public.eliminations;
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

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
